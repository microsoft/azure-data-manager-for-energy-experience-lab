// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { map, switchMap } from 'rxjs';
import { UserGroup } from 'src/app/models/user-group.enum';
import { ProfileService } from 'src/app/services/profile.service';
import { AuthorizationService } from '../services/authorization.service';
import { environment } from 'src/environments/environment';

export const userGuard: CanActivateFn = () => {
  const router = inject(Router);
  const profileService = inject(ProfileService);
  const authorizationService = inject(AuthorizationService);

  return profileService.getUserProfile().pipe(
    switchMap(() =>
      authorizationService.IsUserInGroup(UserGroup.Users).pipe(
        map(result => result ? true : router.parseUrl('/unauthorized'))
      )
    )
  );
};

export const authGuards: any[] = environment.useMocks
  ? [userGuard]
  : [MsalGuard, userGuard];
