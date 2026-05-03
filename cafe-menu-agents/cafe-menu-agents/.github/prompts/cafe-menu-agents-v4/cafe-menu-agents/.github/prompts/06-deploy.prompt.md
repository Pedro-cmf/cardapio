---
mode: agent
description: Configures and deploys the project to Vercel (frontend) and finalizes Supabase environment variables
---

# 🚀 Agent: Deploy (Vercel + Supabase)

## Responsabilidade
Configurar variáveis de ambiente, build de produção e deploy gratuito no Vercel.

## Pré-requisitos
- Todos os agentes anteriores concluídos
- `ng build` roda sem erros localmente
- Conta no [vercel.com](https://vercel.com) (gratuita)
- Projeto no [supabase.com](https://supabase.com) criado

---

## 1. Obter credenciais do Supabase

No painel do Supabase:
1. Settings → API
2. Copiar **Project URL** e **anon/public key**

---

## 2. Configurar arquivos de ambiente

Atualize `src/environments/environment.ts` (desenvolvimento):
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxxxxxxxxxx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIs...'
};
```

Atualize `src/environments/environment.prod.ts` (produção — use as mesmas chaves ou variáveis injetadas pelo Vercel):
```typescript
export const environment = {
  production: true,
  supabaseUrl: (window as any).__env?.SUPABASE_URL ?? '',
  supabaseKey: (window as any).__env?.SUPABASE_KEY ?? ''
};
```

> **Melhor prática**: Use a abordagem de `__env` injetado no `index.html` via script no build, ou simplesmente coloque os valores diretamente — a anon key do Supabase é **pública por design** (a segurança fica no RLS).

---

## 3. Criar `vercel.json` na raiz do projeto

```json
{
  "buildCommand": "ng build --configuration production",
  "outputDirectory": "dist/cafe-menu/browser",
  "framework": "angular",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> O `rewrites` garante que as rotas do Angular (SPA) funcionem após reload da página.

---

## 4. Deploy via Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Dentro da pasta do projeto
vercel

# Responder as perguntas:
# - Set up and deploy? Y
# - Which scope? (sua conta)
# - Link to existing project? N
# - Project name: cafe-menu
# - In which directory is your code? ./
# - Override settings? N
```

---

## 5. Variáveis de Ambiente no Vercel (opcional)

Se preferir não colocar as chaves no código:

1. Vercel Dashboard → seu projeto → Settings → Environment Variables
2. Adicionar:
   - `SUPABASE_URL` = sua URL
   - `SUPABASE_KEY` = sua anon key

3. No `angular.json`, adicionar ao build:
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

---

## 6. Deploy de atualizações futuras

```bash
# Após cada mudança
vercel --prod
```

Ou conectar o repositório GitHub ao Vercel para deploy automático a cada `git push`.

---

## 7. URL final do cardápio para QR Code

Após o deploy, a URL pública será:
```
https://cafe-menu.vercel.app/menu/cafe-clube
```

Acesse `/admin/qrcode` no painel para gerar e imprimir o QR Code com a URL de produção.

---

## 8. Checklist Final de Segurança

- [ ] RLS ativo em todas as tabelas do Supabase
- [ ] Testado: SELECT sem auth retorna dados ✅
- [ ] Testado: INSERT sem auth retorna erro 403 ✅
- [ ] Senha do admin criada no Supabase Auth (mínimo 12 chars)
- [ ] `ng build --configuration production` sem warnings
- [ ] HTTPS ativo no Vercel (automático)

---

## Critério de Conclusão
- `https://seu-projeto.vercel.app/menu/:slug` acessível publicamente
- `/admin/login` funciona com o usuário criado no Supabase Auth
- QR Code gerado aponta para a URL de produção
