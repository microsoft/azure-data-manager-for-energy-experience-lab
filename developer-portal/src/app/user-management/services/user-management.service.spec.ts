// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UserManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
