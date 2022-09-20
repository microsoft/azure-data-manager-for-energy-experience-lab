// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-data-load',
  templateUrl: './data-load.component.html'
})
export class DataLoadComponent {
  public tnoTemplateSpecUrl: string = environment.tnoTemplateSpecUrl;
  constructor() { }
}
