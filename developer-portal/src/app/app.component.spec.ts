// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MsalService } from '@azure/msal-angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { UserProfile } from './models/user-profile';
import { ProfileService } from './services/profile.service';

describe('AppComponent', () => {
  const msalServiceStub: Partial<MsalService> = {
    logoutRedirect(request?: any): Observable<void> {
      return of(null);
    }
  };

  const profileServiceStub: Partial<ProfileService> = {
    getUserProfile(request?: any):Observable<UserProfile> {
      return of(null);
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatSidenavModule,
        NoopAnimationsModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: MsalService, useValue: msalServiceStub },
        { provide: ProfileService, useValue: profileServiceStub }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
