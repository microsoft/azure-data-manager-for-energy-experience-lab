// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { environment } from 'src/environments/environment';
import { ProfileService } from '../services/profile.service';
import { UserProfile } from '../models/user-profile';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTooltip } from '@angular/material/tooltip';

class Tokens {
  access?: string;
  refresh?: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterContentInit {
  public profile: UserProfile;
  public groupsDataSource: MatTableDataSource<any>;
  public tokens = new Tokens();
  public showAccessToken = false;
  public showRefreshToken = false;
  public accessTokenToggleLabel: string;
  public refreshTokenToggleLabel: string;
  public displayedColumns: string[] = ['name', 'description'];
  public isLoadingGroups = true;
  public failedToLoadGroups = false;
  public numberOfGroups = 0;
  public defaultTextForCopyButton = "Copy to clipboard";

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('accessTokenToolTip') accessTokenToolTip: MatTooltip;
  @ViewChild('refreshTokenToolTip') refreshTokenToolTip: MatTooltip;

  constructor(private authService: MsalService, private profileService: ProfileService) { }

  ngOnInit() {
    this.configureTokens();
    this.getProfile();
    this.getAccessToken();
    this.getGroups();
  }

  ngAfterContentInit (): void {
    this.configureTable();
  }

  private configureTokens() {
    this.accessTokenToggleLabel = "Show Secret";
    this.refreshTokenToggleLabel = "Show Secret";
    this.showAccessToken = false;
    this.showRefreshToken = false;
  }

  private configureTable() {
    this.groupsDataSource = new MatTableDataSource();
    this.groupsDataSource.paginator = this.paginator;
    this.groupsDataSource.sort = this.sort;
  }

  private getGroups() {
    this.isLoadingGroups = true;
    this.failedToLoadGroups = false;

    this.profileService.getAssignedGroups().subscribe({
      next: (groups) => {
        this.isLoadingGroups = false;
        this.groupsDataSource.data = groups;
        this.numberOfGroups = groups.length;
      },
      error: (_) => {
        this.failedToLoadGroups = true;
        this.isLoadingGroups = false;
        this.numberOfGroups = 0;
      }
    })
  }

  /**
   * Gets the user's profile
   */
  private getProfile() {
    this.profileService.getUserProfile().subscribe({
      next: (response) => {
        this.profile = response;
      }
    })
  }

  /**
   * Silently gets an access token with scopes necessary to call APIs
   */
  private getAccessToken() {
    this.authService.acquireTokenSilent({scopes: [`${environment.clientId}/${environment.scopes}`], account: this.authService.instance.getActiveAccount()}).subscribe(response => {
      this.tokens.access = response.accessToken;
      this.getRefreshToken();
    });
  }

  /**
   * Gets the user's refresh token from the browser's local storage cache
   */
  private getRefreshToken() {
    this.tokens.refresh = this.profileService.getRefreshToken();
  }

  private copySecret(value: string) {
    navigator.clipboard.writeText(value);
  }

  private setToolTipTextToCopied(toolTip: MatTooltip) {
    toolTip.hide();
    toolTip.message = "Copied"
    toolTip.show();
  }

  public resetCopySecretToolTipMessage() {
    this.accessTokenToolTip.message = this.defaultTextForCopyButton;
    this.refreshTokenToolTip.message = this.defaultTextForCopyButton;
  }

  public copyAccessToken() {
    this.copySecret(this.tokens.access);
    this.setToolTipTextToCopied(this.accessTokenToolTip);
  }

  public copyRefreshToken() {
    this.copySecret(this.tokens.refresh);
    this.setToolTipTextToCopied(this.refreshTokenToolTip);
  }

  public toggleAccessToken() {
    this.showAccessToken = !this.showAccessToken;
    if (this.showAccessToken) {
      this.accessTokenToggleLabel = "Hide Secret";
    }
    else {
      this.accessTokenToggleLabel = "Show Secret";
    }
  }

  public toggleRefreshToken() {
    this.showRefreshToken = !this.showRefreshToken;
    if (this.showRefreshToken) {
      this.refreshTokenToggleLabel = "Hide Secret";
    }
    else {
      this.refreshTokenToggleLabel = "Show Secret";
    }
  }

  public applyFilter(filterValue: string) {
    this.groupsDataSource.filter = filterValue.trim().toLowerCase();
    if (this.groupsDataSource.paginator) {
      this.groupsDataSource.paginator.firstPage();
    }
  }
}
