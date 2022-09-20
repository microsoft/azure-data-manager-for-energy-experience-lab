// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { environment } from 'src/environments/environment';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ProfileService } from './services/profile.service';
import { UserProfile } from './models/user-profile';
import { AuthorizationService } from './authorization/services/authorization.service';
import { UserGroup } from './models/user-group.enum';
import { OsduVersionService } from './services/osdu-version.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  public profile: UserProfile;
  public isUserAuthorized: boolean;
  public osduVersion: string;

  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;

  constructor(private authService: MsalService,
              private observer: BreakpointObserver,
              private profileService: ProfileService,
              private authorizationService: AuthorizationService,
              private osduVersionService: OsduVersionService) { }

  public ngOnInit() {
    this.setUserProfile();
    this.getOsduVersion();
    this.authorizationService.IsUserInGroup(UserGroup.Users)
      .subscribe({
        next: (result) => {
          this.isUserAuthorized = result;
        },
        error: () => {
          this.isUserAuthorized = false;
        }
      })
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.observer.observe(['(max-width: 800px)']).subscribe((state) => {
        if (state.matches) {
          this.sidenav.mode = 'over';
          this.sidenav.close();
        } else {
          this.sidenav.mode = 'side';
          this.sidenav.open();
        }
      });
    }, 1);
   }

  public logout() {
    this.authService.logoutRedirect({
      postLogoutRedirectUri: environment.redirectUrl
    });
  }

  public getBuildNumber(): string {
    return environment.buildNumber;
  }

  private getOsduVersion() {
    this.osduVersionService.getOsduVersion().subscribe({
      error: (_) => {
        this.osduVersion = "Unknown";
      },
      next: (version) => {
        this.osduVersion = version;
      }
    });
  }

  /**
   * Sets the user's profile
   */
  private setUserProfile() {
    this.profileService.getUserProfile().subscribe({
      next: (response) => {
        this.profile = response;
      }
    })
  }
}
