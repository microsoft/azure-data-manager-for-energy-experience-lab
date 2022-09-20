// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

targetScope = 'subscription'

@description('Resource Group Prefix')
param resourceGroupPrefix string = 'EnergyDataServices'

@description('Resource Group Location')
param resourceGroupLocation string = 'eastus'

// Create Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: 'experiencelab-controlplane-${resourceGroupPrefix}'
  location: resourceGroupLocation
}

// Module Storage Account with Copy
module blob 'modules/lab_storage.bicep' = {
  name: 'labStorage'
  scope: resourceGroup
  params: {
    location: resourceGroupLocation
  }
}

module acr 'modules/lab_acr.bicep' = {
  name: 'labContainerRegistry'
  scope: resourceGroup
  params: {
    location: resourceGroupLocation
  }
}

module dataLoad 'modules/lab_dataload.bicep' = {
  name: 'dataLoad'
  scope: resourceGroup
  params: {
    storageAccountId: blob.outputs.storageAccountId
    storageAccountName: blob.outputs.storageAccountName
    imagePath: acr.outputs.containerImagePath
    location: resourceGroupLocation
    managedIdentityId: acr.outputs.managedIdentityId
  }
}

module deploy 'modules/lab_deploy.bicep' = {
  name: 'labDeploy'
  scope: resourceGroup
  params: {
    imagePath: acr.outputs.containerImagePath
    location: resourceGroupLocation
    storageAccountName: blob.outputs.storageAccountName
  }
}
