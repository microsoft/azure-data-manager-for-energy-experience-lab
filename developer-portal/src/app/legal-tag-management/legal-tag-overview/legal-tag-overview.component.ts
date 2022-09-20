// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, OnInit } from '@angular/core';
import { LegalTag } from '../models/legal-tag';
import { LegalTagManagementService } from '../services/legal-tag-management.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatTableDataSource } from '@angular/material/table';
import { ProcessStatus } from 'src/app/user-management/models/user-management-status.enum';

@Component({
  selector: 'app-legal-tag-overview',
  templateUrl: './legal-tag-overview.component.html',
  styleUrls: ['./legal-tag-overview.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class LegalTagOverviewComponent implements OnInit {
  public legalTags: LegalTag[] = [];
  public tagLoadingStatus: ProcessStatus;
  public tagDeletingStatus: ProcessStatus;
  public eProcessStatus = ProcessStatus;
  public legalTagsDataSource: MatTableDataSource<any>;
  columnsToDisplay = ['name', 'description'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: LegalTag | null;

  constructor(private legalTagManagementService: LegalTagManagementService) { }

  ngOnInit(): void {
    this.legalTagsDataSource = new MatTableDataSource();
    this.loadLegalTags();
  }

  public isLoadingLegalTags(): Boolean {
    const areLegalTagsSet = Array.isArray(this.legalTags) && !this.legalTags.length;
    return this.tagLoadingStatus == ProcessStatus.InProgress && areLegalTagsSet;
  }

  public applyFilter(filterValue: string) {
    this.legalTagsDataSource.filter = filterValue.trim().toLowerCase();
    if (this.legalTagsDataSource.paginator) {
      this.legalTagsDataSource.paginator.firstPage();
    }
  }

  public deleteLegalTag(legalTagName: string) {
    this.tagDeletingStatus = ProcessStatus.InProgress;
    this.legalTagManagementService.deleteLegalTag(legalTagName).subscribe({
      error: (_) => {
        this.tagDeletingStatus = ProcessStatus.Failed;
      },
      next: (_) => {
        this.legalTags = this.legalTags.filter(tag => tag.name !== legalTagName);
        this.legalTagsDataSource.data = this.legalTags;
        this.tagDeletingStatus = ProcessStatus.Succeeded;
      }
    });
  }

  private loadLegalTags() {
    this.tagLoadingStatus = ProcessStatus.InProgress;
    this.legalTagManagementService.getLegalTags().subscribe({
      error: (_) => {
        this.tagLoadingStatus = ProcessStatus.Failed;
        this.legalTags = []
      },
      next: (legalTags) => {
        this.legalTagsDataSource.data = legalTags;
        this.legalTags = legalTags;
        this.tagLoadingStatus = ProcessStatus.Succeeded;
      }
    });
  }
}
