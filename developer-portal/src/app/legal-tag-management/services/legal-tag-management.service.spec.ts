// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LegalTagManagementService } from './legal-tag-management.service';

describe('LegalTagManagementService', () => {
  let service: LegalTagManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(LegalTagManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
