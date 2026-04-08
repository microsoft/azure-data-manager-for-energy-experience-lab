// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { OverlayModule } from "@angular/cdk/overlay";

import { UserOverviewComponent } from './user-overview.component';

describe('UserOverviewComponent', () => {
  let component: UserOverviewComponent;
  let fixture: ComponentFixture<UserOverviewComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserOverviewComponent ],
      imports: [
        OverlayModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents().then(() => {
      fixture = TestBed.createComponent(UserOverviewComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
