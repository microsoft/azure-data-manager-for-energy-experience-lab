// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LegalTagProperties } from "./legal-tag-properties";

export interface LegalTag {
    name: string;
    description: string;
    properties: LegalTagProperties;
}

export interface LegalTagUpdateRequest {
  name: string;
  expirationDate: string;
  contractId: string;
  description: string;
}
