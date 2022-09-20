// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { LegalTagManagementService } from './legal-tag-management.service';

describe('LegalTagManagementService', () => {
  let service: LegalTagManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LegalTagManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
