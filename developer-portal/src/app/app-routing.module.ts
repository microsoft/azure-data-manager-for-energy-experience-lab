// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { MsalGuard } from '@azure/msal-angular';
import { RestComponent } from './rest/rest.component';
import { SwaggerComponent } from './swagger/swagger.component';
import { UserOverviewComponent } from './user-management/user-overview/user-overview.component';
import { LegalTagOverviewComponent } from './legal-tag-management/legal-tag-overview/legal-tag-overview.component';
import { UserGuard } from './authorization/guards/user.guard';
import { UnauthorizedComponent } from './authorization/components/unauthorized/unauthorized.component';
import { PowerBiComponent } from './power-bi/power-bi.component';
import { DataLoadComponent } from './data-load/data-load.component';
import { LegalTagDetailComponent } from './legal-tag-management/legal-tag-detail/legal-tag-detail.component';
import { LegalTagCreateComponent } from './legal-tag-management/legal-tag-create/legal-tag-create.component';

const routes: Routes = [

  {
    path: '',
    component: HomeComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'rest',
    component: RestComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'swagger',
    component: SwaggerComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'users',
    component: UserOverviewComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'legal',
    component: LegalTagOverviewComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'legal/new',
    component: LegalTagCreateComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'legal/:id',
    component: LegalTagDetailComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'powerbi',
    component: PowerBiComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'dataload',
    component: DataLoadComponent,
    canActivate: [MsalGuard, UserGuard]
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    redirectTo: '',
    canActivate: [MsalGuard, UserGuard]
  },
];

const isIframe = window !== window.parent && !window.opener;

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: !isIframe ? 'enabled' : 'disabled' // Don't perform initial navigation in iframes
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
