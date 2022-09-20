// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { UserGroup } from "./user-group.enum";

export class UserProfile {
    public name: string;
    public id: string;
    public email: string;
    public groups: UserGroup[]
}
