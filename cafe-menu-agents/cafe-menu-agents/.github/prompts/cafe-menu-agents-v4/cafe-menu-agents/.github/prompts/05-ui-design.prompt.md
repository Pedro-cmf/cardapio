---
mode: agent
description: Applies the cafe visual identity (dark green, cream, gold palette) with global styles, typography and admin layout polish
---

# 🎨 Agent: UI Design & Identidade Visual

## Responsabilidade
Aplicar a identidade visual da cafeteria: paleta de cores, tipografia, estilos globais, responsividade e layout do painel admin.

## Referência Visual
- Verde escuro (`#1C3829`) — cor primária, fundos e textos em destaque
- Creme (`#F5F0E0`) — fundo geral, cartões
- Dourado/âmbar (`#C9A84C`) — acentos, títulos de seção, bordas decorativas
- Verde médio (`#2D5A40`) — hover states, sidebar

---

## 1. Estilos Globais

Substitua o conteúdo de `src/styles.scss`:

```scss
// ── Importar Google Fonts ─────────────────────
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap');

// ── CSS Variables ─────────────────────────────
:root {
  --color-primary:    #1C3829;
  --color-secondary:  #F5F0E0;
  --color-accent:     #C9A84C;
  --color-mid:        #2D5A40;
  --color-text:       #1a1a1a;
  --color-text-muted: #666666;
  --color-white:      #ffffff;
  --color-danger:     #dc2626;
  --color-success:    #16a34a;

  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;

  --shadow-sm: 0 1px 4px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.18);

  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'Lato', system-ui, sans-serif;
}

// ── Reset ────────────────────────────────────
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; scroll-behavior: smooth; }

body {
  font-family: var(--font-body);
  background: var(--color-secondary);
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-display);
  line-height: 1.2;
}

img { max-width: 100%; display: block; }
a   { color: inherit; }
button { cursor: pointer; font-family: var(--font-body); }

// ── Utilitários ──────────────────────────────
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

// ── Scrollbar customizada ─────────────────────
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-accent);
  border-radius: 3px;
}
```

---

## 2. Admin Layout Styles

Crie `src/app/features/admin/dashboard/dashboard.component.scss`:

```scss
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}

.admin-sidebar {
  background: var(--color-primary);
  color: var(--color-secondary);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    height: auto;
    flex-direction: row;
    align-items: center;
    padding: 0.75rem 1rem;
    position: relative;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 1rem;

  span { font-size: 1.5rem; }
  strong { font-size: 0.9rem; font-weight: 700; letter-spacing: 0.04em; }

  @media (max-width: 768px) {
    padding: 0;
    border: none;
    margin: 0;
    flex: 1;
  }
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.75rem;

  @media (max-width: 768px) {
    flex-direction: row;
    padding: 0;
    gap: 0.5rem;
    overflow-x: auto;
  }

  a {
    display: block;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    color: rgba(255,255,255,0.7);
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;

    &:hover, &.active {
      background: var(--color-mid);
      color: var(--color-accent);
    }
  }
}

.btn-logout {
  background: none;
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.6);
  padding: 0.5rem 1rem;
  margin: 1rem 0.75rem 0;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-danger);
    color: #fca5a5;
  }

  @media (max-width: 768px) { margin: 0; }
}

.admin-main {
  background: #f8f6f1;
  overflow-y: auto;
  padding: 2rem;

  @media (max-width: 768px) { padding: 1rem; }
}
```

---

## 3. Estilos Reutilizáveis para CRUD (Admin)

Crie `src/app/features/admin/admin-shared.scss` e importe em cada componente admin:

```scss
// Cabeçalho de seção
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  h2 {
    font-family: var(--font-display);
    color: var(--color-primary);
    font-size: 1.5rem;
  }
}

// Cards de lista
.list-card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  .list-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid #f0ece0;

    &:last-child { border-bottom: none; }
    &.inactive { opacity: 0.5; }

    .item-name { flex: 1; font-weight: 600; color: var(--color-primary); }
    .item-meta { font-size: 0.8rem; color: var(--color-text-muted); }
  }
}

// Formulário
.crud-form {
  background: white;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;

  h3 {
    color: var(--color-primary);
    margin-bottom: 1rem;
    font-size: 1rem;
    font-weight: 700;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 600px) { grid-template-columns: 1fr; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    label { font-size: 0.8rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; }

    input, select, textarea {
      padding: 0.65rem 0.9rem;
      border: 2px solid #e5e0d0;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      transition: border-color 0.2s;
      font-family: var(--font-body);

      &:focus { outline: none; border-color: var(--color-accent); }
    }

    textarea { resize: vertical; min-height: 80px; }
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.25rem;
    flex-wrap: wrap;
  }
}

// Botões
.btn {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  transition: opacity 0.2s, transform 0.1s;

  &:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-primary   { background: var(--color-accent); color: var(--color-primary); }
.btn-secondary { background: #e5e0d0; color: var(--color-primary); }
.btn-danger    { background: #fee2e2; color: var(--color-danger); }
.btn-success   { background: #dcfce7; color: var(--color-success); }
.btn-icon      { padding: 0.4rem 0.6rem; font-size: 0.85rem; background: none; border: 1px solid #ddd; border-radius: var(--radius-sm); }

// Badge status
.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &.active   { background: #dcfce7; color: #16a34a; }
  &.inactive { background: #f3f4f6; color: #6b7280; }
  &.promo    { background: #fef9c3; color: #a16207; }
}
```

---

## 4. Aplicar tema nas variáveis CSS do `index.html`

No `src/index.html`, dentro do `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta name="theme-color" content="#1C3829">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

---

## Critério de Conclusão
- Paleta verde/creme/dourado aplicada globalmente via CSS variables
- Tipografia Playfair Display (títulos) + Lato (corpo)
- Admin sidebar responsiva (colapsa em mobile)
- Formulários e listas com visual consistente
- Nenhum estilo "padrão Angular" residual visível
