import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table'
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';

import { OverlayModule } from "@angular/cdk/overlay";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

import { MsalModule, MsalRedirectComponent, MsalGuard, MsalInterceptor } from '@azure/msal-angular'; // Import MsalInterceptor
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { environment } from 'src/environments/environment';
import { RestComponent } from './rest/rest.component';
import { SwaggerComponent } from './swagger/swagger.component';
import { UserEditComponent } from './user-management/user-edit/user-edit.component';
import { UserOverviewComponent } from './user-management/user-overview/user-overview.component';
import { UserCreationComponent } from './user-management/user-creation/user-creation.component';
import { UserDeleteComponent } from './user-management/user-delete/user-delete.component';
import { UserOverviewRowComponent } from './user-management/user-overview-row/user-overview-row.component';
import { LegalTagOverviewComponent } from './legal-tag-management/legal-tag-overview/legal-tag-overview.component';
import { UnauthorizedComponent } from './authorization/components/unauthorized/unauthorized.component';
import { PowerBiComponent } from './power-bi/power-bi.component';
import { GroupOverviewRowComponent } from './user-management/group-overview-row/group-overview-row.component';
import { GroupAssignmentComponent } from './user-management/group-assignment/group-assignment.component';
import { DataLoadComponent } from './data-load/data-load.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LegalTagFormComponent } from './legal-tag-management/legal-tag-form/legal-tag-form.component';
import { LegalTagDetailComponent } from './legal-tag-management/legal-tag-detail/legal-tag-detail.component';
import { LegalTagCreateComponent } from './legal-tag-management/legal-tag-create/legal-tag-create.component';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProfileComponent,
    RestComponent,
    SwaggerComponent,
    UserEditComponent,
    UserOverviewComponent,
    UserCreationComponent,
    UserDeleteComponent,
    UserOverviewRowComponent,
    LegalTagOverviewComponent,
    UnauthorizedComponent,
    PowerBiComponent,
    GroupOverviewRowComponent,
    GroupAssignmentComponent,
    DataLoadComponent,
    LegalTagFormComponent,
    LegalTagDetailComponent,
    LegalTagCreateComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatExpansionModule,
    MatTooltipModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatSidenavModule,
    MatIconModule,
    MatDividerModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    OverlayModule,
    MsalModule.forRoot(new PublicClientApplication({
      auth: {
        clientId: environment.clientId,
        authority: `https://login.microsoftonline.com/${environment.tenantId}`,
        redirectUri: environment.redirectUrl,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: isIE,
      }
    }), {
      interactionType: InteractionType.Redirect,
      }, {
      interactionType: InteractionType.Redirect,
      protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me', ['user.read']],
          ['*', [`${environment.clientId}/${environment.scopes}`]]
      ])
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalGuard
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
