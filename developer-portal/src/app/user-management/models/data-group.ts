// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Member } from './get-group-members-response';

export interface DataGroup {
  name: string;
  email: string;
  members: Member[];
}
