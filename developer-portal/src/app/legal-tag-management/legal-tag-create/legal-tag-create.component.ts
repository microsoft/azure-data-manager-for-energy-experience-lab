// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProcessStatus } from 'src/app/user-management/models/user-management-status.enum';
import { LegalTagManagementService } from '../services/legal-tag-management.service';

@Component({
  selector: 'app-legal-tag-create',
  templateUrl: './legal-tag-create.component.html',
  styleUrls: ['./legal-tag-create.component.css']
})
export class LegalTagCreateComponent {

  public creationForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    properties: new FormGroup({
      countryOfOrigin: new FormControl('', [Validators.required]),
      contractId: new FormControl('', [Validators.required]),
      dataType: new FormControl('', [Validators.required]),
      expirationDate: new FormControl('', [Validators.required]),
      exportClassification: new FormControl('', [Validators.required]),
      originator: new FormControl('', [Validators.required]),
      personalData: new FormControl('', [Validators.required]),
      securityClassification: new FormControl('', [Validators.required]),
    })
  });
  public tagCreationStatus: ProcessStatus;
  public eProcessStatus = ProcessStatus;
  public errorMessage: string;

  constructor(private legalTagService: LegalTagManagementService, private router: Router) { }

  public createLegalTag() {
    this.tagCreationStatus = ProcessStatus.InProgress;
    var legalTag = this.creationForm.value;
    legalTag.properties.countryOfOrigin = [legalTag.properties.countryOfOrigin];

    this.legalTagService.addLegalTag(legalTag).subscribe({
      error: (errorResponse) => {
        this.tagCreationStatus = ProcessStatus.Failed;
      },
      complete: () => {
        this.tagCreationStatus = ProcessStatus.Succeeded;
        this.router.navigate(['/legal']);
      }
    });
  }
}
