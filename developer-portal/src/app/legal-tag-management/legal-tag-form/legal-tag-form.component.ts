// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-legal-tag-form',
  templateUrl: './legal-tag-form.component.html',
  styleUrls: ['./legal-tag-form.component.css']
})
export class LegalTagFormComponent {

  @Input() form: FormGroup;

  constructor() { }
}
