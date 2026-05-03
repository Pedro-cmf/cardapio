# 🤖 Agentes Copilot — Cafe Menu

Pasta com os **Prompt Files** para o GitHub Copilot Chat no VSCode.
Cada arquivo é um agente autônomo com responsabilidade única.

## 📁 Estrutura

```
.github/prompts/
├── 00-project-setup.prompt.md    ← Cria projeto Angular + estrutura de pastas + rotas
├── 01-supabase-database.prompt.md ← SQL migration, RLS, models TypeScript, SupabaseService
├── 02-auth.prompt.md              ← AuthService (JWT), AuthGuard, tela de Login
├── 03-public-menu.prompt.md       ← Página pública do cardápio (QR Code aponta aqui)
├── 04-admin-crud.prompt.md        ← Painel admin: CRUD de categorias, itens, promoções
├── 05-ui-design.prompt.md         ← Paleta verde/creme/dourado, tipografia, responsivo
└── 06-deploy.prompt.md            ← Build produção + deploy Vercel + checklist segurança
```

## 🚀 Como usar no VSCode

### Opção 1 — Copilot Chat (recomendado)
1. Abra o projeto no VSCode
2. Abra o **Copilot Chat** (`Ctrl+Alt+I`)
3. Clique em 📎 (Attach) → **Prompt Files**
4. Selecione o arquivo do agente que quer executar
5. Copilot irá executar toda a tarefa do agente

### Opção 2 — Referenciar no chat
```
#00-project-setup.prompt.md Execute este agente
```

## 📋 Ordem de Execução

```
00 → 01 → 02 → 03 → 04 → 05 → 06
Setup  DB  Auth Menu Admin UI  Deploy
```

Cada agente tem um **"Pré-requisitos"** indicando quais devem ter sido executados antes.

## 🏗️ Stack do Projeto

| Camada       | Tecnologia              |
|--------------|-------------------------|
| Frontend     | Angular 17 Standalone   |
| Backend/DB   | Supabase (PostgreSQL)   |
| Auth/JWT     | Supabase Auth           |
| Hospedagem   | Vercel (gratuito)       |
| QR Code      | angularx-qrcode         |

## 🎨 Paleta de Cores

| Nome          | Hex       | Uso                        |
|---------------|-----------|----------------------------|
| Verde Escuro  | `#1C3829` | Primária, fundos, textos   |
| Creme         | `#F5F0E0` | Fundo geral, cartões       |
| Dourado       | `#C9A84C` | Destaques, títulos, bordas |
| Verde Médio   | `#2D5A40` | Hover, sidebar             |

## 🔐 Segurança

- Leitura pública liberada via Supabase RLS (sem auth)
- Escrita (INSERT/UPDATE/DELETE) exige JWT válido
- Auth via Supabase Auth (email + senha)
- HTTPS automático no Vercel
- Anon key é pública por design — a segurança está no RLS

## 🔄 Reuso para outros estabelecimentos

O projeto é **multi-tenant por design**:
- Cada café tem seu próprio registro em `establishments`
- URL: `/menu/:slug` — ex: `/menu/cafe-paulista`
- Cores personalizadas por estabelecimento no banco
- Um único deploy serve N clientes
