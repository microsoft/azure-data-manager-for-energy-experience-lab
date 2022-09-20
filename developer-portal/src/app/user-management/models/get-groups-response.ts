// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface GetGroupsResponse {
  desId: string;
  memberEmail: string;
  groups: EntitlementGroup[];
}

export interface EntitlementGroup {
  name: string;
  description: string;
  email: string;
}
