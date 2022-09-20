// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, Input, ViewChild } from '@angular/core';
import { MatSelectionList } from '@angular/material/list';
import { GroupAssignmentAction } from '../group-assignment/group-assignment-action.enum';
import { DataGroup } from '../models/data-group';
import { GroupAssignmentEventService } from '../services/assignment-event.service';
import { UserManagementService } from '../services/user-management.service';

@Component({
  selector: 'app-group-overview-row',
  templateUrl: './group-overview-row.component.html',
  styleUrls: ['./group-overview-row.component.css']
})
export class GroupOverviewRowComponent {
  @Input() public dataGroup: DataGroup;

  @ViewChild('groups') selectedGroupsList: MatSelectionList

  public showGroupAssignment: boolean = false;
  public groupAssignmentAction: GroupAssignmentAction;
  public eGroupAssignmentAction = GroupAssignmentAction;

  constructor(private userManagementService: UserManagementService, private eventService: GroupAssignmentEventService) { }

  public toggleGroupAssignment(groupAssignmentAction: GroupAssignmentAction) {
    this.groupAssignmentAction = groupAssignmentAction;
    this.showGroupAssignment = !this.showGroupAssignment;
  }

  public closeGroupAssignment() {
    this.showGroupAssignment = false;
  }

  public removeSelectedUsers() {
    var membersToDelete: string[] = this.selectedGroupsList.selectedOptions.selected.map(s => s.value);
    membersToDelete.forEach(memberEmail => {
      this.userManagementService.removeUserFromGroup(memberEmail, this.dataGroup.name).subscribe({
        error: (_) => {},
        complete: () => {}
      });
    })

    this.eventService.emitEvent(this.groupAssignmentAction);
  }
}
