// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, OnInit } from '@angular/core';
import { UserProfile } from 'src/app/models/user-profile';
import { DataGroup } from '../models/data-group'
import { GroupAssignmentEventService } from '../services/assignment-event.service';
import { UserManagementService } from '../services/user-management.service';

@Component({
  selector: 'app-user-overview',
  templateUrl: './user-overview.component.html',
  styleUrls: ['./user-overview.component.css']
})
export class UserOverviewComponent implements OnInit {

  constructor(private userManagementService: UserManagementService, private eventService: GroupAssignmentEventService) { }
  public userProfiles: UserProfile[] = [];
  public dataGroups: DataGroup[] = [];
  public showCreateUser = false;
  public failedToLoadUsers = false;
  public failedToLoadDataGroups = false;

  ngOnInit(): void {
    this.getUsers();
    this.getDataGroups();

    this.eventService.eventListener().subscribe(() => {
      this.getDataGroups();
    })
  }

  public isLoadingUsers(): Boolean {
    const areUsersLoaded = Array.isArray(this.userProfiles) && !this.userProfiles.length;
    return !this.failedToLoadUsers && areUsersLoaded;
  }

  public isLoadingDataGroups(): Boolean {
    const areDataGroupsLoaded = Array.isArray(this.dataGroups) && !this.dataGroups.length;
    return !this.failedToLoadDataGroups && areDataGroupsLoaded;
  }

  public removeUserFromView(userProfile: UserProfile) {
    this.userProfiles = this.userProfiles.filter(element => element !== userProfile);
  }

  public toggleCreateUser() {
    this.showCreateUser = !this.showCreateUser;
  }

  public closeCreateUser() {
    this.showCreateUser = false;
  }

  public addUserToView(newUser: UserProfile) {
    this.userProfiles.unshift(newUser);
  }

  private getUsers() {
    this.userManagementService.getUsers().subscribe({
      error: (_) => {
        this.failedToLoadUsers = true;
        this.userProfiles = []
      },
      next: (users) => {
        this.userProfiles = users;
      }
    });
  }

  private getDataGroups() {
    this.userManagementService.getDataGroups().subscribe({
      error: (_) => {
        this.failedToLoadDataGroups = true;
        this.dataGroups = []
      },
      next: (dataGroups) => {
        this.dataGroups = dataGroups;
      }
    });
  }
}
