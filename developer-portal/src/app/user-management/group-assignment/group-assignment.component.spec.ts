// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GroupAssignmentComponent } from './group-assignment.component';

describe('GroupAssignmentComponent', () => {
  let component: GroupAssignmentComponent;
  let fixture: ComponentFixture<GroupAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ GroupAssignmentComponent ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();
    fixture = TestBed.createComponent(GroupAssignmentComponent);
    component = fixture.componentInstance;
    component.group = {
      description: "description",
      name: "name",
      email: "email"
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
