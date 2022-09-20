// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo, InteractionStatus } from '@azure/msal-browser';
import { filter, map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserProfile } from '../models/user-profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private authService: MsalService, private msalBroadcastService: MsalBroadcastService, private http: HttpClient) { }

  /**
   * Gets the user's profile
   * @returns The users profile
   */
  public getUserProfile(): Observable<UserProfile> {
    var activeUser = this.authService.instance.getActiveAccount();
    if (activeUser) {
      return of(this.convertProfileFromMsal(activeUser));
    }
    return this.msalBroadcastService.inProgress$.pipe(
      filter((status: InteractionStatus) =>  status === InteractionStatus.None && this.authService.instance.getAllAccounts().length > 0),
      map(() => {
        this.setActiveAccount();
        var activeUser = this.authService.instance.getActiveAccount();
        return this.convertProfileFromMsal(activeUser);
      })
    );
  }

  public getAssignedGroups(): Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);
    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/groups`, {headers: headers})
      .pipe(map((userGroupsResponse: any) => {
        return userGroupsResponse.groups;
    }));
  }

  /**
   * Gets the user's refresh token
   * @returns The user's refresh token
   */
  public getRefreshToken(): string {
    var refreshTokenKey = Object.keys(window.localStorage).find(key => key.includes('refreshtoken'));
    return refreshTokenKey ? JSON.parse(window.localStorage.getItem(refreshTokenKey)).secret : "Error: Unable to locate refresh token";
  }

  /**
   * Converts the MSAL account to a UserProfile
   * @param msalAccount The msal account
   * @returns A converted user profile
   */
  private convertProfileFromMsal(msalAccount: AccountInfo): UserProfile {
    const userProfile = new UserProfile();
    userProfile.email = msalAccount.username;
    userProfile.name = msalAccount.name;
    userProfile.id = msalAccount.localAccountId;
    return userProfile;
  }

  /**
   * Sets MSAL's active account
   */
  private setActiveAccount() {
    let accounts = this.authService.instance.getAllAccounts();
    this.authService.instance.setActiveAccount(accounts[0]);
  }
}
