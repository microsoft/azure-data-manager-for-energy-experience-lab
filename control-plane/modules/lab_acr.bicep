// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

@minLength(5)
@maxLength(50)
@description('Desired name of the Azure Container Registry')
param acrName string = 'acr${uniqueString(resourceGroup().id, deployment().name)}'

@description('Azure region where resources should be deployed')
param location string = resourceGroup().location

@minLength(3)
@maxLength(128)
@description('Desired name of the Managed Identity')
param managedIdentityName string = 'id-${uniqueString(resourceGroup().id, deployment().name)}'

var containerScriptFileName = 'containerRun.sh'
var dockerFileName = 'Dockerfile'
var roleAssignmentName = guid('${resourceGroup().name}contributor')
var contributorRoleDefinitionId = '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
var containerImageName = 'experiencelabinstall:latest'

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2021-09-30-preview' = {
  name: managedIdentityName
  location: location
}

resource acrResource 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Standard'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    anonymousPullEnabled: true
  }
}

resource acrIdentityRoleAssignment 'Microsoft.Authorization/roleAssignments@2020-10-01-preview' = {
  name: roleAssignmentName
  scope: resourceGroup()
  properties: {
    description: 'Managed identity access for the RG'
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: contributorRoleDefinitionId
    principalType: 'ServicePrincipal'
  }
}

resource acrDockerImage 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'build-and-push-image-${deployment().name}'
  location: location
  kind: 'AzureCLI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    azCliVersion: '2.30.0'
    timeout: 'PT15M'
    retentionInterval: 'PT1H'
    environmentVariables: [
      {
        name: 'CONTAINER_IMAGE_NAME'
        value: containerImageName
      }
      {
        name: 'CONTAINER_SCRIPT_NAME'
        value: containerScriptFileName
      }
      {
        name: 'DOCKERFILE_NAME'
        value: dockerFileName
      }
      {
        name: 'REGISTRY_NAME'
        value: acrName
      }
      {
        name: 'INITIAL_DELAY'
        value: '45s'
      }
    ]
    scriptContent: '''
      #!/bin/bash
      set -e

      echo \"Waiting on RBAC replication ${INITIAL_DELAY}\"
      sleep ${INITIAL_DELAY}

      authHeader="Authorization: token ${PAT}"
      echo \"Downloading Dockerfile: File- ${DOCKERFILE_NAME}\"
      wget -O ${DOCKERFILE_NAME} https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/${DOCKERFILE_NAME}

      echo \"Downloading Container Script: File- ${CONTAINER_SCRIPT_NAME}\"
      wget -O ${CONTAINER_SCRIPT_NAME} https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/releases/latest/download/${CONTAINER_SCRIPT_NAME}

      echo \"Build and Import Image: ${CONTAINER_IMAGE_NAME} into ACR: ${REGISTRY_NAME}\"
      az acr build --image ${CONTAINER_IMAGE_NAME} \
        --registry ${REGISTRY_NAME} \
        --file ${DOCKERFILE_NAME} .
    '''
  }
  dependsOn: [
    acrIdentityRoleAssignment
    acrResource
  ]
}

output containerImagePath string = '${acrResource.properties.loginServer}/${containerImageName}'
output managedIdentityId string = managedIdentity.id
