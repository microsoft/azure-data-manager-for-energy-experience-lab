// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-rest',
  templateUrl: './rest.component.html',
  styleUrls: ['./rest.component.css']
})
export class RestComponent implements OnInit {
  public clientId = environment.clientId;
  public tenantId = environment.tenantId;
  public host = environment.apiHost;
  public dataPartition = environment.dataPartition;
  public instanceName = environment.instanceName;
  public developerPortalUrl = environment.redirectUrl;

  public showRestClientSettings;
  public restClientSettingsLabel;

  public get refreshToken() {
    return this.profileService.getRefreshToken();
  }

  constructor(private profileService: ProfileService) { }

  ngOnInit(): void {
    this.showRestClientSettings = false;
    this.restClientSettingsLabel = "Show Client Config"
  }

  public toggleRestClientSettings() {
    this.showRestClientSettings = !this.showRestClientSettings;
    if (this.showRestClientSettings) {
      this.restClientSettingsLabel = "Hide Client Config"
    }
    else {
      this.restClientSettingsLabel = "Show Client Config"
    }
  }

}
