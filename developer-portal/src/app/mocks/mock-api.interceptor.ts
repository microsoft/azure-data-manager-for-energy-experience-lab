// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_GROUPS, MOCK_USERS, MOCK_LEGAL_TAGS, MOCK_VERSION_INFO } from './mock-data';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {

  private legalTags = [...MOCK_LEGAL_TAGS];
  private users = [...MOCK_USERS];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url;
    const method = req.method;

    // Entitlements: version info
    if (url.includes('/api/entitlements/v2/info')) {
      return of(new HttpResponse({ status: 200, body: MOCK_VERSION_INFO }));
    }

    // Entitlements: group members by group email
    const groupMembersMatch = url.match(/\/api\/entitlements\/v2\/groups\/([^/]+)\/members/);
    if (groupMembersMatch) {
      if (method === 'GET') {
        return of(new HttpResponse({ status: 200, body: { members: this.users } }));
      }
      if (method === 'POST') {
        const newMember = { dataPartitionId: 'opendes', email: req.body.email, memberType: 'USER', role: req.body.role || 'MEMBER' };
        this.users.push(newMember);
        return of(new HttpResponse({ status: 200, body: newMember }));
      }
      if (method === 'DELETE') {
        const memberId = url.split('/').pop();
        this.users = this.users.filter(u => u.email !== memberId);
        return of(new HttpResponse({ status: 204 }));
      }
    }

    // Entitlements: member groups
    const memberGroupsMatch = url.match(/\/api\/entitlements\/v2\/members\/([^/]+)\/groups/);
    if (memberGroupsMatch) {
      return of(new HttpResponse({ status: 200, body: { groups: MOCK_GROUPS.filter(g => g.name !== 'data.default' && g.name !== 'data.welldb') } }));
    }

    // Entitlements: delete member
    const deleteMemberMatch = url.match(/\/api\/entitlements\/v2\/members\/([^/]+)$/);
    if (deleteMemberMatch && method === 'DELETE') {
      const memberId = deleteMemberMatch[1];
      this.users = this.users.filter(u => u.email !== memberId);
      return of(new HttpResponse({ status: 204 }));
    }

    // Entitlements: list groups
    if (url.includes('/api/entitlements/v2/groups') && method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { groups: MOCK_GROUPS } }));
    }

    // Legal: single tag by name
    const legalTagMatch = url.match(/\/api\/legal\/v1\/legaltags\/(.+)$/);
    if (legalTagMatch && !url.includes('?')) {
      const tagName = decodeURIComponent(legalTagMatch[1]);
      if (method === 'GET') {
        const tag = this.legalTags.find(t => t.name === tagName);
        return tag
          ? of(new HttpResponse({ status: 200, body: tag }))
          : of(new HttpResponse({ status: 404, body: { error: 'Not found' } }));
      }
      if (method === 'DELETE') {
        this.legalTags = this.legalTags.filter(t => t.name !== tagName);
        return of(new HttpResponse({ status: 204 }));
      }
    }

    // Legal: list/create/update tags
    if (url.includes('/api/legal/v1/legaltags')) {
      if (method === 'GET') {
        return of(new HttpResponse({ status: 200, body: { legalTags: this.legalTags } }));
      }
      if (method === 'POST') {
        this.legalTags.push(req.body);
        return of(new HttpResponse({ status: 201, body: req.body }));
      }
      if (method === 'PUT') {
        const idx = this.legalTags.findIndex(t => t.name === req.body.name);
        if (idx >= 0) {
          this.legalTags[idx] = { ...this.legalTags[idx], ...req.body };
        }
        return of(new HttpResponse({ status: 200, body: this.legalTags[idx] || req.body }));
      }
    }

    // Pass through any unmatched requests
    return next.handle(req);
  }
}
