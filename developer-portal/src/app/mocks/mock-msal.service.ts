// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { InteractionStatus } from '@azure/msal-browser';
import { MOCK_USER_ACCOUNT } from './mock-data';

@Injectable({ providedIn: 'root' })
export class MockMsalService {
  instance = {
    getActiveAccount: () => ({
      username: MOCK_USER_ACCOUNT.username,
      name: MOCK_USER_ACCOUNT.name,
      localAccountId: MOCK_USER_ACCOUNT.localAccountId,
    }),
    getAllAccounts: () => [this.instance.getActiveAccount()],
    setActiveAccount: () => {},
  };

  logoutRedirect(): Observable<void> {
    return of(undefined);
  }

  acquireTokenSilent(): Observable<any> {
    return of({ accessToken: 'mock-access-token' });
  }
}

@Injectable({ providedIn: 'root' })
export class MockMsalBroadcastService {
  inProgress$ = new BehaviorSubject<InteractionStatus>(InteractionStatus.None);
}
