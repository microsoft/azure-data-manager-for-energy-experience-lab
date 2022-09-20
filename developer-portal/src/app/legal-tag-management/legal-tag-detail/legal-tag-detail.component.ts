// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessStatus } from 'src/app/user-management/models/user-management-status.enum';
import { LegalTag } from '../models/legal-tag';
import { LegalTagManagementService } from '../services/legal-tag-management.service';

@Component({
  selector: 'app-legal-tag-detail',
  templateUrl: './legal-tag-detail.component.html',
  styleUrls: ['./legal-tag-detail.component.css']
})
export class LegalTagDetailComponent implements OnInit {
  public selectedLegalTagName: string;
  public legalTag: LegalTag;
  public tagLoadingStatus: ProcessStatus;
  public tagSavingStatus: ProcessStatus;
  public eProcessStatus = ProcessStatus;
  public editForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private legalTagService: LegalTagManagementService,
    private router: Router
  ) {}

  ngOnInit() {
    this.selectedLegalTagName = this.route.snapshot.paramMap.get('id');
    this.tagLoadingStatus = ProcessStatus.InProgress;
    this.legalTagService.getLegalTag(this.selectedLegalTagName).subscribe({
      error: (_) => {
        this.tagLoadingStatus = ProcessStatus.Failed;
      },
      next: (legalTag) => {
        this.legalTag = legalTag;
        this.editForm = new FormGroup({
          name: new FormControl({ value: this.legalTag.name, disabled: true }, [Validators.required]),
          description: new FormControl(this.legalTag.description, [Validators.required]),
          properties: new FormGroup({
            countryOfOrigin: new FormControl({ value: this.legalTag.properties.countryOfOrigin.toString(), disabled: true }, [Validators.required]),
            contractId: new FormControl(this.legalTag.properties.contractId, [Validators.required]),
            dataType: new FormControl({ value: this.legalTag.properties.dataType, disabled: true }, [Validators.required]),
            expirationDate: new FormControl(this.legalTag.properties.expirationDate, [Validators.required]),
            exportClassification: new FormControl({ value: this.legalTag.properties.exportClassification, disabled: true }, [Validators.required]),
            originator: new FormControl({ value: this.legalTag.properties.originator, disabled: true }, [Validators.required]),
            personalData: new FormControl({ value: this.legalTag.properties.personalData, disabled: true }, [Validators.required]),
            securityClassification: new FormControl({ value: this.legalTag.properties.securityClassification, disabled: true }, [Validators.required])
          })
        });
        this.tagLoadingStatus = ProcessStatus.Succeeded;
      }
    });
  }

  public getCountriesOfOrigin(): string {
    return this.legalTag.properties.countryOfOrigin.toString();
  }

  public userCanEditLegalTags(): boolean {
    return true;
  }

  public saveLegalTag(): void {
    this.tagSavingStatus = ProcessStatus.InProgress;
    var formInput = this.editForm.value;
    var legalTagUpdates = {
      name: this.legalTag.name,
      contractId: formInput.properties.contractId,
      description: formInput.description,
      expirationDate: formInput.properties.expirationDate
    };

    this.legalTagService.saveLegalTag(legalTagUpdates).subscribe({
      error: (errorResponse) => {
        this.tagSavingStatus = ProcessStatus.Failed;
      },
      next: (legalTagResponse: LegalTag) => {
        this.tagSavingStatus = ProcessStatus.Succeeded;
        this.router.navigate(['/legal']);
      }
    });
  }
}
