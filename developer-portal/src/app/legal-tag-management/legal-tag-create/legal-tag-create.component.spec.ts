// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { LegalTagCreateComponent } from './legal-tag-create.component';

describe('LegalTagCreateComponent', () => {
  let component: LegalTagCreateComponent;
  let fixture: ComponentFixture<LegalTagCreateComponent>;
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LegalTagCreateComponent ],
      imports: [ HttpClientTestingModule ],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(LegalTagCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
