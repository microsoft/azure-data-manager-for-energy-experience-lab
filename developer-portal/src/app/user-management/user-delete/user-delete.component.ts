// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserProfile } from 'src/app/models/user-profile';
import { ProcessStatus } from '../models/user-management-status.enum';
import { UserManagementService } from '../services/user-management.service';

@Component({
  selector: 'app-user-delete',
  templateUrl: './user-delete.component.html',
  styleUrls: ['./user-delete.component.css']
})
export class UserDeleteComponent implements OnInit {
  @Input() public userProfile: UserProfile;
  @Output() public deletedUser: EventEmitter<UserProfile> = new EventEmitter();
  @Output() public closedDeleteUser: EventEmitter<void> = new EventEmitter();

  public deleteUserForm = new FormGroup({
    objectId: new FormControl({value: '', disabled: true}, [Validators.required])
  });
  public eUserManagementStatus = ProcessStatus;
  public deleteStatus: ProcessStatus;
  public deleteUserResultMessage: String;

  constructor(private userManagementService: UserManagementService) {
  }

  ngOnInit(): void {
    this.deleteUserForm.controls.objectId.setValue(this.userProfile.id);
  }

  public closeDeleteUser() {
    this.closedDeleteUser.emit();
  }

  /**
   * Deletes a user
   */
  public deleteUser() {
    this.deleteStatus = ProcessStatus.InProgress;
    this.userManagementService.deleteUser(this.userProfile.id).subscribe({
      error: (_) => {
        this.deleteStatus = ProcessStatus.Failed;
        this.deleteUserResultMessage = "Failed to delete user";
      },
      complete: () => {
        this.deleteStatus = ProcessStatus.Succeeded
        this.deleteUserResultMessage = "Deleted user"
        this.deletedUser.emit(this.userProfile);
      }
    });
  }
}
