import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {}

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMsg.set('');

    try {
      const { email, password } = this.form.value;
      await this.auth.signIn(email!, password!);
    } catch (err: any) {
      this.errorMsg.set(err.message ?? 'Erro ao fazer login');
    } finally {
      this.loading.set(false);
    }
  }
}
