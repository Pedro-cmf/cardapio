# Deployment Guide - Cafe Menu

## Configuração

As credenciais do Supabase ficam nos arquivos de environment do Angular:

- `src/environments/environment.ts` — usado em desenvolvimento (`ng serve`)
- `src/environments/environment.prod.ts` — usado no build de produção (`ng build`)

A chave usada é a **anon/publishable key** do Supabase, projetada para ficar exposta no frontend. A segurança dos dados é garantida pelas **Row Level Security (RLS) policies** configuradas no Supabase.

## Build para produção

```bash
npm run build
```

Gera o build otimizado em `dist/cafe-menu/browser/`.

## Deploy na Vercel

O projeto está configurado via `vercel.json`. Basta conectar o repositório na Vercel e o deploy é automático a cada push na branch `main`.
