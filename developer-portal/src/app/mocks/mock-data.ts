// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const MOCK_USER_ACCOUNT = {
  username: 'dev@localhost.com',
  name: 'Dev User',
  localAccountId: 'mock-oid-00000000-0000-0000-0000-000000000001',
};

export const MOCK_GROUPS = [
  { name: 'users', description: 'Users group', email: 'users@opendes.dataservices.energy' },
  { name: 'users.datalake.viewers', description: 'Viewers', email: 'users.datalake.viewers@opendes.dataservices.energy' },
  { name: 'users.datalake.editors', description: 'Editors', email: 'users.datalake.editors@opendes.dataservices.energy' },
  { name: 'users.datalake.admins', description: 'Admins', email: 'users.datalake.admins@opendes.dataservices.energy' },
  { name: 'users.datalake.ops', description: 'Ops', email: 'users.datalake.ops@opendes.dataservices.energy' },
  { name: 'data.default', description: 'Default data group', email: 'data.default@opendes.dataservices.energy' },
  { name: 'data.welldb', description: 'Well database group', email: 'data.welldb@opendes.dataservices.energy' },
];

export const MOCK_USERS = [
  { dataPartitionId: 'opendes', email: 'dev@localhost.com', memberType: 'USER', role: 'MEMBER' },
  { dataPartitionId: 'opendes', email: 'alice@contoso.com', memberType: 'USER', role: 'MEMBER' },
  { dataPartitionId: 'opendes', email: 'bob@contoso.com', memberType: 'USER', role: 'MEMBER' },
];

export const MOCK_LEGAL_TAGS = [
  {
    name: 'opendes-public-usa-dataset-1',
    description: 'Public USA dataset for testing',
    properties: {
      contractId: 'A1234',
      originator: 'MyCompany',
      dataType: 'Public Domain Data',
      securityClassification: 'Public',
      personalData: 'No Personal Data',
      exportClassification: 'EAR99',
      countryOfOrigin: ['US'],
      expirationDate: '2029-12-31',
    }
  },
  {
    name: 'opendes-private-usa-dataset-2',
    description: 'Private USA dataset',
    properties: {
      contractId: 'B5678',
      originator: 'Partner Inc',
      dataType: 'Third Party Data',
      securityClassification: 'Private',
      personalData: 'No Personal Data',
      exportClassification: 'EAR99',
      countryOfOrigin: ['US'],
      expirationDate: '2028-06-30',
    }
  },
  {
    name: 'opendes-tno-test-data',
    description: 'TNO open test data legal tag',
    properties: {
      contractId: 'TNO-001',
      originator: 'TNO',
      dataType: 'Public Domain Data',
      securityClassification: 'Public',
      personalData: 'No Personal Data',
      exportClassification: 'Not Technical Data',
      countryOfOrigin: ['NL'],
      expirationDate: '2029-12-31',
    }
  },
];

export const MOCK_VERSION_INFO = {
  version: '0.29.0',
  artifactId: 'entitlements-v2',
  groupId: 'org.opengroup.osdu',
};
