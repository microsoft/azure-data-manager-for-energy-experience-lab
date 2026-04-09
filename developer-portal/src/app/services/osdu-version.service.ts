// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OsduVersionService {

  constructor(private http: HttpClient) { }

  public getOsduVersion(): Observable<string> {
    return this.http.get(`https://${environment.apiHost}/api/entitlements/v2/info`)
      .pipe(map((versionResponse: any) => {
        const minorVersion = parseInt(versionResponse.version.split('.')[1], 10);
        if (isNaN(minorVersion) || minorVersion < 9) {
          return "Unknown";
        }
        return "M" + (minorVersion - 3);
    }));
  }
}
