// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { OverlayModule } from "@angular/cdk/overlay";

import { UserOverviewRowComponent } from './user-overview-row.component';

describe('UserOverviewRowComponent', () => {
  let component: UserOverviewRowComponent;
  let fixture: ComponentFixture<UserOverviewRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ UserOverviewRowComponent ],
      imports: [ OverlayModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserOverviewRowComponent);
    component = fixture.componentInstance;
    component.userProfile = {
      id: "id",
      name: "name",
      email: "email",
      groups: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
