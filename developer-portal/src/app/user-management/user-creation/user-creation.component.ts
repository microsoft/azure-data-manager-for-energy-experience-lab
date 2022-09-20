// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DropDownOption } from 'src/app/models/drop-down-option';
import { UserGroup } from 'src/app/models/user-group.enum';
import { UserManagementService } from '../services/user-management.service'
import { ProcessStatus } from '../models/user-management-status.enum';
import { UserProfile } from 'src/app/models/user-profile';

@Component({
  selector: 'app-user-creation',
  templateUrl: './user-creation.component.html',
  styleUrls: ['./user-creation.component.css']
})
export class UserCreationComponent implements OnInit {
  @Output() public closedCreateUser: EventEmitter<void> = new EventEmitter();
  @Output() public createdUser: EventEmitter<UserProfile> = new EventEmitter();
  public creationForm = new FormGroup({
    objectId: new FormControl('', [Validators.required]),
    group: new FormControl('', [Validators.required])
  });
  public eUserCreationStatus = ProcessStatus;
  public creationStatus: ProcessStatus;
  public creationResultMessage: String;
  public groups: DropDownOption[];

  constructor(private userManagementService: UserManagementService) { }

  ngOnInit(): void {
    this.groups = [
      { value: UserGroup.Viewer, displayValue: "Reader" },
      { value: UserGroup.Editor, displayValue: "Contributor" },
      { value: UserGroup.Admin, displayValue: "Admin" },
      { value: UserGroup.Ops, displayValue: "Owner" }
    ];
  }

  public closeCreateUser() {
    this.closedCreateUser.emit();
  }

  public createUser() {
    this.creationStatus = ProcessStatus.InProgress
    this.userManagementService.createUser(this.creationForm.value.objectId).subscribe({
      next: (_) => {
        var newUser = new UserProfile();
        newUser.id = this.creationForm.value.objectId;
        this.userManagementService.assignUserToGroup(this.creationForm.value.objectId, this.creationForm.value.group).subscribe({
          error: (_) => {
            this.creationStatus = ProcessStatus.Failed;
            this.creationResultMessage = "Created user but failed to assign group";
          },
          complete: () => {
            newUser.groups = [this.creationForm.value.group as UserGroup];
            this.creationStatus = ProcessStatus.Succeeded;
            this.creationResultMessage = "Created user and assigned group"
            this.createdUser.emit(newUser)
          }
        })
      },
      error: (creationErrorResponse) => {
        this.creationStatus = ProcessStatus.Failed
        this.creationResultMessage = "Failed to create user";
        if (creationErrorResponse instanceof HttpErrorResponse && creationErrorResponse.status === 409) {
          this.creationResultMessage = "User already exists";
        }
      }
    });
  }
}
