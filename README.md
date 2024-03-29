# Experience Lab - Microsoft Azure Data Manager for Energy

## Build Status

[![CI](https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/microsoft/azure-data-manager-for-energy-experience-lab/actions/workflows/ci.yml)

## About

Experience Lab is an automated, end-to-end deployment accelerator for Microsoft Azure Data Manager for Energy that provides easy, fast deployments with sample dataset(s) for learning, testing, demo and training purposes for customers and partners.

Experience Lab makes it easy to create a Developer Tier instance of Azure Data Manager for Energy. It includes a simple web UI to perform basic management tasks like the creation of users and legal tags, and performing data load of standard, sample data sets. It also includes integration with Power BI Desktop to perform data validation and visualization of loaded data.

It therefore allows even the audience that is not deeply technical to be able to create fully configured, data-loaded instances of Azure Data Manager for Energy quickly, with ease.

Experience Lab is only recommended for non-production use cases. It is open source, so that our customers and partners can freely use it and extend it to their bespoke use cases, including automation of deploying their own applications with Azure Data Manager for Energy.

### Components

- [Control plane](./control-plane)
- [Portal](./developer-portal)
  - [REST Scripts](./rest-scripts)
  - [Swagger](./developer-portal/src/assets/swagger.yaml)
- [Data load](./data-load)

## Installing and running Experience Lab

### Requirements

- Experience Lab must be deployed in a region currently supported by Azure Data Manager for Energy.
- The default installation script for the Experience Lab control plane requires the following privileges:
  - Owner, Service Administrator, Co-Administrator, or Contributor + User Access Administrator at the subscription level.
  - Permission to register an application with your Azure AD tenant.

### Create Control Plane Via ARM Template

Use the button below to deploy the Experience Lab Control Plane to your Azure Subscription. Further instructions are in [`/control-plane`](/control-plane)

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fmicrosoft%2Fazure-data-manager-for-energy-experience-lab%2Fmain%2Fazuredeploy.json)

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit [https://cla.opensource.microsoft.com](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
