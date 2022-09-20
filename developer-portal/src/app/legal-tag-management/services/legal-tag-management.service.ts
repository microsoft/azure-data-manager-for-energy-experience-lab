// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LegalTag, LegalTagUpdateRequest } from '../models/legal-tag';

@Injectable({
  providedIn: 'root'
})
export class LegalTagManagementService {

  constructor(private http: HttpClient) { }

  /**
   * Gets a legal tag
   * @param name The legal tag name
   * @returns The legal tag
   */
  public getLegalTag(name: string): Observable<LegalTag> {
    let headers = this.getHeaders();

    return this.http.get(`https://${environment.apiHost}/api/legal/v1/legaltags/${name}`, {headers: headers})
      .pipe(map((response: LegalTag) => {
        return response;
    }));
  }

  /**
   * Adds a legal tag
   * @param legalTag The legal tag to add
   * @returns The legal tag added
   */
  public addLegalTag(legalTag: LegalTag): Observable<Object> {
    let headers = this.getHeaders();
    return this.http.post(`https://${environment.apiHost}/api/legal/v1/legaltags`, legalTag, {headers: headers});
  }

  /**
   * Deletes a legal tag by name
   * @param tagNameToDelete The name of the tag to delete
   * @returns Nothing
   */
  public deleteLegalTag(tagNameToDelete: string): Observable<Object> {
    let headers = this.getHeaders();
    return this.http.delete(`https://${environment.apiHost}/api/legal/v1/legaltags/${tagNameToDelete}`, {headers: headers});
  }

  /**
   * Gets all legal tags
   * @returns The legal tags
   */
  public getLegalTags(): Observable<LegalTag[]> {
    let headers = this.getHeaders();

    return this.http.get(`https://${environment.apiHost}/api/legal/v1/legaltags`, {headers: headers})
      .pipe(map((response: any) => {
        var legalTags: LegalTag[] = []
        response.legalTags.forEach(legalTagResponse => {
          legalTags.push(this.mapLegalTagFromDto(legalTagResponse));
        });
        return legalTags;
    }));
  }

  /**
   * Updates a legal tag by name
   * @param legalTagUpdates The updates to make to a legal tag
   * @returns The updated legal tag
   */
  public saveLegalTag(legalTagUpdates: LegalTagUpdateRequest): Observable<Object> {
    let headers = this.getHeaders();
    return this.http.put(`https://${environment.apiHost}/api/legal/v1/legaltags`, legalTagUpdates, {headers: headers});
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('data-partition-id', environment.dataPartition);

    return headers;
  }

  private mapLegalTagFromDto(legalTagResponse: any): LegalTag {
    var legalTag: LegalTag = {
      name: legalTagResponse.name,
      description: legalTagResponse.description,
      properties: {
        contractId: legalTagResponse.properties.contractId,
        originator: legalTagResponse.properties.originator,
        dataType: legalTagResponse.properties.dataType,
        securityClassification: legalTagResponse.properties.securityClassification,
        personalData: legalTagResponse.properties.personalData,
        exportClassification: legalTagResponse.properties.exportClassification,
        countryOfOrigin: legalTagResponse.properties.countryOfOrigin,
        expirationDate: legalTagResponse.properties.expirationDate
      }
    };

    return legalTag;
  }
}
