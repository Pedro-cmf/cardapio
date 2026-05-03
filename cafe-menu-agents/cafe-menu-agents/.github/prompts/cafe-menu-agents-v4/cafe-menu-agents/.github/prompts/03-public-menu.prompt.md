---
mode: agent
description: Builds the public menu page - hero, sticky category bar with scroll spy (active tab updates on scroll), hamburger dropdown, inline search and 2-column item grid
---

# 🍽️ Agent: Menu Público — Scroll Spy + Hamburger + Search

## Comportamentos obrigatórios
1. **Scroll Spy**: `IntersectionObserver` detecta qual seção está visível e atualiza a tab ativa + faz auto-scroll horizontal da tab para ficar visível
2. **Hamburguer ☰**: abre dropdown vertical com todas as categorias (igual ao print)
3. **Busca 🔍**: substitui a barra de categorias por input full-width; filtra em tempo real; botão "Fechar" restaura a barra
4. **Tab ativa**: underline na cor `--color-accent` (`#C9A84C`)

## SQL (rodar no Supabase antes)
```sql
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;
```

## Model — atualizar `src/app/core/models/index.ts`
```typescript
export interface Establishment {
  id: string; name: string; slug: string;
  logo_url?: string; cover_image_url?: string; address?: string;
  primary_color: string; secondary_color: string; accent_color: string;
  created_at?: string;
}
```

---

## `menu-home.component.ts`

```typescript
import {
  Component, OnInit, OnDestroy, signal, computed,
  inject, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Establishment, Category } from '../../../core/models';

@Component({
  selector: 'app-menu-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-home.component.html',
  styleUrls: ['./menu-home.component.scss']
})
export class MenuHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);

  establishment = signal<Establishment | null>(null);
  categories = signal<Category[]>([]);
  loading = signal(true);
  error = signal('');
  activeCategoryId = signal('');
  searchOpen = signal(false);
  dropdownOpen = signal(false);
  searchQuery = signal('');

  filteredCategories = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.categories();
    return this.categories()
      .map(cat => ({
        ...cat,
        items: (cat.items ?? []).filter(i =>
          i.active && (
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q)
          )
        )
      }))
      .filter(cat => (cat.items ?? []).length > 0);
  });

  private observer?: IntersectionObserver;
  private clickOutside = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest('.burger-area')) this.dropdownOpen.set(false);
  };

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    try {
      const est = await this.supabase.getEstablishmentBySlug(slug);
      if (!est) { this.error.set('Estabelecimento não encontrado.'); return; }
      this.establishment.set(est);
      this.applyTheme(est);
      const cats = await this.supabase.getFullMenu(est.id);
      this.categories.set(cats);
      if (cats.length) this.activeCategoryId.set(cats[0].id);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erro ao carregar');
    } finally {
      this.loading.set(false);
    }
    document.addEventListener('click', this.clickOutside);
  }

  ngAfterViewInit() {
    // Pequeno delay para garantir que o DOM das seções está renderizado
    setTimeout(() => this.setupScrollSpy(), 300);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    document.removeEventListener('click', this.clickOutside);
  }

  private setupScrollSpy() {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      entries => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) {
          const id = visible.target.id.replace('sec-', '');
          this.activeCategoryId.set(id);
          // Auto-scroll a tab ativa para ficar visível
          setTimeout(() => {
            const activeTab = document.querySelector('.cat-tab.active') as HTMLElement;
            activeTab?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
          }, 50);
        }
      },
      { threshold: 0.25, rootMargin: '-50px 0px -60% 0px' }
    );
    this.categories().forEach(cat => {
      const el = document.getElementById('sec-' + cat.id);
      if (el) this.observer!.observe(el);
    });
  }

  scrollToCategory(id: string) {
    this.activeCategoryId.set(id);
    this.dropdownOpen.set(false);
    document.getElementById('sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleSearch() {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) this.searchQuery.set('');
  }

  toggleDropdown() { this.dropdownOpen.update(v => !v); }

  formatPrice(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private applyTheme(est: Establishment) {
    const r = document.documentElement;
    r.style.setProperty('--color-primary', est.primary_color);
    r.style.setProperty('--color-secondary', est.secondary_color);
    r.style.setProperty('--color-accent', est.accent_color);
  }
}
```

---

## `menu-home.component.html`

```html
<div class="menu-page" *ngIf="!loading(); else loader">
  <ng-container *ngIf="!error(); else errTpl">

    <!-- HERO -->
    <div class="hero"
      [style.background-image]="establishment()?.cover_image_url
        ? 'url(' + establishment()!.cover_image_url + ')'
        : 'none'">
      <div class="hero-ov"></div>
      <button class="btn-wpp" title="WhatsApp">💬</button>
    </div>

    <!-- INFO DO ESTABELECIMENTO -->
    <div class="est-info">
      <div class="est-left">
        <img class="est-logo"
          [src]="establishment()?.logo_url || 'assets/logo-placeholder.png'"
          [alt]="establishment()?.name" />
        <div>
          <h1 class="est-name">{{ establishment()?.name }}</h1>
          <p class="est-addr" *ngIf="establishment()?.address">
            📍 {{ establishment()!.address }}
          </p>
        </div>
      </div>
      <div class="est-right">
        <span class="badge-status open">● Aberto</span>
        <button class="btn-info">ℹ Informação</button>
      </div>
    </div>

    <!-- SEARCH BAR (aparece quando clica em 🔍) -->
    <div class="search-bar-full" [class.open]="searchOpen()">
      <input
        type="text"
        placeholder="Escreva algo para pesquisar"
        [ngModel]="searchQuery()"
        (ngModelChange)="searchQuery.set($event)"
      />
      <button class="btn-close-search" (click)="toggleSearch()">Fechar</button>
    </div>

    <!-- BARRA DE CATEGORIAS (sticky) -->
    <div class="cat-bar" [class.hidden]="searchOpen()">
      <button class="icon-btn" (click)="toggleSearch()">🔍</button>

      <!-- Hamburger + dropdown -->
      <div class="burger-area">
        <button class="icon-btn" (click)="toggleDropdown()">☰</button>
        <div class="dropdown" [class.open]="dropdownOpen()">
          <button
            *ngFor="let cat of categories()"
            class="dropdown-item"
            (click)="scrollToCategory(cat.id)">
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Tabs horizontal com scroll -->
      <nav class="cat-tabs">
        <button
          *ngFor="let cat of categories()"
          class="cat-tab"
          [class.active]="activeCategoryId() === cat.id"
          [attr.data-id]="cat.id"
          (click)="scrollToCategory(cat.id)">
          {{ cat.name }}
        </button>
      </nav>
    </div>

    <!-- CARDÁPIO -->
    <main class="menu-content">
      <section
        *ngFor="let cat of filteredCategories()"
        class="cat-section"
        [id]="'sec-' + cat.id">
        <h2 class="cat-title">{{ cat.name }}</h2>
        <div class="items-grid">
          <div
            *ngFor="let item of cat.items"
            class="item-card"
            [class.promo]="item.is_promotion">
            <div class="item-body">
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-desc" *ngIf="item.description">{{ item.description }}</p>
              <div class="price-row">
                <span class="price-old" *ngIf="item.is_promotion">
                  {{ formatPrice(item.price) }}
                </span>
                <span class="price-cur">
                  {{ formatPrice(item.is_promotion && item.promotion_price
                    ? item.promotion_price : item.price) }}
                </span>
                <span class="badge-promo" *ngIf="item.is_promotion">Promoção</span>
              </div>
            </div>
            <img *ngIf="item.image_url"
              [src]="item.image_url" [alt]="item.name"
              class="item-img" loading="lazy" />
            <div *ngIf="!item.image_url" class="item-img-placeholder"></div>
          </div>
        </div>
      </section>

      <div class="empty-msg"
        *ngIf="filteredCategories().length === 0 && searchQuery()">
        Nenhum resultado para "{{ searchQuery() }}"
      </div>
    </main>

  </ng-container>
</div>

<ng-template #loader>
  <div class="full-center"><div class="spinner"></div><p>Carregando...</p></div>
</ng-template>
<ng-template #errTpl>
  <div class="full-center">😕 {{ error() }}</div>
</ng-template>
```

---

## `menu-home.component.scss`

```scss
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.menu-page { background: var(--color-secondary); min-height: 100vh; font-family: 'Lato', sans-serif; }

// Hero
.hero {
  height: 180px; position: relative;
  background: var(--color-primary) center/cover no-repeat;
}
.hero-ov { position: absolute; inset: 0; background: linear-gradient(to bottom,rgba(0,0,0,.1),rgba(0,0,0,.45)); }
.btn-wpp {
  position: absolute; top: 1rem; right: 1rem;
  background: #25D366; color: #fff; border: none;
  border-radius: 50%; width: 36px; height: 36px;
  font-size: 1rem; cursor: pointer; z-index: 2;
  display: flex; align-items: center; justify-content: center;
}

// Info
.est-info {
  display: flex; align-items: flex-start; justify-content: space-between;
  flex-wrap: wrap; gap: .75rem; padding: .875rem 1.25rem;
  background: #fff; border-bottom: 1px solid #eee;
}
.est-left { display: flex; align-items: center; gap: .875rem; }
.est-logo {
  width: 72px; height: 72px; border-radius: 10px; object-fit: cover;
  border: 3px solid var(--color-accent); flex-shrink: 0;
  margin-top: -40px; background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
}
.est-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--color-primary); }
.est-addr { font-size: .75rem; color: #999; margin-top: .15rem; }
.est-right { display: flex; align-items: center; gap: .5rem; }
.badge-status {
  font-size: .72rem; font-weight: 700; padding: .2rem .6rem; border-radius: 20px;
  &.open { color: #16a34a; background: #dcfce7; }
  &.closed { color: #dc2626; background: #fee2e2; }
}
.btn-info {
  font-size: .78rem; font-weight: 600; color: #444;
  background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px;
  padding: .35rem .875rem; cursor: pointer;
}

// Search bar
.search-bar-full {
  display: none; align-items: center; gap: .75rem;
  padding: .5rem 1rem; background: #fff; border-bottom: 1px solid #eee;
  &.open { display: flex; }

  input {
    flex: 1; border: none; background: #f5f5f5; border-radius: 8px;
    padding: .5rem .875rem; font-size: .9rem; font-family: 'Lato', sans-serif;
    outline: none; color: var(--color-primary);
    &::placeholder { color: #bbb; }
  }
}
.btn-close-search {
  background: var(--color-primary); color: #fff; border: none;
  border-radius: 8px; padding: .5rem 1rem; font-size: .82rem;
  font-weight: 700; cursor: pointer;
}

// Category bar
.cat-bar {
  background: var(--color-secondary); border-bottom: 2px solid rgba(0,0,0,.07);
  display: flex; align-items: center; position: sticky; top: 0;
  z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,.06);
  &.hidden { display: none; }
}
.icon-btn {
  background: none; border: none; font-size: 1rem;
  padding: .75rem .6rem; cursor: pointer; flex-shrink: 0; color: #444;
}
.burger-area { position: relative; flex-shrink: 0; }
.dropdown {
  position: absolute; top: 100%; left: 0; width: 220px;
  background: #fff; border: 1px solid #eee;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  z-index: 200; display: none;
  &.open { display: block; }
}
.dropdown-item {
  display: block; width: 100%; text-align: left;
  padding: .75rem 1.25rem; font-size: .85rem; color: #333;
  background: none; border: none; border-bottom: 1px solid #f5f5f5; cursor: pointer;
  &:hover { background: #fafafa; color: var(--color-primary); }
}
.cat-tabs {
  display: flex; overflow-x: auto; flex: 1;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.cat-tab {
  white-space: nowrap; padding: .875rem .875rem;
  font-size: .74rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  border: none; background: none; color: #888; cursor: pointer;
  border-bottom: 3px solid transparent; transition: color .15s, border-color .15s; flex-shrink: 0;
  &.active { color: var(--color-primary); border-bottom-color: var(--color-accent); }
  &:hover:not(.active) { color: var(--color-primary); }
}

// Content
.menu-content { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
.cat-section { margin-bottom: 2.25rem; scroll-margin-top: 52px; }
.cat-title {
  font-family: 'Playfair Display', serif; font-size: 1rem; color: var(--color-primary);
  text-transform: uppercase; letter-spacing: .1em;
  padding-bottom: .5rem; border-bottom: 2px solid var(--color-accent); margin-bottom: 1rem;
}
.items-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: .75rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
}
.item-card {
  display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem;
  background: #fff; border-radius: 10px; padding: .875rem;
  border-left: 3px solid transparent; transition: background .15s;
  &:hover { background: #fafafa; }
  &.promo { border-left-color: #16a34a; }
}
.item-body { flex: 1; display: flex; flex-direction: column; gap: .2rem; }
.item-name { font-size: .88rem; font-weight: 700; color: var(--color-primary); line-height: 1.3; }
.item-desc {
  font-size: .75rem; color: #999; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.price-row { display: flex; align-items: center; gap: .35rem; flex-wrap: wrap; margin-top: .4rem; }
.price-old { text-decoration: line-through; color: #ccc; font-size: .75rem; }
.price-cur { font-weight: 700; font-size: .97rem; color: #1a1a1a; }
.badge-promo { background: #dcfce7; color: #16a34a; font-size: .62rem; font-weight: 700; padding: .15rem .4rem; border-radius: 4px; text-transform: uppercase; }
.item-img { width: 88px; height: 88px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.item-img-placeholder { width: 88px; height: 88px; border-radius: 8px; background: #f0ece0; flex-shrink: 0; }

// Utils
.full-center { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--color-primary); font-family: 'Lato', sans-serif; }
.spinner { width: 36px; height: 36px; border: 4px solid #ddd; border-top-color: var(--color-accent); border-radius: 50%; animation: spin .8s linear infinite; }
.empty-msg { text-align: center; padding: 3rem 1rem; color: #bbb; font-size: .88rem; }
@keyframes spin { to { transform: rotate(360deg); } }
```

---

## Critério de Conclusão
- Hero 180px com foto do estabelecimento
- Logo quadrado (border-radius 10px) com borda dourada sobrepondo o hero
- Barra de categorias sticky no topo ao rolar
- **Scroll Spy funcionando**: tab ativa muda ao rolar + auto-scroll horizontal da tab
- Hamburger ☰ abre dropdown vertical com todas as categorias; fecha ao clicar fora
- Busca 🔍 substitui a barra por input; filtra em tempo real; "Fechar" restaura a barra
- Grade 2 colunas responsiva (1 no mobile) com foto 88x88 à direita
- Preço em preto, promoção com riscado + badge verde
