# Data Load

## About

Experience Lab provides simple integration for performing basic data loads into a Microsoft Energy Data Services instance.

## TNO Data Set

Experience Lab uses the [osdu-data-load-tno](https://github.com/Azure/osdu-data-load-tno) library for loading the TNO data set. The data set is downloaded from the [OSDU community site](https://community.opengroup.org/osdu/platform/data-flow/data-loading/open-test-data) to the control plane's storage account during control plane setup by executing [downloadTnoData.sh](./open-test-data/downloadTnoData.sh).

Initiate a data load with the ```open-test-data``` template spec in the Experience Lab instance's resource group. This takes approximately 1.5 hours to complete. Progress can be monitored in the created container instance's logs.
