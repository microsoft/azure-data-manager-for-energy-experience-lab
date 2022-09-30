// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

targetScope = 'subscription'

@description('Control Plane Name')
param controlPlaneName string

@description('Control Plane Location')
param controlPlaneLocation string = 'eastus'

// Create Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: 'experiencelab-controlplane-${controlPlaneName}'
  location: controlPlaneLocation
}

// Module Storage Account with Copy
module blob 'modules/lab_storage.bicep' = {
  name: 'labStorage'
  scope: resourceGroup
  params: {
    location: controlPlaneLocation
  }
}

module acr 'modules/lab_acr.bicep' = {
  name: 'labContainerRegistry'
  scope: resourceGroup
  params: {
    location: controlPlaneLocation
  }
}

module dataLoad 'modules/lab_dataload.bicep' = {
  name: 'dataLoad'
  scope: resourceGroup
  params: {
    storageAccountId: blob.outputs.storageAccountId
    storageAccountName: blob.outputs.storageAccountName
    imagePath: acr.outputs.containerImagePath
    location: controlPlaneLocation
    managedIdentityId: acr.outputs.managedIdentityId
  }
}

module deploy 'modules/lab_deploy.bicep' = {
  name: 'labDeploy'
  scope: resourceGroup
  params: {
    imagePath: acr.outputs.containerImagePath
    location: controlPlaneLocation
    storageAccountName: blob.outputs.storageAccountName
  }
}
