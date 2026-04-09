// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OverlayModule } from "@angular/cdk/overlay";
import { MatSelectModule } from '@angular/material/select';
import { MatSelectionList } from '@angular/material/list';

import { GroupOverviewRowComponent } from './group-overview-row.component';

describe('GroupOverviewRowComponent', () => {
  let component: GroupOverviewRowComponent;
  let fixture: ComponentFixture<GroupOverviewRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        MatSelectModule,
        MatSelectionList,
        OverlayModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ],
      declarations: [
        GroupOverviewRowComponent
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(GroupOverviewRowComponent);
    component = fixture.componentInstance;
    component.dataGroup = {
      name: "test",
      email: "test",
      members: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
