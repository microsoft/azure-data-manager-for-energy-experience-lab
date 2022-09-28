// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileService } from '../services/profile.service';

import { RestComponent } from './rest.component';

describe('RestComponent', () => {
  let component: RestComponent;
  let fixture: ComponentFixture<RestComponent>;

  const profileServiceStub: Partial<ProfileService> = {
    getRefreshToken(): string {
      return "token";
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestComponent ],
      providers: [
        { provide: ProfileService, useValue: profileServiceStub }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
