---
mode: agent
description: Creates Supabase schema, RLS policies, TypeScript models and the SupabaseService
---

# 🗄️ Agent: Supabase Database

## Responsabilidade
Criar toda a camada de dados: SQL migration, políticas de segurança (RLS) e o serviço Angular para acesso ao banco.

---

## 1. SQL Migration (rodar no Supabase SQL Editor)

```sql
-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- Estabelecimentos (multi-tenant)
create table establishments (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  primary_color text default '#1C3829',
  secondary_color text default '#F5F0E0',
  accent_color  text default '#C9A84C',
  created_at    timestamptz default now()
);

-- Categorias
create table categories (
  id               uuid primary key default uuid_generate_v4(),
  establishment_id uuid references establishments(id) on delete cascade,
  name             text not null,
  order_index      int default 0,
  active           boolean default true,
  created_at       timestamptz default now()
);

-- Itens do cardápio
create table menu_items (
  id               uuid primary key default uuid_generate_v4(),
  category_id      uuid references categories(id) on delete cascade,
  name             text not null,
  description      text,
  price            numeric(10,2) not null,
  image_url        text,
  active           boolean default true,
  is_promotion     boolean default false,
  promotion_price  numeric(10,2),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Trigger: atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger menu_items_updated_at
  before update on menu_items
  for each row execute procedure update_updated_at();
```

---

## 2. Row Level Security (RLS)

```sql
-- Ativar RLS em todas as tabelas
alter table establishments enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;

-- Leitura pública (sem auth)
create policy "public read establishments"
  on establishments for select using (true);

create policy "public read categories"
  on categories for select using (true);

create policy "public read menu_items"
  on menu_items for select using (true);

-- Escrita apenas para usuários autenticados
create policy "auth write establishments"
  on establishments for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth write categories"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth write menu_items"
  on menu_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

---

## 3. Dados de Seed (opcional para desenvolvimento)

```sql
insert into establishments (name, slug) values ('Café Clube', 'cafe-clube');

insert into categories (establishment_id, name, order_index)
select id, 'Bebidas Quentes', 1 from establishments where slug = 'cafe-clube'
union all
select id, 'Métodos', 2 from establishments where slug = 'cafe-clube'
union all
select id, 'Bebidas Especiais', 3 from establishments where slug = 'cafe-clube'
union all
select id, 'Bebidas Geladas', 4 from establishments where slug = 'cafe-clube'
union all
select id, 'Sanduíches', 5 from establishments where slug = 'cafe-clube'
union all
select id, 'Croissants', 6 from establishments where slug = 'cafe-clube'
union all
select id, 'Tapiocas', 7 from establishments where slug = 'cafe-clube'
union all
select id, 'Doces', 8 from establishments where slug = 'cafe-clube';
```

---

## 4. Models TypeScript

Crie `src/app/core/models/index.ts`:

```typescript
export interface Establishment {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  created_at?: string;
}

export interface Category {
  id: string;
  establishment_id: string;
  name: string;
  order_index: number;
  active: boolean;
  created_at?: string;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  active: boolean;
  is_promotion: boolean;
  promotion_price?: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateCategory = Omit<Category, 'id' | 'created_at' | 'items'>;
export type UpdateCategory = Partial<CreateCategory>;
export type CreateMenuItem = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMenuItem = Partial<CreateMenuItem>;
```

---

## 5. SupabaseService

Crie `src/app/core/services/supabase.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  Establishment, Category, MenuItem,
  CreateCategory, UpdateCategory,
  CreateMenuItem, UpdateMenuItem
} from '../models';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  // ── Establishments ────────────────────────────
  async getEstablishmentBySlug(slug: string): Promise<Establishment | null> {
    const { data, error } = await this.supabase
      .from('establishments')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  }

  async getAllEstablishments(): Promise<Establishment[]> {
    const { data, error } = await this.supabase
      .from('establishments')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async createEstablishment(payload: Omit<Establishment, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase
      .from('establishments')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ── Categories ────────────────────────────────
  async getCategoriesByEstablishment(establishmentId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('order_index');
    if (error) throw error;
    return data ?? [];
  }

  async createCategory(payload: CreateCategory): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, payload: UpdateCategory): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ── Menu Items ────────────────────────────────
  async getItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async getFullMenu(establishmentId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*, items:menu_items(*)')
      .eq('establishment_id', establishmentId)
      .eq('active', true)
      .order('order_index');
    if (error) throw error;
    return data ?? [];
  }

  async createItem(payload: CreateMenuItem): Promise<MenuItem> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateItem(id: string, payload: UpdateMenuItem): Promise<MenuItem> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleItemActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .update({ active })
      .eq('id', id);
    if (error) throw error;
  }

  async togglePromotion(id: string, is_promotion: boolean, promotion_price?: number): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .update({ is_promotion, promotion_price: is_promotion ? promotion_price : null })
      .eq('id', id);
    if (error) throw error;
  }
}
```

## Critério de Conclusão
- SQL rodado sem erros no Supabase
- RLS ativo e testado (SELECT público funciona sem auth, INSERT retorna 403 sem token)
- `SupabaseService` injetável sem erros de compilação
- Models tipados corretamente
