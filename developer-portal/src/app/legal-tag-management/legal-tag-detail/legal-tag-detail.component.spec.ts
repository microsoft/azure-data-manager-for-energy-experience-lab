// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';

import { LegalTagDetailComponent } from './legal-tag-detail.component';

describe('LegalTagDetailComponent', () => {
  let component: LegalTagDetailComponent;
  let fixture: ComponentFixture<LegalTagDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ LegalTagDetailComponent ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LegalTagDetailComponent);
    component = fixture.componentInstance;
    component.editForm = new FormGroup({});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
