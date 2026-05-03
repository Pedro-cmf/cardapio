---
mode: agent
description: Orchestrator — executes all cafe-menu agents in sequence to build the complete project from scratch
---

# 🎯 Orquestrador — Cafe Menu (Full Build)

Execute **todos os passos abaixo em sequência**, sem pular nenhum.
Aguarde cada etapa concluir antes de iniciar a próxima.
Ao final de cada etapa, confirme que não há erros de compilação antes de prosseguir.

---

## ETAPA 1 — Setup do Projeto
#file:.github/prompts/00-project-setup.prompt.md

Execute todas as instruções do agente de setup.
✅ Critério: `ng serve` sobe sem erros.

---

## ETAPA 2 — Banco de Dados (Supabase)
#file:.github/prompts/01-supabase-database.prompt.md

Execute todas as instruções do agente de banco.
✅ Critério: `SupabaseService` compila sem erros. SQL copiado para arquivo `supabase/migrations/001_init.sql`.

---

## ETAPA 3 — Autenticação (JWT)
#file:.github/prompts/02-auth.prompt.md

Execute todas as instruções do agente de auth.
✅ Critério: `AuthGuard` e `AuthService` compilam. Rota `/admin/login` renderiza.

---

## ETAPA 4 — Cardápio Público
#file:.github/prompts/03-public-menu.prompt.md

Execute todas as instruções do agente de menu público.
✅ Critério: Rota `/menu/:slug` renderiza com dados mockados ou do Supabase.

---

## ETAPA 5 — Painel Admin (CRUD)
#file:.github/prompts/04-admin-crud.prompt.md

Execute todas as instruções do agente de admin.
✅ Critério: Dashboard, categorias, itens e qrcode compilam sem erros.

---

## ETAPA 6 — Design & Estilos
#file:.github/prompts/05-ui-design.prompt.md

Execute todas as instruções do agente de UI.
✅ Critério: Paleta de cores aplicada, layout admin responsivo visível.

---

## ETAPA 7 — Deploy
#file:.github/prompts/06-deploy.prompt.md

Execute todas as instruções do agente de deploy.
✅ Critério: `vercel.json` criado, `ng build --configuration production` sem erros.

---

## Verificação Final

Após todas as etapas, execute:
```bash
ng build --configuration production
```

Se houver erros, corrija antes de fazer o deploy.
Depois execute:
```bash
vercel --prod
```
