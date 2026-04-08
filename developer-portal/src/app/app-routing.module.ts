// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { RestComponent } from './rest/rest.component';
import { SwaggerComponent } from './swagger/swagger.component';
import { UserOverviewComponent } from './user-management/user-overview/user-overview.component';
import { LegalTagOverviewComponent } from './legal-tag-management/legal-tag-overview/legal-tag-overview.component';
import { UnauthorizedComponent } from './authorization/components/unauthorized/unauthorized.component';
import { PowerBiComponent } from './power-bi/power-bi.component';
import { DataLoadComponent } from './data-load/data-load.component';
import { LegalTagDetailComponent } from './legal-tag-management/legal-tag-detail/legal-tag-detail.component';
import { LegalTagCreateComponent } from './legal-tag-management/legal-tag-create/legal-tag-create.component';
import { authGuards } from './authorization/guards/auth.guards';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: authGuards,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: authGuards,
  },
  {
    path: 'rest',
    component: RestComponent,
    canActivate: authGuards,
  },
  {
    path: 'swagger',
    component: SwaggerComponent,
    canActivate: authGuards,
  },
  {
    path: 'users',
    component: UserOverviewComponent,
    canActivate: authGuards,
  },
  {
    path: 'legal',
    component: LegalTagOverviewComponent,
    canActivate: authGuards,
  },
  {
    path: 'legal/new',
    component: LegalTagCreateComponent,
    canActivate: authGuards,
  },
  {
    path: 'legal/:id',
    component: LegalTagDetailComponent,
    canActivate: authGuards,
  },
  {
    path: 'powerbi',
    component: PowerBiComponent,
    canActivate: authGuards,
  },
  {
    path: 'dataload',
    component: DataLoadComponent,
    canActivate: authGuards,
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    redirectTo: '',
  },
];

const isIframe = window !== window.parent && !window.opener;

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: !isIframe ? 'enabledBlocking' : 'disabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
