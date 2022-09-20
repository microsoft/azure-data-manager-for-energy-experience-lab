// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DropDownOption } from 'src/app/models/drop-down-option';
import { UserGroup } from 'src/app/models/user-group.enum';
import { UserManagementService } from '../services/user-management.service'
import { ProcessStatus } from '../models/user-management-status.enum';
import { UserProfile } from 'src/app/models/user-profile';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  @Input() public userProfile: UserProfile;
  @Output() public closedEditUser: EventEmitter<void> = new EventEmitter();

  public editUserForm = new FormGroup({
    objectId: new FormControl({value: '', disabled: true}, [Validators.required]),
    group: new FormControl([Validators.required])
  });
  public eUserEditStatus = ProcessStatus;
  public editStatus: ProcessStatus;
  public editUserResultMessage: String;
  public groups: DropDownOption[];

  constructor(private userManagementService: UserManagementService) { }

  ngOnInit(): void {
    this.editUserForm.controls.objectId.setValue(this.userProfile.id);
    this.editUserForm.controls.group.setValue(this.userProfile.groups[0]);
    this.groups = [
      { value: UserGroup.Viewer, displayValue: "Reader" },
      { value: UserGroup.Editor, displayValue: "Contributor" },
      { value: UserGroup.Admin, displayValue: "Admin" },
      { value: UserGroup.Ops, displayValue: "Owner" }
    ];
  }

  /**
   * Handler for the close edit user button
   */
  public closeEditUser() {
    this.closedEditUser.emit();
  }

  /**
   * Removes all groups from the user, regardless if they have the group, and assigns the desired one.
   * To avoid a race condition we wait for the removal of the group that the user is trying to assign before assigning it.
   */
  public editUser() {
    this.editStatus = ProcessStatus.InProgress
    const groupsToRemove = new Set(Object.values(UserGroup));
    groupsToRemove.delete(this.editUserForm.value.group);
    groupsToRemove.delete(UserGroup.Users);

    this.userManagementService.removeGroup(this.editUserForm.getRawValue().objectId, this.editUserForm.value.group).subscribe({
      error: (_) =>{
        this.assignGroup(this.editUserForm.getRawValue().objectId, this.editUserForm.value.group);
      },
      complete: () => {
        this.assignGroup(this.editUserForm.getRawValue().objectId, this.editUserForm.value.group);

      }
    })

    groupsToRemove.forEach(group => {
      this.userManagementService.removeGroup(this.editUserForm.getRawValue().objectId, group).subscribe();
    });
  }

  /**
   * Assigns a group to the user
   */
  private assignGroup(oid: String, group: String) {
    this.userManagementService.assignUserToGroup(oid, group).subscribe({
      error: (_) => {
        this.editStatus = ProcessStatus.Failed;
        this.editUserResultMessage = "Failed to update group";
      },
      complete: () => {
        this.editStatus = ProcessStatus.Succeeded
        this.editUserResultMessage = "Updated group"
        this.userProfile.groups = [group as UserGroup];
      }
    });
  }
}
