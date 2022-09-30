# Control Plane

## About

The control plane contains all the scripts and resources necessary to create instances of Experience lab (Microsoft Energy Data Services instance, portal site, TNO data set, etc.). It can be created in an Azure subscription via ARM template.

## Installing the Control Plane

### Requirements

- You must have the ability to create resources in your subscription.

### Deploy Via Hosted ARM Template

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmicrosoft%2Fenergy-data-services-experience-lab%2Fmain%2Fazuredeploy.json)

Microsoft Energy Data Services is currently only available in the following Azure regions. We recommend you also use one of these for the control plane.

- East US
- South Central US
- North Europe
- West Europe

### Deploy Via Local Machine

Install the following items

- Azure CLI ([install](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Azure Bicep CLI (install with `az bicep install`)

You can use the main.bicep file locally to run the deployment from your machine.

```bash
az login
az account set --subscription "<your_subscription_ID>"

$deploymentName="<your_deployment_name>"
$location="<your_location>" # e.g. eastus
$name="<your_control_plane_name>"

az deployment sub create \
    --name $deploymentName \
    --location $location \
    --parameters controlPlaneName=$name controlPlaneLocation=$location \
    --template-file ./main.bicep
```

## Creating Experience Lab Instances

### Requirements

Creating an Experience Lab instance involves the creation of an Azure AD Application with a Service Principal Identity. You must have sufficient permissions to register an application with your Azure AD tenant, the ability to create a resource group with resources, and assign roles to a managed identity. Your subscription must be whitelisted for Microsoft Energy Data Services.

### Via Control Plane

Inside each control plane is a template spec named ```CreateLab```. Use this to deploy Experience Lab instances. You must provide a name and the default user's object ID (this can be retrieved from AAD in Azure).

Deploying it will create a container instance that executes [experiencelab.sh](./experiencelab.sh).

**IMPORTANT:** After the template spec completes you must go to the created container instance and complete a device login. This will allow the script to execute.

#### Example

```
To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code ABCDE1234 to authenticate.
```

This script will create each resource included in Experience Lab. This will take approximately 1.5 hours. Deploying Microsoft Energy Data Services takes the longest portion of time. Once this is complete you can go to the created app service and browse to your Experience Lab site.

**IMPORTANT:** There will be another set of commands to run at the end to enable a redirect URI to your Experience Lab site.

Example:

```
az account set --subscription 6bea78f7-e27e-ccd1-bab8-bec000bc145f
az rest --method PATCH --uri 'https://graph.microsoft.com/v1.0/applications/fbf37b91-80f9-4b2e-a941-f0bb171add68' --headers 'Content-Type=application/json' --body '{"spa":{"redirectUris":["https://experiencelab10880.azurewebsites.net/"]}}'
```
