// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserProfile } from 'src/app/models/user-profile';
import { UserGroup } from 'src/app/models/user-group.enum';

@Component({
  selector: 'app-user-overview-row',
  templateUrl: './user-overview-row.component.html',
  styleUrls: ['./user-overview-row.component.css']
})
export class UserOverviewRowComponent {
  @Input() public userProfile: UserProfile;
  @Output() public deletedUser: EventEmitter<UserProfile> = new EventEmitter();
  public showEditUser = false;
  public showDeleteUser = false;

  constructor() { }

  public toggleEditUser() {
    this.showEditUser = !this.showEditUser;
  }

  public toggleDeleteUser() {
    this.showDeleteUser = !this.showDeleteUser;
  }

  public closeEditUser() {
    this.showEditUser = false;
  }

  public closeDeleteUser() {
    this.showDeleteUser = false;
  }

  public handleDeletedUser(user: UserProfile) {
    this.deletedUser.emit(user);
  }

  public getGroup() {
    if (!this.userProfile.groups) {
      return "Assign Group"
    }

    switch (this.userProfile.groups[0]) {
      case UserGroup.Admin:
        return "Admin";
      case UserGroup.Editor:
        return "Contributor";
      case UserGroup.Ops:
        return "Owner";
      case UserGroup.Viewer:
        return "Reader";
      default:
        return "Assign Group"
    }
  }
}
