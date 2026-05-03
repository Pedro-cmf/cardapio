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
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/admin/overview/overview.component')
            .then(m => m.OverviewComponent)
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
      {
        path: 'preview',
        loadComponent: () =>
          import('./features/admin/preview/preview.component')
            .then(m => m.PreviewComponent)
      },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  }
];
