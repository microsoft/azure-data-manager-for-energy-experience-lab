// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

@description('Storage Account ID')
param storageAccountId string
@description('Storage Account name')
param storageAccountName string
@description('Image for data load containers')
param imagePath string
@description('Azure region where resources should be deployed')
param location string = resourceGroup().location
@description('Resource ID for managed identity')
param managedIdentityId string

var tnoLoadContainerName = 'tnoDataLoad'
var cpuCores = 4
var memoryInGb = 16

var accountSasProperties = {
  signedServices: 'fb'
  signedPermission: 'rwdlacup'
  signedExpiry: '2022-11-30T00:00:00Z'
  signedResourceTypes: 'co'
}
var sasToken = listAccountSas(storageAccountId, '2018-07-01', accountSasProperties).accountSasToken
var storageAccountKey = listKeys(storageAccountId, '2018-07-01').keys[0].value
var tnoScriptPath = format('https://{0}.blob.{1}/files/downloadTnoData.sh?{2}', storageAccountName, environment().suffixes.storage, sasToken)

resource tnoLoadContainer 'Microsoft.ContainerInstance/containerGroups@2021-09-01' = {
  name: tnoLoadContainerName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    containers: [
      {
        name: 'load-data'
        properties: {
          image: imagePath
          environmentVariables: [
            {
              name: 'SETUP_SCRIPT'
              value: tnoScriptPath
            }
            {
              name: 'CONTROL_PLANE_STORAGE'
              value: storageAccountName
            }
            {
              name: 'STORAGE_ACCOUNT_KEY'
              secureValue: storageAccountKey
            }
          ]
          resources: {
            requests: {
              cpu: cpuCores
              memoryInGB: memoryInGb
            }
          }
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Never'
  }
}
