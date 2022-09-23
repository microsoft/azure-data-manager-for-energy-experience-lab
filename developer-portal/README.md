# Developer Portal

## About

The developer portal is a getting started Angular website that includes instructions for calling Microsoft Energy Data Services APIs, functions for retrieving Authorization tokens, sample Power BI integration, basic user management, and more. It can be created from a control plane or run locally against an existing service instance.

## Run via Local Machine

### Requirements

1. [Docker](https://docs.docker.com/desktop/windows/install/) installed and running on local machine.
1. A Microsoft Energy Data Services instance.
1. An AAD application that's been properly configured with the service instance.

### Configure the AAD App redirect URL

You need to add a Single Page Application (SPA) redirect URL to your AAD App

1. Open the Azure Portal and navigate to your AAD App
1. Go to the Authentication tab
1. Add `http://localhost:80` to the list of redirect Single-page application URLs
1. Copy your app's client ID for the next step

### Setting the Environment File

Create an environment variable file at `src\environments\environment.ts` in the following format:

```typescript
export const environment = {
  tenantId: "00000000-0000-0000-0000-000000000000", // Your AAD tenant's ID
  clientId: "00000000-0000-0000-0000-000000000000", // Your AAD app's client ID
  apiHost: "platform0000.energy.azure.com", // Your Microsoft Energy Data Services instance's endpoint
  dataPartition: "platform0000-opendes",
  scopes: ".default openid profile offline_access",
  redirectUrl: "http://localhost:80",
  instanceName: "platform0000",
  domain: "dataservices.energy",
  buildNumber: "local",
  powerBiConnectorFileName: "connector.mez",
  tnoTemplateSpecUrl: "dataservices.energy"
};
```

### Setup the Swagger File

Add the following to the bottom of the swagger.yml file:

```yaml
servers:
  - url: https://<your Microsoft Energy Data Services instance name>.energy.azure.com
```

You will also need to update the data partition names by replacing all instances of `opendes` with your actual data partition

### Run the Site with Docker

The website can be run in a docker container with:

```bash
docker compose up -d
```

This will serve the website and support hot reloading using [Dockerfile-local](Dockerfile-local).

Access the website at <http://localhost:80>

### Run the Site with nginx

The site can be built and run with nginx using:

```bash
docker build -t <image name> .
docker run -d -p 80:80 <image name>
```

Access the website at <http://localhost:80>

### Running the site in a Linux based Azure Web App

The website and [Dockerfile](Dockerfile) is ready to be deployed in a Linux based Azure Web App. Simply run the following commands to host the site in Azure

```bash
# Create the ACR
az acr create --name <registry name> --resource-group <resource group> --sku standard --admin-enabled true --location <region>

# Build the image and publish to ACR
az acr build --registry <registry name> --image <image name> .
 
# Create the Linux App Service Plan
az appservice plan create -g <resource group> -n <app service plan name> --is-linux --location <region>

# Create the Docker based Web app
az webapp create -g <resource group> -p <app service plan name> -n <web app name> -i <registry name>.azurecr.io/<image name>:latest
```

Access the website at `https://<web app name>.azurewebsites.net`

## Reference

### User Management

You can manage users and group membership in the `/users` page of the developer portal. You can add users to one of the following groups:

1. Reader - users.datalake.viewers
1. Contributor - users.datalake.editors
1. Admin - users.datalake.admins
1. Owner - users.datalake.ops

You can also manage user membership in data groups/ACLs. The following ACLs will exist by default. The `users.data.root` group will be added to each ACL.

1. data.default.viewers
1. data.default.owners
1. data.tno.viewers (The TNO data set will be associated with this group)
1. data.tno.owners (The TNO data set will be associated with this group)

### Linting Code

Use the CLI command

```bash
  ng lint
```

Use the VS Code extension [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

### Updating NPM packages

We use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update the packages to the latest version.

```bash
  ncu -u
  npm install
```

### Resources

Msal Login [Tutorial: Sign in users and call the Microsoft Graph API from an Angular single-page application (SPA) using auth code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-angular-auth-code#sign-in-a-user)

[Running an Angular app in Docker](https://mherman.org/blog/dockerizing-an-angular-app/)

[Side menu](https://www.thecodehubs.com/create-a-responsive-sidebar-menu-with-angular-material/)

[ESLint](https://eslint.org/) - ESLint statically analyzes your code to quickly find problems.

[Angular + ESLint](https://github.com/angular-eslint/angular-eslint#angular-eslint) - Tooling which enables ESLint to lint Angular projects
