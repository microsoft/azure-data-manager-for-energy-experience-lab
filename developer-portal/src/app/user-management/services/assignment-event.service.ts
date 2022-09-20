// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { GroupAssignmentAction } from "../group-assignment/group-assignment-action.enum";

@Injectable({
  providedIn: 'root'
})
export class GroupAssignmentEventService {
  private groupAssignmentEvent = new BehaviorSubject<GroupAssignmentAction>(null);

  emitEvent(action: GroupAssignmentAction) {
    this.groupAssignmentEvent.next(action);
  }

  eventListener() {
    return this.groupAssignmentEvent.asObservable();
  }
}
