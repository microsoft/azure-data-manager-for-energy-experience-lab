// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

@description('Azure region where resources should be deployed')
param location string = resourceGroup().location

@description('Desired name of the storage account')
param storageAccountName string = uniqueString(resourceGroup().id, deployment().name)

@description('Name of the blob container')
param containerName string = 'files'

var azCliVersion = '2.26.1'

resource storage 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'

  resource blobService 'blobServices' = {
    name: 'default'

    resource container 'containers' = {
      name: containerName
    }
  }
}

resource blobDeploymentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'load-blob-${deployment().name}'
  location: location
  kind: 'AzureCLI'
  properties: {
    azCliVersion: azCliVersion
    timeout: 'PT10M'
    retentionInterval: 'PT1H'
    environmentVariables: [
      {
        name: 'AZURE_STORAGE_ACCOUNT'
        value: storage.name
      }
      {
        name: 'AZURE_STORAGE_KEY'
        secureValue: storage.listKeys().keys[0].value
      }
      {
        name: 'AZURE_STORAGE_CONTAINER'
        value: containerName
      }
    ]
    scriptContent: '''
      #!/bin/bash
      set -e

      echo \"Downloading Container Script: File- experiencelab.sh\"
      wget -O experiencelab.sh https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/experiencelab.sh
      az storage blob upload -f experiencelab.sh -c $AZURE_STORAGE_CONTAINER -n experiencelab.sh

      echo \"Downloading Container Script: File- template-open-test-data.json\"
      wget -O template-open-test-data.json https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/template.json
      az storage blob upload -f template-open-test-data.json -c $AZURE_STORAGE_CONTAINER -n template-open-test-data.json

      echo \"Downloading Container Script: File- downloadTnoData.sh\"
      wget -O downloadTnoData.sh https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/downloadTnoData.sh
      az storage blob upload -f downloadTnoData.sh -c $AZURE_STORAGE_CONTAINER -n downloadTnoData.sh

      echo \"Downloading Container Script: File- developer-portal.tar.gz\"
      wget -O developer-portal.tar.gz https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/developer-portal.tar.gz
      az storage blob upload -f developer-portal.tar.gz -c $AZURE_STORAGE_CONTAINER -n developer-portal.tar.gz

      echo \"Downloading Container Script: File- rest-scripts.zip\"
      wget -O rest-scripts.zip https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/rest-scripts.zip
      az storage blob upload -f rest-scripts.zip -c $AZURE_STORAGE_CONTAINER -n rest-scripts.zip
    '''
  }
}

output storageAccountId string = storage.id
output storageAccountName string = storageAccountName
