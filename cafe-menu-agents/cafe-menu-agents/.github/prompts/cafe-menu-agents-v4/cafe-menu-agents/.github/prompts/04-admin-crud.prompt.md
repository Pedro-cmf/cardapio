---
mode: agent
description: Builds the protected admin panel with full CRUD for categories and menu items, including price/promotion toggle
---

# ⚙️ Agent: Admin Panel (CRUD)

## Responsabilidade
Criar o painel administrativo protegido por JWT. CRUD completo de categorias e itens, com toggle de promoção e preço.

## Pré-requisitos
- `01-supabase-database.prompt.md` concluído
- `02-auth.prompt.md` concluído

---

## 1. Admin Layout / Dashboard

Crie `src/app/features/admin/dashboard/dashboard.component.ts`:

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Establishment } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);

  establishments = signal<Establishment[]>([]);
  selected = signal<Establishment | null>(null);

  async ngOnInit() {
    const data = await this.supabase.getAllEstablishments();
    this.establishments.set(data);
    if (data.length === 1) this.selected.set(data[0]);
  }

  logout() { this.auth.signOut(); }
}
```

Crie `src/app/features/admin/dashboard/dashboard.component.html`:

```html
<div class="admin-layout">
  <!-- Sidebar -->
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <span>☕</span>
      <strong>Admin Cardápio</strong>
    </div>

    <nav class="sidebar-nav">
      <a routerLink="/admin/dashboard" routerLinkActive="active">📋 Visão Geral</a>
      <a routerLink="/admin/categories" routerLinkActive="active">🗂️ Categorias</a>
      <a routerLink="/admin/items" routerLinkActive="active">🍽️ Itens</a>
      <a routerLink="/admin/qrcode" routerLinkActive="active">📱 QR Code</a>
    </nav>

    <button class="btn-logout" (click)="logout()">Sair</button>
  </aside>

  <!-- Main content -->
  <main class="admin-main">
    <router-outlet />
  </main>
</div>
```

---

## 2. Categories CRUD Component

Crie `src/app/features/admin/categories/categories.component.ts`:

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Category, Establishment } from '../../../core/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  establishments = signal<Establishment[]>([]);
  categories = signal<Category[]>([]);
  selectedEstId = signal('');
  editingId = signal<string | null>(null);
  loading = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    order_index: [0],
    active: [true]
  });

  async ngOnInit() {
    const ests = await this.supabase.getAllEstablishments();
    this.establishments.set(ests);
    if (ests.length) {
      this.selectedEstId.set(ests[0].id);
      await this.loadCategories();
    }
  }

  async loadCategories() {
    const cats = await this.supabase.getCategoriesByEstablishment(this.selectedEstId());
    this.categories.set(cats);
  }

  startEdit(cat: Category) {
    this.editingId.set(cat.id);
    this.form.patchValue({ name: cat.name, order_index: cat.order_index, active: cat.active });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ active: true, order_index: 0 });
  }

  async save() {
    if (this.form.invalid) return;
    this.loading.set(true);

    try {
      const payload = {
        name: this.form.value.name!,
        order_index: this.form.value.order_index ?? 0,
        active: this.form.value.active ?? true,
        establishment_id: this.selectedEstId()
      };

      if (this.editingId()) {
        await this.supabase.updateCategory(this.editingId()!, payload);
      } else {
        await this.supabase.createCategory(payload);
      }

      this.cancelEdit();
      await this.loadCategories();
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActive(cat: Category) {
    await this.supabase.updateCategory(cat.id, { active: !cat.active });
    await this.loadCategories();
  }

  async delete(id: string) {
    if (!confirm('Tem certeza? Isso excluirá os itens dessa categoria.')) return;
    await this.supabase.deleteCategory(id);
    await this.loadCategories();
  }
}
```

---

## 3. Items CRUD Component

Crie `src/app/features/admin/items/items.component.ts`:

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Category, MenuItem } from '../../../core/models';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items.component.html'
})
export class ItemsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  items = signal<MenuItem[]>([]);
  selectedCatId = signal('');
  editingId = signal<string | null>(null);
  loading = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    image_url: [''],
    active: [true],
    is_promotion: [false],
    promotion_price: [null as number | null]
  });

  async ngOnInit() {
    // Buscar todas as categorias de todos os estabelecimentos
    const ests = await this.supabase.getAllEstablishments();
    const allCats: Category[] = [];
    for (const est of ests) {
      const cats = await this.supabase.getCategoriesByEstablishment(est.id);
      allCats.push(...cats);
    }
    this.categories.set(allCats);
    if (allCats.length) {
      this.selectedCatId.set(allCats[0].id);
      await this.loadItems();
    }
  }

  async loadItems() {
    const items = await this.supabase.getItemsByCategory(this.selectedCatId());
    this.items.set(items);
  }

  startEdit(item: MenuItem) {
    this.editingId.set(item.id);
    this.form.patchValue({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      image_url: item.image_url ?? '',
      active: item.active,
      is_promotion: item.is_promotion,
      promotion_price: item.promotion_price ?? null
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ active: true, is_promotion: false, price: 0 });
  }

  async save() {
    if (this.form.invalid) return;
    this.loading.set(true);

    try {
      const v = this.form.value;
      const payload = {
        name: v.name!,
        description: v.description ?? '',
        price: v.price!,
        image_url: v.image_url ?? '',
        active: v.active!,
        is_promotion: v.is_promotion!,
        promotion_price: v.is_promotion ? v.promotion_price ?? null : null,
        category_id: this.selectedCatId()
      };

      if (this.editingId()) {
        await this.supabase.updateItem(this.editingId()!, payload);
      } else {
        await this.supabase.createItem(payload);
      }

      this.cancelEdit();
      await this.loadItems();
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActive(item: MenuItem) {
    await this.supabase.toggleItemActive(item.id, !item.active);
    await this.loadItems();
  }

  async togglePromo(item: MenuItem) {
    const newState = !item.is_promotion;
    let promoPrice = item.promotion_price ?? undefined;

    if (newState && !promoPrice) {
      const val = prompt('Informe o preço promocional (R$):');
      if (!val) return;
      promoPrice = parseFloat(val);
    }

    await this.supabase.togglePromotion(item.id, newState, promoPrice);
    await this.loadItems();
  }

  async delete(id: string) {
    if (!confirm('Excluir este item?')) return;
    await this.supabase.deleteItem(id);
    await this.loadItems();
  }
}
```

---

## 4. QR Code Component

Crie `src/app/features/admin/qrcode/qrcode.component.ts`:

```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Establishment } from '../../../core/models';

@Component({
  selector: 'app-qrcode',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  template: `
    <div class="qr-page">
      <h2>QR Code do Cardápio</h2>

      <div class="est-select" *ngIf="establishments().length > 1">
        <label>Estabelecimento:</label>
        <select (change)="onSelect($event)">
          <option *ngFor="let e of establishments()" [value]="e.slug">{{ e.name }}</option>
        </select>
      </div>

      <div class="qr-display" *ngIf="menuUrl()">
        <qrcode
          [qrdata]="menuUrl()"
          [width]="256"
          [errorCorrectionLevel]="'M'"
        />
        <p class="qr-url">{{ menuUrl() }}</p>
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
      </div>
    </div>
  `,
  styles: [`
    .qr-page { padding: 2rem; text-align: center; }
    h2 { color: var(--color-primary); margin-bottom: 2rem; }
    .qr-display { display: inline-flex; flex-direction: column; align-items: center; gap: 1rem; }
    .qr-url { font-size: 0.8rem; color: #666; word-break: break-all; max-width: 280px; }
    .btn-print {
      background: var(--color-accent); color: var(--color-primary);
      border: none; padding: 0.5rem 1.5rem; border-radius: 8px;
      font-weight: 700; cursor: pointer;
    }
    @media print { .btn-print, .est-select { display: none; } }
  `]
})
export class QrcodeComponent {
  private supabase = inject(SupabaseService);
  establishments = signal<Establishment[]>([]);
  menuUrl = signal('');

  async ngOnInit() {
    const ests = await this.supabase.getAllEstablishments();
    this.establishments.set(ests);
    if (ests.length) this.setUrl(ests[0].slug);
  }

  setUrl(slug: string) {
    this.menuUrl.set(`${window.location.origin}/menu/${slug}`);
  }

  onSelect(event: Event) {
    this.setUrl((event.target as HTMLSelectElement).value);
  }
}
```

---

## Critério de Conclusão
- Sidebar com navegação funcional
- CRUD de categorias com toggle ativo/inativo
- CRUD de itens com campo de preço de promoção condicional
- Toggle rápido de promoção em lista de itens
- QR Code gerado dinamicamente com URL real
- Tudo protegido por `AuthGuard`
