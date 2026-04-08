// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { OsduVersionService } from './osdu-version.service';

describe('OsduVersionService', () => {
  let service: OsduVersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), OsduVersionService]
    });
    service = TestBed.inject(OsduVersionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
