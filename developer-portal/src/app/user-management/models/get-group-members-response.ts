// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface GetGroupMembersResponse {
  members: Member[];
}

export interface Member {
  dataPartitionId: string;
  email: string;
  memberType: string;
  role: string;
}
