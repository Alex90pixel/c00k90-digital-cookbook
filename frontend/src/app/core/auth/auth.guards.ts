import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Pages for signed-in users; everyone else goes to the login page. */
export const authGuard: CanActivateFn = async () => {
  // inject() only works before the first `await`.
  const [auth, router] = [inject(AuthService), inject(Router)];
  return (await auth.whenReady()) ? true : router.parseUrl('/login');
};

/** The login page; signed-in users go straight to their cookbook. */
export const guestGuard: CanActivateFn = async () => {
  const [auth, router] = [inject(AuthService), inject(Router)];
  return (await auth.whenReady()) ? router.parseUrl('/') : true;
};
