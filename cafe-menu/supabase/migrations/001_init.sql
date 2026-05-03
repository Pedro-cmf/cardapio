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

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- Dados de Seed (opcional para desenvolvimento)
-- ═══════════════════════════════════════════════════════════════════

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
