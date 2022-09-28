// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';

import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const msalServiceStub: Partial<MsalService> = {
    logoutRedirect(request?: any): Observable<void> {
      return of(null);
    }
  };

  class msalBroadcastServiceStub {
    inProgress$: Observable<InteractionStatus>
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: MsalService, useValue: msalServiceStub },
        { provide: MsalBroadcastService, useValue: msalBroadcastServiceStub }
      ]
    });
    service = TestBed.inject(ProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
