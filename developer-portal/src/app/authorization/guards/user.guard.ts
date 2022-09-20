// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';
import { UserGroup } from 'src/app/models/user-group.enum';
import { ProfileService } from 'src/app/services/profile.service';
import { AuthorizationService } from '../services/authorization.service';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {

  constructor(private router: Router,
              private profileService: ProfileService,
              private authorizationService: AuthorizationService) {
  }

  /**
   * Verifies the user exists
   * @returns True if the user is in the users group, false/redirects to unauthorized if not
   */
  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.profileService.getUserProfile().pipe(
      switchMap(_ => this.authorizationService.IsUserInGroup(UserGroup.Users).pipe(map(result => {
        if (result) {
          return true;
        }
        else {
          return this.router.parseUrl('/unauthorized');
        }
      })))
    )
  }
}
