#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Check if az is installed, if not exit the script out.
var='az'
if ! which $var &>/dev/null; then
    echo "This script will not run until Azure CLI is installed and you have been are logged in."
    exit 1
fi

az=$(which az)

OPEN_TEST_DATA_SHARE_NAME="open-test-data"

function GetOpenTestDataSetAndUploadToFileShare() {
  echo "  Removing Existing Share"
  az storage share delete --name $OPEN_TEST_DATA_SHARE_NAME --account-name $CONTROL_PLANE_STORAGE --account-key $STORAGE_ACCOUNT_KEY --only-show-errors --output none
  
  OPEN_TEST_DATA_ARCHIVE_FILE_NAME=open-test-data.gz
  TEMP_DATA_DIR="osduTnoData"

  echo "  Downloading M10 Open Test Data (TNO) from OSDU"
  wget --quiet -O $OPEN_TEST_DATA_ARCHIVE_FILE_NAME https://community.opengroup.org/osdu/platform/data-flow/data-loading/open-test-data/-/archive/Azure/M10/open-test-data-Azure-M10.tar.gz
  
  echo "  Creating Open Test Data (TNO) directory structure"
  mkdir -p $TEMP_DATA_DIR/datasets/documents
  mkdir -p $TEMP_DATA_DIR/datasets/markers
  mkdir -p $TEMP_DATA_DIR/datasets/trajectories
  mkdir -p $TEMP_DATA_DIR/datasets/well-logs
  mkdir -p $TEMP_DATA_DIR/schema
  mkdir -p $TEMP_DATA_DIR/templates
  mkdir -p $TEMP_DATA_DIR/TNO/contrib
  mkdir -p $TEMP_DATA_DIR/TNO/provided

  echo "  Extracting Dataset Documents"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/datasets/documents --strip-components=5 open-test-data-Azure-M10/rc--1.0.0/1-data/3-provided/USGS_docs

  echo "  Extracting Dataset Markers"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/datasets/markers --strip-components=5 open-test-data-Azure-M10/rc--1.0.0/1-data/3-provided/markers

  echo "  Extracting Dataset Trajectories"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/datasets/trajectories --strip-components=5 open-test-data-Azure-M10/rc--1.0.0/1-data/3-provided/trajectories

  echo "  Extracting Dataset Well Logs"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/datasets/well-logs --strip-components=5 open-test-data-Azure-M10/rc--1.0.0/1-data/3-provided/well-logs

  echo "  Extracting Schemas"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/schema --strip-components=3 open-test-data-Azure-M10/rc--3.0.0/3-schema

  echo "  Extracting Templates"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/templates --strip-components=3 open-test-data-Azure-M10/rc--3.0.0/5-templates

  echo "  Extracting TNO Contrib"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/TNO/contrib --strip-components=5 open-test-data-Azure-M10/rc--3.0.0/1-data/3-provided/TNO

  echo "  Extracting TNO Provided"
  tar -xzf $OPEN_TEST_DATA_ARCHIVE_FILE_NAME -C $TEMP_DATA_DIR/TNO/provided --strip-components=3 open-test-data-Azure-M10/rc--3.0.0/4-instances/TNO
  
  echo "  Creating Share"
  az storage share create --name $OPEN_TEST_DATA_SHARE_NAME --account-name $CONTROL_PLANE_STORAGE --account-key $STORAGE_ACCOUNT_KEY --only-show-errors --output none

  echo "  Uploading Open Test Data (TNO) to Azure Storage File Share"
  $az storage file upload-batch --account-name $CONTROL_PLANE_STORAGE --account-key $STORAGE_ACCOUNT_KEY --destination $OPEN_TEST_DATA_SHARE_NAME --source $TEMP_DATA_DIR --only-show-errors --output none --no-progress
  echo "  Finished Uploading Open Test Data (TNO) to Azure Storage File Share"

  rm -rf $TEMP_DATA_DIR
  rm -f $OPEN_TEST_DATA_ARCHIVE_FILE_NAME
}

echo "Downloading Community Open Test Data (TNO) Data Set and Uploading to Azure Storage File Share"
GetOpenTestDataSetAndUploadToFileShare