// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { LegalTagDetailComponent } from './legal-tag-detail.component';

describe('LegalTagDetailComponent', () => {
  let component: LegalTagDetailComponent;
  let fixture: ComponentFixture<LegalTagDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LegalTagDetailComponent ],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
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
