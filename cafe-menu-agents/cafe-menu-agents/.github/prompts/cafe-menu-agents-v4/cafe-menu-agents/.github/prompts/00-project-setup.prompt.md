---
mode: agent
description: Bootstraps the cafe-menu Angular project with all dependencies and base structure
---

# 🏗️ Agent: Project Setup

## Responsabilidade
Criar o projeto Angular do zero com todas as dependências e estrutura de pastas.

## Contexto do Projeto
- Cardápio digital para cafeterias com painel admin protegido por JWT
- Multi-tenant: suporta múltiplos estabelecimentos via slug na URL
- Stack: Angular 17 standalone + Supabase + Vercel

## Tarefa

Execute os seguintes passos **na ordem exata**:

### 1. Criar o projeto
```bash
ng new cafe-menu --standalone --routing --style=scss --skip-git
cd cafe-menu
```

### 2. Instalar dependências
```bash
npm install @supabase/supabase-js
npm install angularx-qrcode
npm install @angular/material @angular/cdk
npm install -D @types/node
```

### 3. Criar a estrutura de pastas
```bash
mkdir -p src/app/core/services
mkdir -p src/app/core/guards
mkdir -p src/app/core/models
mkdir -p src/app/features/menu/menu-home
mkdir -p src/app/features/menu/category-section
mkdir -p src/app/features/menu/item-card
mkdir -p src/app/features/admin/login
mkdir -p src/app/features/admin/dashboard
mkdir -p src/app/features/admin/categories
mkdir -p src/app/features/admin/items
mkdir -p src/app/features/admin/qrcode
mkdir -p src/app/shared/components
mkdir -p src/environments
```

### 4. Criar os arquivos de ambiente
Crie `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

Crie `src/environments/environment.prod.ts` com `production: true` e mesmas chaves.

### 5. Configurar o `app.config.ts`
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations()
  ]
};
```

### 6. Configurar o `app.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  {
    path: 'menu/:slug',
    loadComponent: () =>
      import('./features/menu/menu-home/menu-home.component')
        .then(m => m.MenuHomeComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories.component')
            .then(m => m.CategoriesComponent)
      },
      {
        path: 'items',
        loadComponent: () =>
          import('./features/admin/items/items.component')
            .then(m => m.ItemsComponent)
      },
      {
        path: 'qrcode',
        loadComponent: () =>
          import('./features/admin/qrcode/qrcode.component')
            .then(m => m.QrcodeComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
```

### 7. Criar o `tsconfig.app.json` atualizado
Garanta que `compilerOptions` tenha:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Critério de Conclusão
- `ng serve` roda sem erros
- Estrutura de pastas criada conforme especificado
- Ambientes configurados com placeholders do Supabase
- Rotas lazy-load configuradas
