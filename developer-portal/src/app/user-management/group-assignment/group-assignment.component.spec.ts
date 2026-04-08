// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GroupAssignmentComponent } from './group-assignment.component';

describe('GroupAssignmentComponent', () => {
  let component: GroupAssignmentComponent;
  let fixture: ComponentFixture<GroupAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
