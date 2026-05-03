---
mode: agent
description: Implements authentication with Supabase Auth (JWT), AuthService, AuthGuard and Login component
---

# 🔐 Agent: Authentication

## Responsabilidade
Implementar toda a camada de autenticação: JWT via Supabase Auth, guard de rotas e tela de login.

## Pré-requisitos
- `01-supabase-database.prompt.md` concluído
- `SupabaseService` disponível em `core/services/supabase.service.ts`

---

## 1. AuthService

Crie `src/app/core/services/auth.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;
  
  currentUser = signal<User | null>(null);
  session = signal<Session | null>(null);
  loading = signal<boolean>(true);

  constructor(private router: Router) {
    // Restaurar sessão ao inicializar
    this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      this.currentUser.set(data.session?.user ?? null);
      this.loading.set(false);
    });

    // Ouvir mudanças de auth
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  get isAuthenticated(): boolean {
    return !!this.session();
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.router.navigate(['/admin/dashboard']);
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    return this.session()?.access_token ?? null;
  }
}
```

> **Nota**: Usar `inject()` no body da classe com Angular 17 standalone requer importar de `@angular/core`.

---

## 2. AuthGuard

Crie `src/app/core/guards/auth.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};
```

---

## 3. Login Component

Crie `src/app/features/admin/login/login.component.ts`:

```typescript
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
```

Crie `src/app/features/admin/login/login.component.html`:

```html
<div class="login-container">
  <div class="login-card">
    <div class="login-logo">
      <span class="logo-icon">☕</span>
      <h1>Painel Admin</h1>
      <p>Acesse para gerenciar o cardápio</p>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
      <div class="field-group">
        <label for="email">E-mail</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          placeholder="seu@email.com"
          autocomplete="email"
        />
        <span class="field-error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
          E-mail inválido
        </span>
      </div>

      <div class="field-group">
        <label for="password">Senha</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          placeholder="••••••••"
          autocomplete="current-password"
        />
        <span class="field-error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
          Senha muito curta
        </span>
      </div>

      <div class="error-banner" *ngIf="errorMsg()">
        {{ errorMsg() }}
      </div>

      <button type="submit" class="btn-primary" [disabled]="loading() || form.invalid">
        {{ loading() ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
</div>
```

Crie `src/app/features/admin/login/login.component.scss`:

```scss
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
}

.login-card {
  background: var(--color-secondary);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.login-logo {
  text-align: center;
  margin-bottom: 2rem;

  .logo-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
  h1 { color: var(--color-primary); font-size: 1.5rem; margin: 0; }
  p  { color: #666; font-size: 0.875rem; margin-top: 0.25rem; }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  label { font-size: 0.875rem; font-weight: 600; color: var(--color-primary); }

  input {
    padding: 0.75rem 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: var(--color-accent);
    }
  }
}

.field-error {
  font-size: 0.75rem;
  color: #e53e3e;
}

.error-banner {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #c53030;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--color-primary);
  border: none;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;

  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
```

---

## 4. Criar usuário admin no Supabase

No painel do Supabase → Authentication → Users → "Invite User":
- Informe o e-mail do dono da cafeteria
- Ou use o SQL: `select auth.create_user(email := 'admin@cafe.com', password := 'suaSenhaForte');`

---

## Critério de Conclusão
- Login redireciona para `/admin/dashboard` com JWT ativo
- Rota `/admin/**` bloqueada sem sessão (redireciona para `/admin/login`)
- Sessão persiste após refresh da página
- Logout limpa sessão e redireciona
