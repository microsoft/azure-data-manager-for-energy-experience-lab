// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LegalTagOverviewComponent } from './legal-tag-overview.component';

describe('LegalTagOverviewComponent', () => {
  let component: LegalTagOverviewComponent;
  let fixture: ComponentFixture<LegalTagOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LegalTagOverviewComponent ],
      imports: [ HttpClientTestingModule ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(LegalTagOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
