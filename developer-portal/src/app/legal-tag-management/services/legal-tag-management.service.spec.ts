// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LegalTagManagementService } from './legal-tag-management.service';

describe('LegalTagManagementService', () => {
  let service: LegalTagManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(LegalTagManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
