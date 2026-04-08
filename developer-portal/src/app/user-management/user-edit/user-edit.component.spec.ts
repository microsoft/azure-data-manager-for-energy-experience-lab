// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UserEditComponent } from './user-edit.component';

describe('UserEditComponent', () => {
  let component: UserEditComponent;
  let fixture: ComponentFixture<UserEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserEditComponent ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserEditComponent);
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
