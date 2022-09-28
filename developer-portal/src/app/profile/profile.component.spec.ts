// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, SilentRequest } from '@azure/msal-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { ProfileService } from '../services/profile.service';
import { UserProfile } from '../models/user-profile';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  const instanceSpy = jasmine.createSpyObj('IPublicClientApplication', ['getActiveAccount']);

  const msalServiceStub: Partial<MsalService> = {
    acquireTokenSilent(silentRequest: SilentRequest): Observable<AuthenticationResult> {
      return of();
    },
    instance: instanceSpy
  };

  const profileServiceStub: Partial<ProfileService> = {
    getAssignedGroups(): Observable<any> {
      return of();
    },
    getUserProfile(): Observable<UserProfile> {
      return of();
    },
    getRefreshToken(): string {
      return "token";
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileComponent ],
      imports: [
        HttpClientTestingModule,
        MatTooltipModule
      ],
      providers: [
        { provide: MsalService, useValue: msalServiceStub },
        { provide: ProfileService, useValue: profileServiceStub }
      ]
    })
    .compileComponents().then(() => {
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
