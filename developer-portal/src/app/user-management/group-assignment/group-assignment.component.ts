// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EntitlementGroup } from '../models/get-groups-response';
import { ProcessStatus } from '../models/user-management-status.enum';
import { GroupAssignmentEventService } from '../services/assignment-event.service';
import { UserManagementService } from '../services/user-management.service';
import { GroupAssignmentAction } from './group-assignment-action.enum';

@Component({
  selector: 'app-group-assignment',
  templateUrl: './group-assignment.component.html',
  styleUrls: ['./group-assignment.component.css']
})
export class GroupAssignmentComponent {
  @Output() public closedGroupAssignment: EventEmitter<void> = new EventEmitter();
  @Output() public groupAssignmentCompleted: EventEmitter<any> = new EventEmitter();

  @Input() public groupAssignmentAction: GroupAssignmentAction;
  @Input() public group: EntitlementGroup;

  public groupAssignmentStatus: ProcessStatus;
  public eProcessStatus = ProcessStatus;
  public groupAssignmentForm = new FormGroup({
    objectId: new FormControl('', [Validators.required])
  });
  public groupAssignmentResultMessage: string;

  constructor(private userManagementService: UserManagementService, private eventService: GroupAssignmentEventService) { }

  public get isGroupAddition(): boolean{
    return this.groupAssignmentAction === GroupAssignmentAction.Addition;
  }

  public get isGroupRemoval(): boolean{
    return this.groupAssignmentAction === GroupAssignmentAction.Removal;
  }

  public closeGroupAssignment() {
    this.closedGroupAssignment.emit();
  }

  public enactGroupAssignment() {
    this.groupAssignmentStatus = ProcessStatus.InProgress;

    if (this.groupAssignmentAction === GroupAssignmentAction.Addition) {
      this.userManagementService.assignUserToGroup(this.groupAssignmentForm.value.objectId, this.group.name).subscribe({
        error: (assignmentErrorResponse) => {
          this.groupAssignmentStatus = ProcessStatus.Failed;
          this.groupAssignmentResultMessage = "Failed to assign user"
          if (assignmentErrorResponse instanceof HttpErrorResponse && assignmentErrorResponse.status === 409) {
            this.groupAssignmentResultMessage = "User already assigned to group";
          }
        },
        complete: () => {
          this.groupAssignmentStatus = ProcessStatus.Succeeded;
          this.groupAssignmentResultMessage = "Assigned user to group"
          this.groupAssignmentCompleted.emit();
          this.eventService.emitEvent(this.groupAssignmentAction);
        }
      });
    } else if (this.groupAssignmentAction === GroupAssignmentAction.Removal) {
      this.userManagementService.removeUserFromGroup(this.groupAssignmentForm.value.objectId, this.group.name).subscribe({
        error: (_) => {
          this.groupAssignmentStatus = ProcessStatus.Failed;
          this.groupAssignmentResultMessage = "Failed to remove user"
        },
        complete: () => {
          this.groupAssignmentStatus = ProcessStatus.Succeeded;
          this.groupAssignmentResultMessage = "Removed user from group"
          this.groupAssignmentCompleted.emit();
          this.eventService.emitEvent(this.groupAssignmentAction);
        }
      });
    } else {
      this.groupAssignmentStatus = ProcessStatus.Failed;
    }
  }
}
