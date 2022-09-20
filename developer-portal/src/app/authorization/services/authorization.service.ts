// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { UserGroup } from 'src/app/models/user-group.enum';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  /**
   * Caches the user's groups to prevent unnecessary HTTP calls
   */
  private cachedUserGroups: any[] = null;

  constructor(private http: HttpClient) { }

  /**
   * Checks if the authenticated user is in the specified group
   * @param group The group to verify the user belongs to
   * @returns True if the user in the group, false otherwise
   */
  public IsUserInGroup(group: UserGroup): Observable<boolean> {
    if (this.cachedUserGroups !== null) {
      return of(this.ContainsGroup(this.cachedUserGroups, group));
    }

    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);
    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/groups`, {headers: headers})
      .pipe(map((userGroupsResponse: any) => {
        this.cachedUserGroups = userGroupsResponse.groups;
        return this.ContainsGroup(this.cachedUserGroups, group);
    }), catchError(() => {
      return of(false);
    }));
  }

  private ContainsGroup(usersGroups: any[], group: UserGroup): boolean {
    return Array.isArray(usersGroups) &&
    !!usersGroups.length &&
    usersGroups.some(usersGroup => usersGroup.name === group);
  }
}
