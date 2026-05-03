import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, filter, take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Authentication Guard
 *
 * Protects routes from unauthorized access
 * Waits for session loading to complete before checking authentication
 *
 * Features:
 * - No race conditions (uses RxJS instead of polling)
 * - Timeout protection (10 seconds max wait)
 * - Proper error handling
 *
 * @returns true if authenticated, UrlTree to login if not
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Convert loading signal to observable and wait for it to become false
  return toObservable(auth.loading).pipe(
    // Wait for loading to finish
    filter(loading => !loading),
    // Take only the first emission (when loading becomes false)
    take(1),
    // Add timeout protection (10 seconds)
    timeout(10000),
    // Map to authentication result
    map(() => {
      if (auth.isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/admin/login']);
    }),
    // Handle timeout or other errors
    catchError((error) => {
      console.error('Auth guard error:', error);
      // On error, redirect to login for safety
      return of(router.createUrlTree(['/admin/login']));
    })
  );
};
