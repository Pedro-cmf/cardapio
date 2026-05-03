import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/**
 * Authentication Service
 *
 * Manages user authentication state and session
 *
 * Features:
 * - Automatic session restoration on app load
 * - Real-time auth state synchronization
 * - Proper error handling
 * - Token management
 *
 * Usage:
 * ```typescript
 * constructor(private auth: AuthService) {}
 *
 * async login() {
 *   try {
 *     await this.auth.signIn(email, password);
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;

  currentUser = signal<User | null>(null);
  session = signal<Session | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private router: Router) {
    this.initializeSession();
  }

  /**
   * Initialize session on app load
   * Restores session from Supabase storage
   */
  private async initializeSession(): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Session initialization error:', error);
        this.error.set(error.message);
      } else {
        this.session.set(data.session);
        this.currentUser.set(data.session?.user ?? null);
      }
    } catch (err) {
      console.error('Failed to initialize session:', err);
      this.error.set('Failed to initialize authentication');
    } finally {
      this.loading.set(false);
    }

    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);
    });
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.session();
  }

  /**
   * Sign in with email and password
   *
   * @param email - User email
   * @param password - User password
   * @throws AuthError if login fails
   */
  async signIn(email: string, password: string): Promise<void> {
    this.error.set(null);

    try {
      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.error.set(error.message);
        throw error;
      }

      this.router.navigate(['/admin']);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      this.error.set(errorMessage);
      throw err;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    this.error.set(null);

    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        this.error.set(error.message);
      }

      this.router.navigate(['/admin/login']);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      this.error.set(errorMessage);
      console.error('Failed to sign out:', err);
    }
  }

  /**
   * Get current access token
   *
   * @returns Access token or null if not authenticated
   */
  getToken(): string | null {
    return this.session()?.access_token ?? null;
  }

  /**
   * Refresh the current session
   *
   * @returns Updated session or null
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error('Session refresh error:', error);
        this.error.set(error.message);
        return null;
      }

      this.session.set(data.session);
      this.currentUser.set(data.session?.user ?? null);
      return data.session;
    } catch (err) {
      console.error('Failed to refresh session:', err);
      return null;
    }
  }

  /**
   * Clear any auth errors
   */
  clearError(): void {
    this.error.set(null);
  }
}
