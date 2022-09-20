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
        const endVersionIndex = 4;
        const apiVersion = <string> versionResponse.version.substring(0,endVersionIndex);
        let osduVersion = "";
        switch(apiVersion) {
          case "0.09":
            osduVersion = "M6";
            break;
          case "0.10":
            osduVersion = "M7";
            break;
          case "0.11":
            osduVersion = "M8";
            break;
          case "0.12":
            osduVersion = "M9";
            break;
          case "0.13":
            osduVersion = "M10";
            break;
          case "0.14":
            osduVersion = "M11";
            break;
          case "0.15":
            osduVersion = "M12";
            break;
          case "0.16":
            osduVersion = "M13";
            break;
          case "0.17":
            osduVersion = "M14";
            break;
          default:
            osduVersion = "Unknown";
        }

        return osduVersion;
    }));
  }
}
