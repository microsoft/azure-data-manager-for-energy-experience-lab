// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';

import { OsduVersionService } from './osdu-version.service';

describe('OsduVersionService', () => {
  let service: OsduVersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OsduVersionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
