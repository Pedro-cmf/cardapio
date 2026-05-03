import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

describe('AuthService - BDD Tests', () => {
  let service: AuthService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabase: any;

  beforeEach(() => {
    // GIVEN: Mock dependencies
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockSupabase = {
      client: {
        auth: {
          getSession: jasmine.createSpy('getSession').and.returnValue(
            Promise.resolve({ data: { session: null } })
          ),
          onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
            data: { subscription: { unsubscribe: () => {} } }
          }),
          signInWithPassword: jasmine.createSpy('signInWithPassword'),
          signOut: jasmine.createSpy('signOut')
        }
      }
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: SupabaseService, useValue: mockSupabase }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  describe('FEATURE: User Authentication', () => {
    describe('SCENARIO: Successful login', () => {
      it('GIVEN valid credentials WHEN user signs in THEN should redirect to dashboard', async () => {
        // GIVEN
        const email = 'admin@cafe.com';
        const password = 'senha123';
        mockSupabase.client.auth.signInWithPassword.and.returnValue(
          Promise.resolve({ data: { user: { id: '123' } }, error: null })
        );

        // WHEN
        await service.signIn(email, password);

        // THEN
        expect(mockSupabase.client.auth.signInWithPassword).toHaveBeenCalledWith({
          email,
          password
        });
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
      });
    });

    describe('SCENARIO: Invalid credentials', () => {
      it('GIVEN invalid credentials WHEN user signs in THEN should throw error', async () => {
        // GIVEN
        const email = 'wrong@email.com';
        const password = 'wrongpass';
        const authError = new Error('Invalid credentials');
        mockSupabase.client.auth.signInWithPassword.and.returnValue(
          Promise.resolve({ data: null, error: authError })
        );

        // WHEN / THEN
        await expectAsync(service.signIn(email, password)).toBeRejected();
      });
    });

    describe('SCENARIO: User logout', () => {
      it('GIVEN authenticated user WHEN user signs out THEN should clear session and redirect to login', async () => {
        // GIVEN
        mockSupabase.client.auth.signOut.and.returnValue(Promise.resolve({ error: null }));

        // WHEN
        await service.signOut();

        // THEN
        expect(mockSupabase.client.auth.signOut).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/login']);
      });
    });
  });

  describe('FEATURE: Authentication State', () => {
    describe('SCENARIO: Check if user is authenticated', () => {
      it('GIVEN no active session WHEN checking authentication THEN should return false', () => {
        // GIVEN
        service.session.set(null);

        // WHEN
        const isAuth = service.isAuthenticated;

        // THEN
        expect(isAuth).toBe(false);
      });

      it('GIVEN active session WHEN checking authentication THEN should return true', () => {
        // GIVEN
        service.session.set({ access_token: 'token123' } as any);

        // WHEN
        const isAuth = service.isAuthenticated;

        // THEN
        expect(isAuth).toBe(true);
      });
    });
  });
});
