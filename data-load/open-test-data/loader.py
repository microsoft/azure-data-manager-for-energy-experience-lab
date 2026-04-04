#!/usr/bin/env python3
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

"""
Experience Lab TNO Data Loader

Loads pre-staged TNO open-test-data manifests into an Azure Data Manager for
Energy instance via the OSDU Storage API v2.

Expected volume mounts:
  /app/open-test-data/TNO/provided/  — pre-made JSON manifests
  /app/output/                       — loader output / logs

Required environment variables:
  OSDU_ENDPOINT    — e.g. https://myinstance.energy.azure.com
  AZURE_TENANT     — Azure AD tenant ID
  CLIENT_ID        — Service principal app ID
  CLIENT_SECRET    — Service principal secret
  DATA_PARTITION   — e.g. opendes
  LEGAL_TAG        — e.g. opendes-legal-tag-load
  ACL_VIEWER       — e.g. data.default.viewers@opendes.dataservices.energy
  ACL_OWNER        — e.g. data.default.owners@opendes.dataservices.energy
"""

import json
import logging
import os
import re
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
STORAGE_BATCH_SIZE = 500
MANIFEST_DIR = Path("/app/open-test-data/TNO/provided")
OUTPUT_DIR = Path("/app/output")

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("loader")


def get_config() -> dict:
    """Read configuration from environment variables."""
    required = {
        "endpoint":     "OSDU_ENDPOINT",
        "tenant_id":    "AZURE_TENANT",
        "client_id":    "CLIENT_ID",
        "client_secret": "CLIENT_SECRET",
        "partition":    "DATA_PARTITION",
        "legal_tag":    "LEGAL_TAG",
        "acl_viewer":   "ACL_VIEWER",
        "acl_owner":    "ACL_OWNER",
    }
    cfg = {}
    missing = []
    for key, env_var in required.items():
        val = os.environ.get(env_var, "").strip()
        if not val:
            missing.append(env_var)
        cfg[key] = val

    if missing:
        log.error("Missing required environment variables: %s", ", ".join(missing))
        sys.exit(1)

    return cfg


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
_token_cache: dict = {}


def get_token(cfg: dict) -> str:
    """Acquire an Azure AD token using client credentials, with caching."""
    now = time.time()
    if _token_cache.get("token") and _token_cache.get("expires", 0) > now + 60:
        return _token_cache["token"]

    url = f"https://login.microsoftonline.com/{cfg['tenant_id']}/oauth2/v2.0/token"
    resp = requests.post(url, data={
        "grant_type":    "client_credentials",
        "client_id":     cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "scope":         f"{cfg['client_id']}/.default",
    }, timeout=30)
    resp.raise_for_status()

    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires"] = now + int(data.get("expires_in", 3600))
    log.info("Acquired auth token (expires in %ss)", data.get("expires_in", "?"))
    return _token_cache["token"]


def api_headers(cfg: dict) -> dict:
    return {
        "Authorization":     f"Bearer {get_token(cfg)}",
        "data-partition-id": cfg["partition"],
        "Content-Type":      "application/json",
    }


# ---------------------------------------------------------------------------
# Manifest processing
# ---------------------------------------------------------------------------
def fixup_manifest_content(content: str, cfg: dict) -> str:
    """Replace namespace placeholders and partition references in manifest JSON."""
    partition = cfg["partition"]
    # Replace generic "osdu:" namespace with partition, but preserve "osdu:wks:" kinds
    content = content.replace('"osdu:', f'"{partition}:')
    content = content.replace(f'"{partition}:wks:', '"osdu:wks:')
    return content


def extract_records(manifest: dict | list, partition: str) -> list[dict]:
    """Extract individual records from a manifest structure."""
    if isinstance(manifest, list):
        return [r for r in manifest if isinstance(r, dict)]

    records = []
    for key in ("ReferenceData", "MasterData"):
        val = manifest.get(key, [])
        if isinstance(val, list):
            records.extend(r for r in val if isinstance(r, dict))

    data = manifest.get("Data", [])
    if isinstance(data, list):
        records.extend(r for r in data if isinstance(r, dict))
    elif isinstance(data, dict):
        wp = data.get("WorkProduct")
        if isinstance(wp, dict):
            records.append(wp)
        for sub_key in ("WorkProductComponents", "Datasets"):
            sub = data.get(sub_key, [])
            if isinstance(sub, list):
                records.extend(r for r in sub if isinstance(r, dict))

    # Resolve surrogate IDs for work-product-component records
    resolved = []
    for r in records:
        rec_id = str(r.get("id", ""))
        if rec_id.startswith("surrogate-key:"):
            kind = r.get("kind", "")
            name = r.get("data", {}).get("Name", "")
            if "work-product-component--" in kind and name:
                entity_type = kind.split(":")[2] if len(kind.split(":")) >= 3 else ""
                if entity_type:
                    safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', name)
                    r["id"] = f"{partition}:{entity_type}:{safe_name}"
                    resolved.append(r)
        else:
            resolved.append(r)

    return resolved


def inject_acl_legal(record: dict, cfg: dict) -> dict:
    """Set ACL and legal tag fields on a record."""
    record["acl"] = {
        "owners":  [cfg["acl_owner"]],
        "viewers": [cfg["acl_viewer"]],
    }
    record["legal"] = {
        "legaltags": [cfg["legal_tag"]],
        "otherRelevantDataCountries": ["US"],
    }
    return record


def collect_manifests(base_dir: Path) -> list[Path]:
    """Recursively find all JSON manifest files under base_dir."""
    if not base_dir.exists():
        return []
    return sorted(base_dir.rglob("*.json"))


# ---------------------------------------------------------------------------
# Storage API submission
# ---------------------------------------------------------------------------
def submit_records(cfg: dict, records: list[dict]) -> tuple[int, int, list[str]]:
    """Submit records to Storage API v2 in batches. Returns (ok, failed, errors)."""
    url = f"{cfg['endpoint'].rstrip('/')}/api/storage/v2/records?skipdupes=true"
    total_ok = 0
    total_fail = 0
    errors = []

    # Deduplicate by record ID
    seen: dict[str, dict] = {}
    for r in records:
        rid = r.get("id", "")
        if rid:
            seen[rid] = r
        else:
            seen[id(r)] = r
    deduped = list(seen.values())

    if len(deduped) < len(records):
        log.info("Deduplicated %d -> %d records", len(records), len(deduped))

    # Separate dot-ending IDs from non-dot IDs (cannot be mixed in same request)
    dot_records = [r for r in deduped if str(r.get("id", "")).endswith(".")]
    non_dot_records = [r for r in deduped if not str(r.get("id", "")).endswith(".")]
    ordered = non_dot_records + dot_records

    num_batches = (len(ordered) + STORAGE_BATCH_SIZE - 1) // STORAGE_BATCH_SIZE
    for i in range(0, len(ordered), STORAGE_BATCH_SIZE):
        batch = ordered[i:i + STORAGE_BATCH_SIZE]
        batch_num = i // STORAGE_BATCH_SIZE + 1

        # Split if a batch straddles the dot/non-dot boundary
        has_dot = any(str(r.get("id", "")).endswith(".") for r in batch)
        has_non_dot = any(not str(r.get("id", "")).endswith(".") for r in batch)
        if has_dot and has_non_dot:
            split_idx = next(j for j, r in enumerate(batch) if str(r.get("id", "")).endswith("."))
            sub_batches = [batch[:split_idx], batch[split_idx:]]
        else:
            sub_batches = [batch]

        for sub_batch in sub_batches:
            if not sub_batch:
                continue
            try:
                resp = requests.put(url, json=sub_batch, headers=api_headers(cfg), timeout=120)
                if resp.status_code in (200, 201):
                    count = resp.json().get("recordCount", len(sub_batch))
                    total_ok += count
                    log.info("Batch %d/%d: %d records stored", batch_num, num_batches, count)
                elif resp.status_code == 409:
                    total_ok += len(sub_batch)
                    log.info("Batch %d/%d: %d records (already exist)", batch_num, num_batches, len(sub_batch))
                else:
                    total_fail += len(sub_batch)
                    msg = f"Batch {batch_num}/{num_batches}: HTTP {resp.status_code}: {resp.text[:300]}"
                    errors.append(msg)
                    log.error(msg)
            except Exception as e:
                total_fail += len(sub_batch)
                msg = f"Batch {batch_num}/{num_batches}: {e}"
                errors.append(msg)
                log.error(msg)

    return total_ok, total_fail, errors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log.info("=== Experience Lab TNO Data Loader ===")
    cfg = get_config()

    log.info("Endpoint:  %s", cfg["endpoint"])
    log.info("Partition: %s", cfg["partition"])
    log.info("Legal Tag: %s", cfg["legal_tag"])

    # Verify auth before processing manifests
    log.info("Authenticating...")
    try:
        get_token(cfg)
    except Exception as e:
        log.error("Authentication failed: %s", e)
        sys.exit(1)

    # Collect manifests
    manifest_dir = Path(os.environ.get("MANIFEST_DIR", str(MANIFEST_DIR)))
    log.info("Scanning manifests in %s", manifest_dir)
    manifests = collect_manifests(manifest_dir)

    if not manifests:
        log.error("No manifest files found in %s", manifest_dir)
        sys.exit(1)

    log.info("Found %d manifest files", len(manifests))

    # Parse all manifests and collect records
    all_records: list[dict] = []
    parse_errors = 0

    for path in manifests:
        try:
            content = path.read_text(encoding="utf-8")
            content = fixup_manifest_content(content, cfg)
            manifest = json.loads(content)
            records = extract_records(manifest, cfg["partition"])
            records = [inject_acl_legal(r, cfg) for r in records]
            all_records.extend(records)
        except Exception as e:
            parse_errors += 1
            log.warning("Failed to parse %s: %s", path.name, e)

    log.info("Extracted %d records from %d manifests (%d parse errors)",
             len(all_records), len(manifests) - parse_errors, parse_errors)

    if not all_records:
        log.error("No records to load")
        sys.exit(1)

    # Submit to Storage API
    log.info("Submitting records to Storage API...")
    ok, failed, errors = submit_records(cfg, all_records)

    # Write summary to output
    summary = {
        "records_loaded": ok,
        "records_failed": failed,
        "manifests_processed": len(manifests) - parse_errors,
        "manifests_errored": parse_errors,
        "errors": errors[:20],
    }
    output_dir = Path(os.environ.get("OUTPUT_DIR", str(OUTPUT_DIR)))
    output_dir.mkdir(parents=True, exist_ok=True)
    summary_path = output_dir / "load-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))
    log.info("Summary written to %s", summary_path)

    log.info("=== Complete: %d loaded, %d failed ===", ok, failed)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
