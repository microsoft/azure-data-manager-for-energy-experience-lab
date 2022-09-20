// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, Observable } from 'rxjs';
import { UserProfile } from 'src/app/models/user-profile';
import { UserGroup } from 'src/app/models/user-group.enum';
import { DataGroup } from '../models/data-group';
import { GetGroupMembersResponse, Member } from '../models/get-group-members-response';
import { GetGroupsResponse } from '../models/get-groups-response';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {

  constructor(private http: HttpClient) { }

  /**
   * Creates a user
   * @param objectIdentifier The objectIdentifier (OID) of the user to create
   */
  public createUser(objectIdentifier: String): Observable<Object> {
    return this.assignUserToGroup(objectIdentifier, "users");
  }

  /**
   * Performs user assignment to
   * @param objectIdentifier The user's objectIdentifier (OID) that will have the group assigned to it
   * @param group The group to assign to the user
   */
  public assignUserToGroup(objectIdentifier: String, group: String): Observable<Object> {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);
    let groupToAssign = `${group}@${environment.dataPartition}.${environment.domain}`

    return this.http.post(`https://${environment.apiHost}/api/entitlements/v2/groups/${groupToAssign}/members`, {"email": objectIdentifier, "role": "MEMBER"}, {headers: headers});
  }

  /**
   * Removes a user from a specified group
   * @param objectIdentifier The user's objectIdentifier (OID)
   * @param group The group to remove the user from
   */
    public removeUserFromGroup(objectIdentifier: String, group: String): Observable<Object> {
      let headers = new HttpHeaders();
      headers = headers.set('data-partition-id', environment.dataPartition);
      let groupToAssign = `${group}@${environment.dataPartition}.${environment.domain}`

      return this.http.delete(`https://${environment.apiHost}/api/entitlements/v2/groups/${groupToAssign}/members/${objectIdentifier}`,  {headers: headers});
    }

  /**
   * Removes the user
   * @param objectIdentifier The objectIdentifier (OID) of the user to remove the group from
   * @param group The group to remove from the user
   */
  public removeGroup(objectIdentifier: String, group: String): Observable<Object> {
  let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);
    let groupToRemove = `${group}@${environment.dataPartition}.${environment.domain}`

    return this.http.delete(`https://${environment.apiHost}/api/entitlements/v2/groups/${groupToRemove}/members/${objectIdentifier}`, {headers: headers});
  }

  /**
   * Deletes a user
   * @param objectIdentifier The user's objectIdentifier (OID)
   */
  public deleteUser(objectIdentifier: String) {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);

    return this.http.delete(`https://${environment.apiHost}/api/entitlements/v2/members/${objectIdentifier}`, {headers: headers});
  }

  /**
   * Gets the member users in the 'users' group. Owners are not returned in the response.
   * @returns The member users in the 'users' group
   */
  public getUsers(): Observable<UserProfile[]> {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);
    let group = `users@${environment.dataPartition}.${environment.domain}`

    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/groups/${group}/members?role=MEMBER`, {headers: headers})
      .pipe(map((response: any) => {
        const users: UserProfile[] = [];
        response.members.forEach(user => {
          const userProfile = new UserProfile();
          userProfile.id = user.email;
          users.push(userProfile);

          this.getUsersGroups(userProfile.id).subscribe({
            next: (groups) => {
              userProfile.groups = groups;
            }
          });
        });

        return users;
    }));
  }

  /**
   * Gets a user's groups
   * @param objectIdentifier The user to get group info about
   * @returns The user's groups
   */
  private getUsersGroups(objectIdentifier: String): Observable<UserGroup[]> {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);

    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/members/${objectIdentifier}/groups?type=user`, {headers: headers}).pipe(map((userGroupsResponse: any) => {
      const groups: UserGroup[] = [];
      userGroupsResponse.groups.forEach(group => {
        // Filter out the users group and groups not in UserGroup enum (e.g., users.data.root)
        if (Object.values(UserGroup).includes(group.name) && group.name !== UserGroup.Users) {
          groups.push(group.name as UserGroup)
        }
      });
      return groups;
    }));
  }

  /**
   * Gets all groups that start with the data prefix/type
   * @returns All data type groups and their members
   */
  public getDataGroups(): Observable<DataGroup[]> {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);

    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/groups`, {headers: headers}).pipe(map((response: GetGroupsResponse) => {
      const dataGroups: DataGroup[] = [];
      response.groups.forEach(dataGroupDto => {
        if (!dataGroupDto.name.startsWith('data.')) {
          return;
        }

        var dataGroup : DataGroup = {
          name: dataGroupDto.name,
          email: dataGroupDto.email,
          members: []
        };

        this.getGroupMembers(dataGroupDto.email).subscribe({
          next: (members) => {
            dataGroup.members = members;
          }
        });

        dataGroups.push(dataGroup);
      });

      return dataGroups;
    }));
  }

  /**
   * Gets a group's members
   * @param groupEmail The group's identifying email
   * @returns The group's members
   */
  private getGroupMembers(groupEmail: string): Observable<Member[]> {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);

    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/groups/${groupEmail}/members`, {headers: headers})
      .pipe(map((response: GetGroupMembersResponse) => {
        return response.members;
      }
    ));
  }
}
