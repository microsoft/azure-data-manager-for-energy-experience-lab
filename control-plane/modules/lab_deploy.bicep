// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

param templateSpecName string = 'CreateLab'
param templateSpecVersionName string = '0.1'
param location string = resourceGroup().location
param imagePath string
param storageAccountName string
@description('Time for calculating token expiry')
param baseTime string = utcNow('O')

var expiryTime = dateTimeAdd(baseTime, 'P6M')

resource createTemplateSpec 'Microsoft.Resources/templateSpecs@2021-05-01' = {
  name: templateSpecName
  location: location
  properties: {
    description: 'Deploys a Microsoft Azure Data Manager for Energy instance paired with Experience Lab.'
    displayName: 'Microsoft Azure Data Manager for Energy + Experience Lab'
  }
}

resource createTemplateSpecVersion 'Microsoft.Resources/templateSpecs/versions@2021-05-01' = {
  parent: createTemplateSpec
  name: templateSpecVersionName
  location: location
  properties: {
    mainTemplate: {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
      'contentVersion': '1.0.0.0'
      'parameters': {
        'name': {
          'type': 'string'
          'defaultValue': 'demo'
          'metadata': {
            'description': 'Experience Lab Name.'
          }
        }
        'location': {
          'type': 'string'
          'defaultValue': '[resourceGroup().location]'
          'metadata': {
            'description': 'Experience Lab Location.'
          }
        }
        'defaultUserId': {
          'type': 'string'
          'metadata': {
            'description': 'Experience Lab First User Object Id.'
          }
        }
      }
      'variables': {
        'storageAccountName': storageAccountName
        'accountSasProperties': {
          'signedServices': 'fb'
          'signedPermission': 'rwdlacup'
          'signedExpiry': expiryTime
          'signedResourceTypes': 'co'
        }
      }
      'resources': [
        {
          'type': 'Microsoft.ContainerInstance/containerGroups'
          'apiVersion': '2021-09-01'
          'name': '[concat(\'experiencelab-\', parameters(\'name\'))]'
          'location': '[parameters(\'location\')]'
          'properties': {
            'containers': [
              {
                'name': 'deploy'
                'properties': {
                  'image': imagePath
                  'command': [ ]
                  'environmentVariables': [
                    {
                      'name': 'subId'
                      'value': '[subscription().subscriptionId]'
                    }
                    {
                      'name': 'tenantId'
                      'value': '[subscription().tenantId]'
                    }
                    {
                      'name': 'user'
                      'value': '[parameters(\'defaultUserId\')]'
                    }
                    {
                      'name': 'UNIQUE'
                      'value': '[parameters(\'name\')]'
                    }
                    {
                      'name': 'SETUP_SCRIPT'
                      'value': '[format(\'https://{0}.blob.{1}/files/experiencelab.sh?{2}\', variables(\'storageAccountName\'), environment().suffixes.storage, listAccountSas(resourceId(resourceGroup().name,\'Microsoft.Storage/storageAccounts\', variables(\'storageAccountName\')), \'2018-07-01\', variables(\'accountSasProperties\')).accountSasToken)]'
                    }
                    {
                      'name': 'DEPLOYMENT_SUBSCRIPTION'
                      'value': '[subscription().subscriptionId]'
                    }
                    {
                      'name': 'CONTROL_PLANE_GROUP'
                      'value': '[resourceGroup().name]'
                    }
                    {
                      'name': 'CONTROL_PLANE_STORAGE'
                      'value': '[variables(\'storageAccountName\')]'
                    }
                    {
                      'name': 'AZURE_LOCATION'
                      'value': '[parameters(\'location\')]'
                    }
                  ]
                  'ports': [ ]
                  'resources': {
                    'requests': {
                      'cpu': 4
                      'memoryInGB': 16
                    }
                  }
                }
              }
            ]
            'osType': 'Linux'
            'restartPolicy': 'Never'
          }
        }
      ]
    }
  }
}
