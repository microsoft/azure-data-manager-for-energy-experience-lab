#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

###############################
## ARGUMENT INPUT            ##
###############################


# Check initial parameters
if [ -z "$subId" ]; then
    echo "Script cannot run if the subscription ID is not given"
    exit 1
fi

if [ -z "$tenantId" ]; then
    echo "Script cannot run if the tenant ID is not given"
    exit 1
fi

if [ -z "$user" ]; then
    echo "Script cannot run if the First User is not given"
    exit 1
fi

# Check if az is installed, if not exit the script out.
var='az'
if ! which $var &>/dev/null; then
    echo "This script will not run until Azure CLI is installed and you have been are logged in."
    exit 1
fi

az=$(which az)

# Login using the device code method.
$az login --tenant $tenantId --output none
sleep 5
$az account set --subscription $subId

OWNER_ROLES=$($az role assignment list --role 'Owner' -otsv 2>/dev/null)

if ! grep -q $subId <<< $OWNER_ROLES; then
  CONTRIBUTOR_ROLES=$($az role assignment list --role 'Contributor' -otsv 2>/dev/null)
  USER_ACCESS_ADMIN_ROLES=$($az role assignment list --role 'User Access Administrator' -otsv 2>/dev/null)

  if ! grep -q $subId <<< $CONTRIBUTOR_ROLES || ! grep -q $subId <<< $USER_ACCESS_ADMIN_ROLES; then
    echo "You do not have the proper permissions to run this script in subscription $subId"
    echo "You must have either Owner or Contributor + User Access Administrator roles at the subscription level"
    exit 1
  fi
fi

FIRST_USER=$user
FIRST_LEGAL_TAG_NAME="legal-tag-load"
AZURE_ACCOUNT=$($az account show --query '[tenantId, id, user.name]' -otsv 2>/dev/null)
AZURE_TENANT=$(echo $AZURE_ACCOUNT |awk '{print $1}')
AZURE_SUBSCRIPTION=$(echo $AZURE_ACCOUNT |awk '{print $2}')
AZURE_USER=$(echo $AZURE_ACCOUNT |awk '{print $3}')
OPEN_TEST_DATA_OUTPUT_SHARE_NAME="output"
OPEN_TEST_DATA_VIEWER_ACL="data.tno.viewers"
OPEN_TEST_DATA_OWNER_ACL="data.tno.owners"
COMMUNITY_POWERBI_CONNECTOR_NAME="OSDUWellsConnector.mez"
SCRATCH_DIR="working"
TNO_TEMPLATE_NAME="open-test-data"

if [ ! -z $1 ] && [ ! -z $UNIQUE ]; then
  UNIQUE=$1;
fi

if [ -z $UNIQUE ]; then
  UNIQUE=$(echo $AZURE_USER | awk -F "@" '{print $1}')
fi

if [ -z $RANDOM_NUMBER ]; then
  RANDOM_NUMBER=$(echo $((RANDOM%9999+1000)))
fi

if [ -z $AZURE_LOCATION ]; then
  AZURE_LOCATION="southcentralus"
fi

if [ -z $AZURE_GROUP ]; then
  AZURE_GROUP="experiencelab-${UNIQUE}"
fi

if [ -z "$DEPLOYMENT_SUBSCRIPTION" ]; then
    DEPLOYMENT_SUBSCRIPTION="6cea88f7-c17b-48c1-b058-bec742bc100f"
fi

if [ -z "$CONTROL_PLANE_GROUP" ]; then
  echo "CONTROL_PLANE_GROUP not set"
  exit 1
fi

if [ -z "$CONTROL_PLANE_STORAGE" ]; then
  echo "CONTROL_PLANE_STORAGE not set"
  exit 1
fi

if [ -z "$DEPLOYMENT_CONTAINER" ]; then
    DEPLOYMENT_CONTAINER="files"
fi

if [ -z "$DEPLOYMENT_BLOB_PORTAL" ]; then
    DEPLOYMENT_BLOB_PORTAL="developer-portal.tar.gz"
fi

if [ -z "$DEPLOYMENT_BLOB_REST_SCRIPTS" ]; then
    DEPLOYMENT_BLOB_REST_SCRIPTS="rest-scripts.zip"
fi

if [ -z "$DEPLOYMENT_BLOB_TEMPLATE" ]; then
    DEPLOYMENT_BLOB_TEMPLATE="template-open-test-data.json"
fi

if [ -z "$DEPLOYMENT_BLOB_DOCKERFILE" ]; then
    DEPLOYMENT_BLOB_DOCKERFILE="Dockerfile-open-test-data"
fi

if [ -z $DATA_PARTITION ]; then
  DATA_PARTITION="opendes"
fi


###############################
## FUNCTIONS                 ##
###############################

function Verify(){
    # Required Argument $1 = Value to check
    # Required Argument $2 = Value description for error

    if [ -z "$1" ]; then
      echo "$2 is required and was not provided"
      exit 1
    fi
}

function PrintBanner(){
    # Required Argument $1 = Message

    local _time_stamp=$(date -u '+%Y-%m-%dT%H:%MZ')
    printf "\n"
    echo "================================================================================================================="
    if [ -z "$1" ]; then
        echo $_time_stamp
    else
        echo "$_time_stamp ${1}"
    fi
    echo "================================================================================================================="
    printf "\n"
}

function PrintStage(){
  # Required Argument $1 = Message
  if [ ! -z "$1" ]; then
    echo ">>>>>>>>>> $1"
  fi
}

function GetExpireDate(){
  if [[ "$(uname)" = Darwin ]]; then
    # We are running on a Mac
    local _expire=$(date -u -v+60M '+%Y-%m-%dT%H:%MZ')
  else
    if [[ $(cat /proc/version |grep Ubuntu) ]]; then
      # We are running on WSL or Cloud Shell
      local _expire=$(date -u --date="60 minutes" '+%Y-%m-%dT%H:%MZ')
    else
      # We are running in an Azure Container Instance
      local _expire=$(date -u -d "@$(( $(busybox date +%s) + 3600 ))" '+%Y-%m-%dT%H:%MZ')
    fi
  fi
  echo ${_expire}
}

function Encode(){
  # Required Argument $1 = APPLICATION_NAME
  if [[ "$(uname)" = Darwin ]]; then
    # We are running on a Mac
    local _encoded=$(echo -n "$1" | base64)
  else
    # We are running on Linux
    local _encoded=$(echo -n "$1" | base64 -w 0)
  fi
  echo ${_encoded}
}

function CreateResourceGroup() {
  # Required Argument $1 = RESOURCE_GROUP
  # Required Argument $2 = LOCATION

  Verify $1 'CreateResourceGroup-ERROR: Argument (RESOURCE_GROUP) not received'
  Verify $2 'CreateResourceGroup-ERROR: Argument (LOCATION) not received'

  local _result=$($az group show --name $1 2>/dev/null)
  if [ "$_result"  == "" ]
    then
      OUTPUT=$($az group create --name $1 \
        --location $2 \
        --tags currentStatus=Group_Created RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER \
        -ojsonc)
      echo "  Resource Group Created."

      LOCK=$($az group lock create --name "PROTECTED" \
        --resource-group $1 \
        --lock-type CanNotDelete \
        -ojsonc)
      echo "  Resource Group Locked."
    else
      echo "  Resource Group $1 already exists."
      RANDOM_NUMBER=$($az group show --name $1 --query tags.RANDOM -otsv)
      CLIENT_ID=$($az group show --name $1 --query tags.APP_ID -otsv)
    fi
}

function CreateADApplication() {
    # Required Argument $1 = APPLICATION_NAME
    # Required Argument $2 = VAULT_NAME
    # Required Argument $3 = RESOURCE_GROUP

    Verify $1 'CreateADApplication-ERROR: Argument (APPLICATION_NAME) not received'
    Verify $2 'CreateADApplication-ERROR: Argument (VAULT_NAME) not received'
    Verify $3 'CreateADApplication-ERROR: Argument (RESOURCE_GROUP) not received'

    local _result=$($az ad sp list --display-name $1 --query [].appId --only-show-errors -otsv )
    if [ "$_result"  == "" ]
    then
      echo "  Initialize Application"

      cat > manifest.json <<EOF
[
  {
    "resourceAppId": "00000003-0000-0000-c000-000000000000",
    "resourceAccess": [
      {
        "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
        "type": "Scope"
      }
    ]
  }
]
EOF

      CLIENT_ID=$($az ad app create \
        --display-name $1 \
        --available-to-other-tenants false \
        --required-resource-accesses "@manifest.json" \
        --query appId -otsv)

      rm manifest.json

      sleep 60  # <-- Pause to give App Registration time to propagate.

      echo "  Initialize Application Secret"
      CLIENT_SECRET=`$az ad app credential reset --id $CLIENT_ID --query password -otsv`

      echo "  Initialize Application Identity"
      $az ad sp create --id $CLIENT_ID -o none

      echo "  Assign Application Contributor Role to Resource Group"
      $az role assignment create --assignee $CLIENT_ID --role "Contributor" --scope "/subscriptions/${AZURE_SUBSCRIPTION}/resourceGroups/$3" -o none

      echo "  Add AD Application to Vault"
      AddKeyToVault $2 "client-id" $CLIENT_ID
      AddKeyToVault $2 "client-secret" $CLIENT_SECRET
    else
      echo "  Application $1 already exists."
    fi
}


function CreateKeyVault() {
  # Required Argument $1 = KV_NAME
  # Required Argument $2 = RESOURCE_GROUP
  # Required Argument $3 = LOCATION

  Verify $1 'CreateKeyVault-ERROR: Argument (KV_NAME) not received'
  Verify $2 'CreateKeyVault-ERROR: Argument (RESOURCE_GROUP) not received'
  Verify $3 'CreateKeyVault-ERROR: Argument (LOCATION) not received'

  local _vault=$($az keyvault list --resource-group $2 --query [].name -otsv 2>/dev/null)
  if [ "$_vault"  == "" ]; then
    OUTPUT=$($az keyvault create --name $1 --resource-group $2 --location $3 --enabled-for-template-deployment --query [].name -otsv)
    echo "  Key Vault Created."
  else
    echo "  Key Vault $1 already exists."
  fi
}

function AddKeyToVault() {
  # Required Argument $1 = KEY_VAULT
  # Required Argument $2 = SECRET_NAME
  # Required Argument $3 = SECRET_VALUE
  # Optional Argument $4 = isFile (bool)

  Verify $1 'AddKeyToVault-ERROR: Argument (KEY_VAULT) not received'
  Verify $2 'AddKeyToVault-ERROR: Argument (SECRET_NAME) not received'
  Verify $3 'AddKeyToVault-ERROR: Argument (SECRET_VALUE) not received'

  if [ "$4" == "file" ]; then
    local _secret=$($az keyvault secret set --vault-name $1 --name $2 --file $3)
  else
    local _secret=$($az keyvault secret set --vault-name $1 --name $2 --value $3)
  fi
}

function CreateStorageAccount(){
    # Required Argument $1 = STORAGE_NAME
    # Required Argument $2 = RESOURCE_GROUP
    # Required Argument $3 = LOCATION

    Verify $1 'CreateStorageAccount-ERROR: Argument (STORAGE_NAME) not received'
    Verify $2 'CreateStorageAccount-ERROR: Argument (RESOURCE_GROUP) not received'
    Verify $3 'CreateStorageAccount-ERROR: Argument (LOCATION) not received'

    local _storage=$($az storage account show --name $1 --resource-group $2 --query name -otsv 2>/dev/null)

    if [ "$_storage"  == "" ]; then
      OUTPUT=$(az storage account create \
        --name $1 \
        --resource-group $2 \
        --location $3 \
        --sku Standard_LRS \
        --kind StorageV2 \
        --allow-blob-public-access \
        --query name -otsv)
      echo "  Storage Account Created."
    else
      echo "  Storage Account $1 already exists."
    fi


    # Verify $_key 'CreateStorageAccount-Error: Storage Key not recieved'
    # az storage share create --name $2 --account-key $_key --account-name $1
}

function GetStorageConnection() {
  # Required Argument $1 = STORAGE_ACCOUNT
  # Required Argument $2 = RESOURCE_GROUP
  # Required Argument $3 = SUBSCRIPTION

  Verify $1 'CreateStorageAccount-ERROR: Argument (STORAGE_ACCOUNT) not received'
  Verify $2 'CreateStorageAccount-ERROR: Argument (RESOURCE_GROUP) not received'

  local _result=$(az storage account show-connection-string \
    --name $1 \
    --resource-group $2 \
    --subscription  $3 \
    --query connectionString \
    --output tsv)

  echo $_result
}

function GetStorageAccountKey() {
  # Required Argument $1 = STORAGE_ACCOUNT
  # Required Argument $2 = RESOURCE_GROUP

  Verify $1 'GetStorageAccountKey-ERROR: Argument (STORAGE_ACCOUNT) not received'
  Verify $2 'GetStorageAccountKey-ERROR: Argument (RESOURCE_GROUP) not received'

  local _result=$(az storage account keys list \
    --account-name $1 \
    --resource-group $2 \
    --query '[0].value' \
    --output tsv)
  echo $_result
}

function CreateFileShare() {
  # Required Argument $1 = SHARE_NAME
  # Required Argument $2 = STORAGE_CONNECTION

  Verify $1 'CreateFileShare-ERROR: Argument (SHARE_NAME) not received'
  Verify $2 'CreateFileShare-ERROR: Argument (STORAGE_CONNECTION) not received'
  
  echo "  Creating File Share ($1)"
  
  $az storage share create \
    --name $1 \
    --connection-string $2 \
    --output none

  echo "  File Share ($1) Created"
}

function GetDeploymentBlobSASToken() {
  # Required Argument $1 BLOB_NAME
  # Required Argument $2 = CONNECTION
  Verify $1 'GetDeploymentBlobSASToken-ERROR: Argument (BLOB_NAME) not received'
  Verify $2 'GetDeploymentBlobSASToken-ERROR: Argument (CONNECTION) not received'

  local _expire=$(GetExpireDate)
  local _token=$($az storage blob generate-sas --name $1 \
      --expiry ${_expire} \
      --permissions r \
      --connection-string $2 \
      --subscription $DEPLOYMENT_SUBSCRIPTION \
      --container-name $DEPLOYMENT_CONTAINER \
      --https-only \
      --output tsv)
  echo ${_token}
}

function GetStorageShareSASToken() {
  # Required Argument $1 SHARE_NAME
  # Required Argument $2 = CONNECTION
  Verify $1 'GetStorageShareSASToken-ERROR: Argument (SHARE_NAME) not received'
  Verify $2 'GetStorageShareSASToken-ERROR: Argument (CONNECTION) not received'

  local _expire=$(GetExpireDate)
  local _token=$($az storage share generate-sas --name $1 \
    --expiry ${_expire} \
    --permissions rwld \
    --connection-string $2 \
    --output tsv)
  echo ${_token}
}

function CreateManagedIdentity() {
  # Required Argument $1 = NAME
  # Required Argument $2 = RESOURCE_GROUP

  Verify $1 'CreateManagedIdentity-ERROR: Argument (NAME) not received'
  Verify $2 'CreateManagedIdentity-ERROR: Argument (RESOURCE_GROUP) not received'

  local _identity=$($az identity show --name $1 --resource-group $2 --query name -otsv 2>/dev/null)

  if [ "$_identity"  == "" ]; then
    OUTPUT=$($az identity create \
      --name $1 \
      --resource-group $2 \
      --query name -otsv)
    echo "  Managed Identity $1 created"
  else
    echo "  Managed Identity $1 already exists"
  fi
}

function CreateContainerRegistry() {
  # Required Argument $1 = CR_NAME
  # Required Argument $2 = RESOURCE_GROUP
  # Required Argument $3 = LOCATION

  Verify $1 'CreateContainerRegistry-ERROR: Argument (CR_NAME) not received'
  Verify $2 'CreateContainerRegistry-ERROR: Argument (RESOURCE_GROUP) not received'
  Verify $3 'CreateContainerRegistry-ERROR: Argument (LOCATION) not received'

  local _registry=$($az acr list --resource-group $2 --query [].name -otsv 2>/dev/null)
  if [ "$_registry"  == "" ]; then
    OUTPUT=$($az acr create \
      --name $1 \
      --resource-group $2 \
      --location $3 \
      --sku basic \
      --admin-enabled false \
      --query [].name -otsv)
    echo "  Container Registry $1 created"
  else
    echo "  Container Registry $1 already exists"
  fi
}

function GetContainerRegistryId() {
  # Required Argument $1 = REGISTRY_NAME
  # Required Argument $2 = RESOURCE_GROUP

  Verify $1 'GetContainerRegistryId-ERROR: Argument (REGISTRY_NAME) not received'
  Verify $2 'GetContainerRegistryId-ERROR: Argument (RESOURCE_GROUP) not received'

  local _result=$($az acr show \
    --name $1 \
    --resource-group $2 \
    --query 'id' \
    --output tsv)

  echo ${_result}
}

function GetOpenTestDataLoaderAndUploadToAzureContainerRegistry() {
  echo "  Downloading Open Test Data Loader Source from GitHub"
  LOADER_FILE_NAME=main.zip
  DATA_LOADER_DIR="osdu-data-load-tno-main"
  wget --quiet -O $LOADER_FILE_NAME https://github.com/Azure/osdu-data-load-tno/archive/refs/heads/$LOADER_FILE_NAME
  
  echo "  Extracting Open Test Data Loader"
  unzip -qq $LOADER_FILE_NAME -d .
  
  echo $'\n  Building open-test-data and uploading to Azure Container Registry'
  IMAGE_NAME="open-test-data"
  TAG="latest"

  $az acr build \
    --registry $ITEM_NAME \
    --build-arg AZURE_TENANT=$AZURE_TENANT \
    --build-arg OSDU_ENDPOINT="https://${PLATFORM_NAME}.energy.azure.com" \
    --build-arg DATA_PARTITION="${PLATFORM_NAME}-${DATA_PARTITION}" \
    --build-arg ACL_VIEWER=$OPEN_TEST_DATA_VIEWER_ACL \
    --build-arg ACL_OWNER=$OPEN_TEST_DATA_OWNER_ACL \
    --build-arg DOMAIN="dataservices.energy" \
    --build-arg LEGAL_TAG="${PLATFORM_NAME}-${DATA_PARTITION}-$FIRST_LEGAL_TAG_NAME" \
    --file ${DATA_LOADER_DIR}/Dockerfile \
    --image $IMAGE_NAME:$TAG $DATA_LOADER_DIR \
    --no-logs \
    --only-show-errors
  
  rm -rf $DATA_LOADER_DIR
  rm -rf $LOADER_FILE_NAME
  printf "\n"
  echo '  Completed open-test-data build and upload to ACR'
}

function CreateOpenTestDataTemplateSpec() {
  # Create Template Spec
  local _connection=$(GetStorageConnection $CONTROL_PLANE_STORAGE $CONTROL_PLANE_GROUP $DEPLOYMENT_SUBSCRIPTION)
  local _template_sas=$(GetDeploymentBlobSASToken $DEPLOYMENT_BLOB_TEMPLATE $_connection)
  local _template_url="https://$CONTROL_PLANE_STORAGE.blob.core.windows.net/$DEPLOYMENT_CONTAINER/$DEPLOYMENT_BLOB_TEMPLATE?$_template_sas"
  wget --quiet -O $DEPLOYMENT_BLOB_TEMPLATE "$_template_url"

  # Adds a default value to the instance identifier
  ## Sed finds "instanceIdentifier": { and inserts "defaultValue": "<instance id>", below it 
  sed -i "/\"instanceIdentifier\": {/a\        \"defaultValue\": \"${RANDOM_NUMBER}\"," $DEPLOYMENT_BLOB_TEMPLATE

  printf "\n"
  echo '  Template Spec Downloaded'
  $az ts create --name $TNO_TEMPLATE_NAME --resource-group $AZURE_GROUP --location $AZURE_LOCATION --version "1.0" --template-file $DEPLOYMENT_BLOB_TEMPLATE -o none
  echo "  Created Template Spec $TNO_TEMPLATE_NAME"
  rm $DEPLOYMENT_BLOB_TEMPLATE
}

function CreateDataPlatform() {
  # Required Argument $1 = NAME
  # Required Argument $2 = DATA_PARTITION
  # Required Argument $3 = CLIENT_ID
  # Required Argument $4 = RESOURCE_GROUP
  # Required Argument $5 = LOCATION

  Verify $1 'CreateDataPlatform-ERROR: Argument (NAME) not received'
  Verify $2 'CreateDataPlatform-ERROR: Argument (DATA_PARTITION) not received'
  Verify $3 'CreateDataPlatform-ERROR: Argument (CLIENT_ID) not received'
  Verify $4 'CreateDataPlatform-ERROR: Argument (RESOURCE_GROUP) not received'
  Verify $5 'CreateDataPlatform-ERROR: Argument (LOCATION) not received'

  local _platform=$(az resource show \
                      --name $1 \
                      --resource-group $4 \
                      --resource-type "Microsoft.OpenEnergyPlatform/energyservices" \
                      --query name -otsv 2>/dev/null)
  if [ "$_platform"  == "" ]; then
    echo "  Be Patient ~1 hour wait..."
    OUTPUT=$(az resource create \
              --name $1 \
              --resource-group $4 \
              --location $5 \
              --resource-type Microsoft.OpenEnergyPlatform/energyservices \
              --is-full-object \
              --properties "{ \"location\": \"${5}\", \
                              \"properties\": { \
                                  \"authAppId\": \"${3}\", \
                                  \"dataPartitionNames\": [{ \"name\": \"${2}\" }], \
                                  \"publicNetworkAccess\": \"Enabled\" \
                              } \
                            }")
    echo "  Data Platform $1 created"
  else
    echo "  Data Platform $1 already exists"
  fi
}

function CreateFirstUser() {
  # Required Argument $1 = NAME
  # Required Argument $2 = AZURE_TENANT
  # Required Argument $3 = CLIENT_ID
  # Required Argument $4 = CLIENT_SECRET
  # Required Argument $5 = DATA_PARTITION
  # Required Argument $6 = FIRST_USER

  Verify $1 'CreateFirstUser-ERROR: Argument (NAME) not received'
  Verify $2 'CreateFirstUser-ERROR: Argument (AZURE_TENANT) not received'
  Verify $3 'CreateFirstUser-ERROR: Argument (CLIENT_ID) not received'
  Verify $4 'CreateFirstUser-ERROR: Argument (CLIENT_SECRET) not received'
  Verify $5 'CreateFirstUser-ERROR: Argument (DATA_PARTITION) not received'
  Verify $6 'CreateFirstUser-ERROR: Argument (FIRST_USER) not received'

  ACCESS_TOKEN=$(curl \
      --request POST \
      --url https://login.microsoftonline.com/${2}/oauth2/token \
      --header 'content-type: application/x-www-form-urlencoded' \
      --data grant_type=client_credentials \
      --data client_id=${3} \
      --data client_secret=${4} \
      --data resource=${3} --silent | jq --raw-output '.access_token')

  MEMBERS=$(curl \
              --request GET \
              --url https://${1}.energy.azure.com/api/entitlements/v2/groups/users@${5}.dataservices.energy/members \
              --header "accept: application/json" \
              --header "authorization: Bearer ${ACCESS_TOKEN}" \
              --header "content-type: application/json" \
              --header "data-partition-id: ${5}")
  MEMBERS=$(echo $MEMBERS | tr '[:lower:]' '[:upper:]')
  USER_TO_CREATE=$(echo $6 | tr '[:lower:]' '[:upper:]')

  if ! grep -q $USER_TO_CREATE <<< $MEMBERS; then
    echo "  Creating user"
    if ! curl \
      --request POST \
      --url https://${1}.energy.azure.com/api/entitlements/v2/groups/users@${5}.dataservices.energy/members \
      --header "accept: application/json" \
      --header "authorization: Bearer ${ACCESS_TOKEN}" \
      --header "content-type: application/json" \
      --header "data-partition-id: ${5}" \
      --data "{\"email\": \"${6}\",\"role\": \"MEMBER\"}" --fail; then
        echo "  ERROR: Failed to create user."
        return
    else
      echo $'\n  Created user'
    fi
  else
    echo '  User already exists'
  fi

  AssignEntitlementGroupToUser $1 $2 $3 $4 $5 $6 "users.datalake.ops"
  AssignEntitlementGroupToUser $1 $2 $3 $4 $5 $6 "users.data.root"
}

function AssignEntitlementGroupToUser() {
  # Required Argument $1 = NAME
  # Required Argument $2 = AZURE_TENANT
  # Required Argument $3 = CLIENT_ID
  # Required Argument $4 = CLIENT_SECRET
  # Required Argument $5 = DATA_PARTITION
  # Required Argument $6 = FIRST_USER
  # Required Argument $7 = GROUP_TO_ASSIGN

  Verify $1 'AssignEntitlementGroupToUser-ERROR: Argument (NAME) not received'
  Verify $2 'AssignEntitlementGroupToUser-ERROR: Argument (AZURE_TENANT) not received'
  Verify $3 'AssignEntitlementGroupToUser-ERROR: Argument (CLIENT_ID) not received'
  Verify $4 'AssignEntitlementGroupToUser-ERROR: Argument (CLIENT_SECRET) not received'
  Verify $5 'AssignEntitlementGroupToUser-ERROR: Argument (DATA_PARTITION) not received'
  Verify $6 'AssignEntitlementGroupToUser-ERROR: Argument (FIRST_USER) not received'
  Verify $7 'AssignEntitlementGroupToUser-ERROR: Argument (GROUP_TO_ASSIGN) not received'

  ACCESS_TOKEN=$(curl \
      --request POST \
      --url https://login.microsoftonline.com/${2}/oauth2/token \
      --header 'content-type: application/x-www-form-urlencoded' \
      --data grant_type=client_credentials \
      --data client_id=${3} \
      --data client_secret=${4} \
      --data resource=${3} --silent | jq --raw-output '.access_token')

  USERS_ROLES=$(curl \
                --request GET \
                --url https://${1}.energy.azure.com/api/entitlements/v2/members/${6}/groups?type=none \
                --header "accept: application/json" \
                --header "authorization: Bearer ${ACCESS_TOKEN}" \
                --header "content-type: application/json" \
                --header "data-partition-id: ${5}")

  if ! grep -i -q $7 <<< $USERS_ROLES; then
    echo "  Assigning user ${6} to ${7} role"
    if ! curl \
      --request POST \
      --url https://${1}.energy.azure.com/api/entitlements/v2/groups/${7}@${5}.dataservices.energy/members \
      --header "accept: application/json" \
      --header "authorization: Bearer ${ACCESS_TOKEN}" \
      --header "content-type: application/json" \
      --header "data-partition-id: ${5}" \
      --data "{\"email\": \"${6}\",\"role\": \"MEMBER\"}" --fail; then
        echo "  ERROR: Failed to assign user to ${7} role"
        return
    else
      echo -e "\n  Assigned user ${6} to ${7} role"
    fi
  else
    echo "  User ${6} already has ${7} role"
  fi
}

function CreateFirstTag() {
  # Required Argument $1 = NAME
  # Required Argument $2 = AZURE_TENANT
  # Required Argument $3 = CLIENT_ID
  # Required Argument $4 = CLIENT_SECRET
  # Required Argument $5 = DATA_PARTITION
  # Required Argument $6 = FIRST_LEGAL_TAG_NAME

  Verify $1 'CreateFirstTag-ERROR: Argument (NAME) not received'
  Verify $2 'CreateFirstTag-ERROR: Argument (AZURE_TENANT) not received'
  Verify $3 'CreateFirstTag-ERROR: Argument (CLIENT_ID) not received'
  Verify $4 'CreateFirstTag-ERROR: Argument (CLIENT_SECRET) not received'
  Verify $5 'CreateFirstTag-ERROR: Argument (DATA_PARTITION) not received'
  Verify $6 'CreateFirstTag-ERROR: Argument (FIRST_LEGAL_TAG_NAME) not received'

  ACCESS_TOKEN=$(curl \
      --request POST \
      --url https://login.microsoftonline.com/${2}/oauth2/token \
      --header 'content-type: application/x-www-form-urlencoded' \
      --data grant_type=client_credentials \
      --data client_id=${3} \
      --data client_secret=${4} \
      --data resource=${3} --silent | jq --raw-output '.access_token')

  TAGS=$(curl \
          --request GET \
          --url https://${1}.energy.azure.com/api/legal/v1/legaltags/${5}-${6} \
          --header "accept: application/json" \
          --header "authorization: Bearer ${ACCESS_TOKEN}" \
          --header "content-type: application/json" \
          --header "data-partition-id: ${5}")
  TAGS=$(echo $TAGS | tr '[:lower:]' '[:upper:]')
  TAG_TO_CREATE=$(echo ${6} | tr '[:lower:]' '[:upper:]')

  if ! grep -q $TAG_TO_CREATE <<< $TAGS; then
    echo "  Creating tag"
    if ! curl \
      --request POST \
      --url https://${1}.energy.azure.com/api/legal/v1/legaltags \
      --header "accept: application/json" \
      --header "authorization: Bearer ${ACCESS_TOKEN}" \
      --header "content-type: application/json" \
      --header "data-partition-id: ${5}" \
      --data-raw "{
                \"name\": \"${6}\",
                \"description\": \"Open Data Set Legal Contract\",
                \"properties\": {
                    \"contractId\": \"A1234\",
                    \"countryOfOrigin\": [\"US\"],
                    \"dataType\": \"Public Domain Data\",
                    \"expirationDate\": \"2099-01-25\",
                    \"exportClassification\": \"EAR99\",
                    \"originator\": \"Experience Lab\",
                    \"personalData\": \"No Personal Data\",
                    \"securityClassification\": \"Public\"
                }
            }" --fail; then
        echo "  ERROR: Failed to create tag"
        return
    else
      echo -e "\n  Created tag $6"
    fi
  else
    echo "  Tag $6 already exists"
  fi
}

function CreateDataGroup() {
  # Required Argument $1 = PLATFORM_NAME
  # Required Argument $2 = AZURE_TENANT
  # Required Argument $3 = CLIENT_ID
  # Required Argument $4 = CLIENT_SECRET
  # Required Argument $5 = DATA_PARTITION
  # Required Argument $6 = FIRST_USER
  # Required Argument $7 = ENTITLEMENT_GROUP_NAME
  # Required Argument $8 = ENTITLEMENT_GROUP_DESCRIPTION
  
  Verify $1 'CreateDataGroup-ERROR: Argument (PLATFORM_NAME) not received'
  Verify $2 'CreateDataGroup-ERROR: Argument (AZURE_TENANT) not received'
  Verify $3 'CreateDataGroup-ERROR: Argument (CLIENT_ID) not received'
  Verify $4 'CreateDataGroup-ERROR: Argument (CLIENT_SECRET) not received'
  Verify $5 'CreateDataGroup-ERROR: Argument (DATA_PARTITION) not received'
  Verify $6 'CreateDataGroup-ERROR: Argument (FIRST_USER) not received'
  Verify $7 'CreateDataGroup-ERROR: Argument (ENTITLEMENT_GROUP_NAME) not received'
  Verify $8 'CreateDataGroup-ERROR: Argument (ENTITLEMENT_GROUP_DESCRIPTION) not received'

  ACCESS_TOKEN=$(curl \
      --request POST \
      --url https://login.microsoftonline.com/${2}/oauth2/token \
      --header 'content-type: application/x-www-form-urlencoded' \
      --data grant_type=client_credentials \
      --data client_id=${3} \
      --data client_secret=${4} \
      --data resource=${3} --silent | jq --raw-output '.access_token')

  EXISTING_GROUPS=$(curl \
    --request GET \
    --url https://${1}.energy.azure.com/api/entitlements/v2/groups \
    --header "accept: application/json" \
    --header "authorization: Bearer ${ACCESS_TOKEN}" \
    --header "data-partition-id: ${5}")

  if ! grep -q -i $7 <<< $EXISTING_GROUPS; then
    echo "  Creating group ${7}"
    if curl \
      --request POST \
      --url https://${1}.energy.azure.com/api/entitlements/v2/groups \
      --header "authorization: Bearer ${ACCESS_TOKEN}" \
      --header "content-type: application/json" \
      --header "data-partition-id: ${5}" \
      --data "{
        \"name\": \"${7}\",
        \"description\": \"${8}\"}" --fail; then
          echo -e "\n  Created group ${7}"
    else
      echo " ERROR: Failed to create group ${7}"
      return
    fi
  else
    echo "  Group ${7} already exists"
  fi
}

function GetPortal() {
  # Required Argument $1 = AZURE_TENANT
  # Required Argument $2 = CLIENT_ID
  # Required Argument $3 = ITEM_NAME
  # Required Argument $4 = DATA_PARTITION
  # Required Argument $5 = AZURE_GROUP
  # Required Argument $6 = CUSTOMIZED_POWERBI_CONNECTOR_NAME

  Verify $1 'GetPortal-ERROR: Argument (AZURE_TENANT) not received'
  Verify $2 'GetPortal-ERROR: Argument (CLIENT_ID) not received'
  Verify $3 'GetPortal-ERROR: Argument (ITEM_NAME) not received'
  Verify $4 'GetPortal-ERROR: Argument (DATA_PARTITION) not received'
  Verify $5 'GetPortal-ERROR: Argument (AZURE_GROUP) not received'
  Verify $6 'GetPortal-ERROR: Argument (CUSTOMIZED_POWERBI_CONNECTOR_NAME) not received'

  local _connection=$(GetStorageConnection $CONTROL_PLANE_STORAGE $CONTROL_PLANE_GROUP $DEPLOYMENT_SUBSCRIPTION)
  local _portal_sas=$(GetDeploymentBlobSASToken $DEPLOYMENT_BLOB_PORTAL $_connection)
  local _blob_url="https://$CONTROL_PLANE_STORAGE.blob.core.windows.net/$DEPLOYMENT_CONTAINER/$DEPLOYMENT_BLOB_PORTAL?$_portal_sas"

  wget --quiet -O $DEPLOYMENT_BLOB_PORTAL "$_blob_url"
  tar -xzf $DEPLOYMENT_BLOB_PORTAL
  rm $DEPLOYMENT_BLOB_PORTAL

  if [ -f developer-portal/src/environments/environment.ts ]; then
    rm developer-portal/src/environments/environment.ts
  else
    mkdir developer-portal/src/environments
  fi

  echo "
  export const environment = {
    tenantId: \"${1}\",
    clientId: \"${2}\",
    apiHost: \"platform${RANDOM_NUMBER}.energy.azure.com\",
    dataPartition: \"platform${RANDOM_NUMBER}-${4}\",
    scopes: \".default openid profile offline_access\",
    redirectUrl: \"https://${3}.azurewebsites.net\",
    instanceIdentifier: \"${RANDOM_NUMBER}\",
    instanceName: \"${3}\",
    domain: \"dataservices.energy\",
    buildNumber: \"#{Build.BuildNumber}#\",
    powerBiConnectorFileName: \"${6}\",
    tnoTemplateSpecUrl: \"https://portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/${subId}/resourceGroups/${AZURE_GROUP}/providers/Microsoft.Resources/templateSpecs/${TNO_TEMPLATE_NAME}/overview\"
  };
  " > developer-portal/src/environments/environment.ts
  PrintStage "Created portal configuration"

  PrintStage "Update swagger with instance information"
  echo -e "\nservers:\n  - url: https://platform${RANDOM_NUMBER}.energy.azure.com" >> developer-portal/src/assets/swagger.yaml
  sed -i "s/opendes/platform${RANDOM_NUMBER}-${4}/g" developer-portal/src/assets/swagger.yaml

  # Copy REST scripts file from blob storage to site assets folder
  local _rest_sas=$(GetDeploymentBlobSASToken $DEPLOYMENT_BLOB_REST_SCRIPTS $_connection)
  local _rest_url="https://$CONTROL_PLANE_STORAGE.blob.core.windows.net/$DEPLOYMENT_CONTAINER/$DEPLOYMENT_BLOB_REST_SCRIPTS?$_rest_sas"

  wget --quiet -O $DEPLOYMENT_BLOB_REST_SCRIPTS "$_rest_url"

  if [ -f developer-portal/src/assets/rest-scripts.zip ]; then
    rm developer-portal/src/assets/rest-scripts.zip
  fi
  PrintStage "Adding rest scripts to portal assets"

  mv $DEPLOYMENT_BLOB_REST_SCRIPTS developer-portal/src/assets
}

function CreatePortal() {
  # Required Argument $1 = WEB_NAME
  # Required Argument $2 = AZURE_GROUP
  # Required Argument $3 = LOCATION
  # Required Argument $4 = REGISTRY

  Verify $1 'CreatePortal-ERROR: Argument (WEB_NAME) not received'
  Verify $2 'CreatePortal-ERROR: Argument (AZURE_GROUP) not received'
  Verify $3 'CreatePortal-ERROR: Argument (LOCATION) not received'
  Verify $4 'CreatePortal-ERROR: Argument (REGISTRY) not received'

  # Build the image and publish to ACR
  echo '  Building Developer Portal image and uploading to ACR'
  echo '  Be Patient ~5 minute wait...'
  $az acr build --registry $4 --no-logs --only-show-errors --image portal developer-portal

  # Create the Linux App Service Plan
  echo '  Creating Azure App Service Plan'
  local _plan=$($az appservice plan list --resource-group $2 --query [].name -otsv 2>/dev/null)
  if [ "$_plan"  == "" ]
  then
    $az appservice plan create -g $2 -n ${1} --is-linux --location $3 -o none
  else
    echo "  App Service Plan $1 already exists"
  fi

  # Create the Docker based Web app
  echo '  Creating Azure Web App'
  local _web=$($az webapp list --resource-group $2 --query [].name -otsv 2>/dev/null)
  if [ "$_web"  == "" ]
  then
    # Identity for the webapp itself
    local MANAGED_IDENTITY=$(az resource list -g $2 --resource-type Microsoft.ManagedIdentity/userAssignedIdentities --query [].id -otsv)
    Verify $MANAGED_IDENTITY "User Managed Identity ID"

    # Get name of MSI so we can get it's client ID
    local MANAGED_IDENTITY_NAME=$(az resource list -g $2 --resource-type Microsoft.ManagedIdentity/userAssignedIdentities --query [].name -otsv)
    Verify $MANAGED_IDENTITY_NAME "User Managed Identity Name"

    # Client ID we'll need to set ACR credential
    local MANAGED_IDENTITY_CLIENT=$(az identity show -g $2 -n $MANAGED_IDENTITY_NAME --query clientId -otsv)
    Verify $MANAGED_IDENTITY_CLIENT "User Managed Identity ClientID"

    $az webapp create -g $2 -p ${1} -n ${1} --https-only true --assign-identity "$MANAGED_IDENTITY" -i ${4}.azurecr.io/portal:latest -o none

    # Give it some time to settle in
    sleep 60

    # Now we have to set up the managed identity as the acr identity so it can pull the image
    # https://github.com/Azure/app-service-linux-docs/blob/master/HowTo/use_user-assigned_managed_identities.md
    local WEBAPP_CONFIG=$(az webapp show -g $2 -n $1 --query id --output tsv)"/config/web"

    $az resource update --ids $WEBAPP_CONFIG --set properties.acrUseManagedIdentityCreds=true -o none
    $az resource update --ids $WEBAPP_CONFIG --set properties.acrUserManagedIdentityID=$MANAGED_IDENTITY_CLIENT -o none

  else
    echo "  Web App $1 already exists. Restarting it to pickup new changes..."
    $az webapp restart -g $2 -n $1
  fi
}

function SetADApplicationRedirectUrl() {
  # Required Argument $1 = CLIENT_ID
  # Required Argument $2 = PORTAL_REDIRECT_URL

  Verify $1 'SetADApplicationRedirectUrl-ERROR: Argument (CLIENT_ID) not received'
  Verify $2 'SetADApplicationRedirectUrl-ERROR: Argument (WEB_NAME) not received'

  OBJECT_ID=$($az ad app show --id ${1} --query objectId | tr -d \")

  echo "================================================================================================================="
  echo "Please run the following commands to complete the setup:"
  echo "az account set --subscription $subId"
  echo "az rest --method PATCH --uri 'https://graph.microsoft.com/v1.0/applications/$OBJECT_ID' --headers 'Content-Type=application/json' --body '{\"spa\":{\"redirectUris\":[\"$2\"]}}'"
  echo "================================================================================================================="
}

function CreatePowerBiConnector() {
  # Requried Argument $1 = CLIENT_ID
  # Required Argument $2 = AZURE_TENANT
  # Required Argument $3 = DATA_PARTITION
  # Required Argument $4 = CUSTOMIZED_POWERBI_CONNECTOR_NAME
  # Required Argument $5 = PORTAL_REDIRECT_URL
  # Required Argument $6 = COMMUNITY_POWERBI_CONNECTOR_NAME

  Verify $1 'CreatePowerBiConnector-ERROR: Argument (CLIENT_ID) not received'
  Verify $2 'CreatePowerBiConnector-ERROR: Argument (AZURE_TENANT) not received'
  Verify $3 'CreatePowerBiConnector-ERROR: Argument (DATA_PARTITION) not received'
  Verify $4 'CreatePowerBiConnector-ERROR: Argument (CUSTOMIZED_POWERBI_CONNECTOR_NAME) not received'
  Verify $5 'CreatePowerBiConnector-ERROR: Argument (POWERBI_REDIRECT_URL) not received'
  Verify $6 'CreatePowerBiConnector-ERROR: Argument (COMMUNITY_POWERBI_CONNECTOR_NAME) not received'

  echo "  Downloading Compiled Power BI Connector"
  local _compiledConnector="https://github.com/KadriUmay/OSDUPowerConnectors/raw/master/Power%20BI%20Connector/Compiled%20Code/${6}"
  wget --quiet $_compiledConnector
  
  # Remove older config files
  rm -f config.json

  # Generate config file
  echo "  Generating Configuration File"
  echo "
  {
    \"client_id\": \"${1}\",    
    \"redirect_uri\": \"${5}\",
    \"oauth_base_url\": \"https://login.microsoftonline.com/${2}/oauth2/v2.0\",
    \"osduindexsearchendpoint\": \"https://platform${RANDOM_NUMBER}.energy.azure.com/api/search/v2/query\",
    \"data_partition_id\": \"platform${RANDOM_NUMBER}-${3}\"
  }" > config.json

  # Rename the connector from the generic community one to the customized one
  mv $6 $4

  # Place config file in .mez
  echo "  Adding Configuration File to Power BI Connector"
  zip -q -u $4 config.json 2>/dev/null

  # Upload .mez to storage account
  echo "  Adding Power BI Connector to Portal Assets"
  if [ -f developer-portal/src/assets/$4 ]; then
    rm developer-portal/src/assets/$4
  fi

  mv $4 developer-portal/src/assets

  # Delete config and connector file
  rm -f config.json
}

function CreateLogAnalyticsWorkspace() {
  local _logWorkspace=$($az resource show \
                      --name $ITEM_NAME  \
                      --resource-group $AZURE_GROUP  \
                      --resource-type "Microsoft.OperationalInsights/workspaces" \
                      --query name -otsv 2>/dev/null)
  if [ "$_logWorkspace"  == "" ]; then
    $az monitor log-analytics workspace create \
        --resource-group $AZURE_GROUP \
        --location $AZURE_LOCATION \
        --workspace-name $ITEM_NAME \
        --sku PerGB2018 \
        --retention-time 30 \
        --only-show-errors \
        --output none
    echo "  Created Log Analytics Workspace ($ITEM_NAME)"
  else
    echo "  Log Analytics Workspace ($ITEM_NAME) already exists"
  fi 
}

function CreateDiagnosticSetting() {
  local _diagnosticSettingName="AirflowAndElasticToLogAnalytics"

  local _diagnosticSetting=$($az monitor diagnostic-settings show  \
                              --resource /subscriptions/$subId/resourcegroups/$AZURE_GROUP/providers/Microsoft.OpenEnergyPlatform/energyServices/$PLATFORM_NAME \
                              --name $_diagnosticSettingName -otsv 2>/dev/null)
  if [ "$_diagnosticSetting"  == "" ]; then
    az monitor diagnostic-settings create \
      --name $_diagnosticSettingName \
      --resource /subscriptions/$subId/resourceGroups/$AZURE_GROUP/providers/Microsoft.OpenEnergyPlatform/energyServices/$PLATFORM_NAME \
      --workspace $ITEM_NAME \
      --only-show-errors \
      --output none \
      --logs '[
        {
            "category": "AirFlowTaskLogs",
            "enabled": true
        },
        {
            "category": "ElasticOperatorLogs",
            "enabled": true
        },
        {
            "category": "ElasticsearchLogs",
            "enabled": true
        }
      ]'
    echo "  Created Diagnostic Setting ($_diagnosticSettingName)"
  else
    echo "  Diagnostic Setting ($_diagnosticSettingName) already exists"
  fi  
}

###############################
## EXECUTION                 ##
###############################


#------------------------------
#- Resource Group    (1)     --
#------------------------------
PrintBanner "Creating Resource Group"
CreateResourceGroup $AZURE_GROUP $AZURE_LOCATION


# -- Must be located after Resource Group --
#  -- RANDOM_NUMBER pulled from RG tags --
if [ -z $ITEM_NAME ]; then
  ITEM_NAME="experiencelab${RANDOM_NUMBER}"
  PLATFORM_NAME="platform${RANDOM_NUMBER}"
fi


#------------------------------
#- Key Vault         (2)     --
#------------------------------
PrintBanner "Creating Key Vault"
$az group update -n $AZURE_GROUP --tag currentStatus=Vault_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER -o none APP_ID=$CLIENT_ID -o none  2>/dev/null
AZURE_VAULT=$ITEM_NAME
CreateKeyVault $AZURE_VAULT $AZURE_GROUP $AZURE_LOCATION
$az group update -n $AZURE_GROUP --tag currentStatus=Vault_Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER -o none APP_ID=$CLIENT_ID -o none  2>/dev/null


#------------------------------
#- AD Application     (3)    --
#------------------------------
PrintBanner "Creating Azure AD Objects"
$az group update -n $AZURE_GROUP --tag currentStatus=AD_Items_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER -o none  2>/dev/null
APP_NAME="${ITEM_NAME}app"
CreateADApplication $APP_NAME $AZURE_VAULT $AZURE_GROUP $POWERBI_REDIRECT_URL
$az group update -n $AZURE_GROUP --tag currentStatus=AD_Items_Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null


#------------------------------
#- Storage Account           --
#------------------------------
PrintBanner "Creating Storage Account"
$az group update -n $AZURE_GROUP --tag currentStatus=Storage_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null
AZURE_STORAGE=$ITEM_NAME
CreateStorageAccount $AZURE_STORAGE $AZURE_GROUP $AZURE_LOCATION
STORAGE_CONNECTION=$(GetStorageConnection $AZURE_STORAGE $AZURE_GROUP $subId)
CreateFileShare $OPEN_TEST_DATA_OUTPUT_SHARE_NAME $STORAGE_CONNECTION
STORAGE_KEY=$(GetStorageAccountKey $AZURE_STORAGE $AZURE_GROUP)
echo "  Add Experience Lab Storage Account Key to KeyVault"
AddKeyToVault $AZURE_VAULT "storage-account-key" $STORAGE_KEY

echo "  Add Control Plane Storage Account Key to KeyVault"
CONTROL_PLANE_STORAGE_KEY=$(GetStorageAccountKey $CONTROL_PLANE_STORAGE $CONTROL_PLANE_GROUP)
AddKeyToVault $AZURE_VAULT "control-plane-storage-account-name" $CONTROL_PLANE_STORAGE
AddKeyToVault $AZURE_VAULT "control-plane-storage-account-key" $CONTROL_PLANE_STORAGE_KEY
$az group update -n $AZURE_GROUP --tag currentStatus=Storage_Finished RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null


#-----------------------------------
#- Container Registry & Identity  --
#-----------------------------------
PrintBanner "Creating Container Registry & Identity"
$az group update -n $AZURE_GROUP --tag currentStatus=Batch_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null
CreateManagedIdentity $ITEM_NAME $AZURE_GROUP $AZURE_LOCATION
CreateContainerRegistry $ITEM_NAME $AZURE_GROUP $AZURE_LOCATION
REGISTRY_ID=$(GetContainerRegistryId $ITEM_NAME $AZURE_GROUP)
PRINCIPAL_ID=$($az identity show --name $ITEM_NAME --resource-group $AZURE_GROUP --query principalId -otsv)
sleep 60  # <-- Pause to give Managed Identity Time to propagate.
$az role assignment create --assignee $PRINCIPAL_ID --scope $REGISTRY_ID --role acrpull -o none 2> /dev/null
echo "  Managed Identity assigned ACR Pull Role to Container Registry"
$az group update -n $AZURE_GROUP --tag currentStatus=Batch_Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null

#------------------------------
#- Get Client Secret         --
#------------------------------
CLIENT_SECRET=$($az keyvault secret show --id https://$AZURE_VAULT.vault.azure.net/secrets/client-secret --query value -otsv)

#------------------------------
#- Deployment Template       --
#------------------------------
PrintBanner "Creating Open Test Data (TNO) Data Loader"
$az group update -n $AZURE_GROUP --tag currentStatus=DataLoad_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null

PrintStage "Downloading Open Test Data (TNO) Data Loader and Building Docker Image in Azure Container Registry"
GetOpenTestDataLoaderAndUploadToAzureContainerRegistry

PrintStage "Creating Open Test Data (TNO) Deployment Template"
CreateOpenTestDataTemplateSpec
$az group update -n $AZURE_GROUP --tag currentStatus=DataLoad_Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null

#------------------------------
#- Microsoft Energy Data Services Data Platform         --
#------------------------------
PrintBanner "Creating Data Platform"
$az group update -n $AZURE_GROUP --tag currentStatus=Platform_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null
CreateDataPlatform $PLATFORM_NAME $DATA_PARTITION $CLIENT_ID $AZURE_GROUP $AZURE_LOCATION
CreateFirstUser $PLATFORM_NAME $AZURE_TENANT $CLIENT_ID $CLIENT_SECRET "${PLATFORM_NAME}-${DATA_PARTITION}" $FIRST_USER
CreateFirstTag $PLATFORM_NAME $AZURE_TENANT $CLIENT_ID $CLIENT_SECRET "${PLATFORM_NAME}-${DATA_PARTITION}" $FIRST_LEGAL_TAG_NAME
CreateDataGroup $PLATFORM_NAME $AZURE_TENANT $CLIENT_ID $CLIENT_SECRET "${PLATFORM_NAME}-${DATA_PARTITION}" $FIRST_USER $OPEN_TEST_DATA_VIEWER_ACL "Viewer group for Open Test Data (TNO)"
CreateDataGroup $PLATFORM_NAME $AZURE_TENANT $CLIENT_ID $CLIENT_SECRET "${PLATFORM_NAME}-${DATA_PARTITION}" $FIRST_USER $OPEN_TEST_DATA_OWNER_ACL "Owners group for Open Test Data (TNO)"
$az group update -n $AZURE_GROUP --tag currentStatus=Platform_Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null

#------------------------------
#- Gather Web Application Assets --
#------------------------------
PrintBanner "Gathering Portal Assets"
CUSTOMIZED_POWERBI_CONNECTOR_NAME="${ITEM_NAME}-${COMMUNITY_POWERBI_CONNECTOR_NAME}"
$az group update -n $AZURE_GROUP --tag currentStatus=Web_Started RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null
GetPortal $AZURE_TENANT $CLIENT_ID $ITEM_NAME $DATA_PARTITION $AZURE_GROUP $CUSTOMIZED_POWERBI_CONNECTOR_NAME

#------------------------------
#- Power BI Connector        --
#------------------------------
PrintBanner "Creating Power BI connector"
PORTAL_REDIRECT_URL="https://$ITEM_NAME.azurewebsites.net/"
CreatePowerBiConnector $CLIENT_ID $AZURE_TENANT $DATA_PARTITION $CUSTOMIZED_POWERBI_CONNECTOR_NAME $PORTAL_REDIRECT_URL $COMMUNITY_POWERBI_CONNECTOR_NAME

#------------------------------
#- Enable diagnostic Settings--
#------------------------------
PrintBanner "Enabling Airflow and Elastic log publishing"
PrintStage "Creating Log Analytics Workspace"
CreateLogAnalyticsWorkspace
PrintStage "Creating Diagnostic Setting"
CreateDiagnosticSetting

#------------------------------
#- Build Web Application     --
#------------------------------
PrintBanner "Creating Web Site"
CreatePortal $ITEM_NAME $AZURE_GROUP $AZURE_LOCATION $ITEM_NAME
$az group update -n $AZURE_GROUP --tag currentStatus=Web_Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null


####### Finish up #######
printf "\n"
printf "\n"
printf "\n"
SetADApplicationRedirectUrl $CLIENT_ID $PORTAL_REDIRECT_URL
$az group update -n $AZURE_GROUP --tags currentStatus=Completed RANDOM=$RANDOM_NUMBER CONTACT=$AZURE_USER APP_ID=$CLIENT_ID -o none  2>/dev/null
