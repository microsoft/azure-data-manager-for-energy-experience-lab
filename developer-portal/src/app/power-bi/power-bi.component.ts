// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-power-bi',
  templateUrl: './power-bi.component.html'
})
export class PowerBiComponent {
  public powerBiConnectorFileName = environment.powerBiConnectorFileName;
  constructor() { }

}
