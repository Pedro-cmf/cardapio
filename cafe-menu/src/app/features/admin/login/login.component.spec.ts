import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

describe('LoginComponent - BDD Tests', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // GIVEN: Mock dependencies
    mockAuthService = jasmine.createSpyObj('AuthService', ['signIn']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('FEATURE: Login Form', () => {
    describe('SCENARIO: Form validation', () => {
      it('GIVEN empty form WHEN checking validity THEN form should be invalid', () => {
        // GIVEN / WHEN
        const form = component.form;

        // THEN
        expect(form.valid).toBe(false);
        expect(form.get('email')?.errors?.['required']).toBe(true);
        expect(form.get('password')?.errors?.['required']).toBe(true);
      });

      it('GIVEN invalid email WHEN checking validity THEN email field should be invalid', () => {
        // GIVEN
        component.form.patchValue({
          email: 'invalid-email',
          password: 'senha123'
        });

        // WHEN
        const emailControl = component.form.get('email');

        // THEN
        expect(emailControl?.errors?.['email']).toBe(true);
      });

      it('GIVEN short password WHEN checking validity THEN password field should be invalid', () => {
        // GIVEN
        component.form.patchValue({
          email: 'admin@cafe.com',
          password: '123'
        });

        // WHEN
        const passwordControl = component.form.get('password');

        // THEN
        expect(passwordControl?.errors?.['minlength']).toBeTruthy();
      });

      it('GIVEN valid credentials WHEN checking validity THEN form should be valid', () => {
        // GIVEN
        component.form.patchValue({
          email: 'admin@cafe.com',
          password: 'senha123'
        });

        // WHEN / THEN
        expect(component.form.valid).toBe(true);
      });
    });

    describe('SCENARIO: Successful login', () => {
      it('GIVEN valid form WHEN submitting THEN should call auth service and clear error', async () => {
        // GIVEN
        component.form.patchValue({
          email: 'admin@cafe.com',
          password: 'senha123'
        });
        mockAuthService.signIn.and.returnValue(Promise.resolve());

        // WHEN
        await component.onSubmit();

        // THEN
        expect(mockAuthService.signIn).toHaveBeenCalledWith('admin@cafe.com', 'senha123');
        expect(component.errorMsg()).toBe('');
      });

      it('GIVEN login in progress WHEN checking loading state THEN should show loading', async () => {
        // GIVEN
        component.form.patchValue({
          email: 'admin@cafe.com',
          password: 'senha123'
        });
        mockAuthService.signIn.and.returnValue(new Promise(resolve => setTimeout(resolve, 100)));

        // WHEN
        const submitPromise = component.onSubmit();
        expect(component.loading()).toBe(true);

        // THEN
        await submitPromise;
        expect(component.loading()).toBe(false);
      });
    });

    describe('SCENARIO: Failed login', () => {
      it('GIVEN invalid credentials WHEN submitting THEN should show error message', async () => {
        // GIVEN
        component.form.patchValue({
          email: 'wrong@email.com',
          password: 'wrongpass'
        });
        const errorMessage = 'Invalid login credentials';
        mockAuthService.signIn.and.returnValue(Promise.reject({ message: errorMessage }));

        // WHEN
        await component.onSubmit();

        // THEN
        expect(component.errorMsg()).toBe(errorMessage);
        expect(component.loading()).toBe(false);
      });

      it('GIVEN network error WHEN submitting THEN should show generic error', async () => {
        // GIVEN
        component.form.patchValue({
          email: 'admin@cafe.com',
          password: 'senha123'
        });
        mockAuthService.signIn.and.returnValue(Promise.reject({}));

        // WHEN
        await component.onSubmit();

        // THEN
        expect(component.errorMsg()).toBe('Erro ao fazer login');
      });
    });

    describe('SCENARIO: Form submission prevention', () => {
      it('GIVEN invalid form WHEN submitting THEN should not call auth service', async () => {
        // GIVEN
        component.form.patchValue({
          email: '',
          password: ''
        });

        // WHEN
        await component.onSubmit();

        // THEN
        expect(mockAuthService.signIn).not.toHaveBeenCalled();
      });
    });
  });
});
