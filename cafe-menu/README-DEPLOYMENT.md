# Deployment Guide - Cafe Menu

## Environment Variables Configuration

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   SUPABASE_URL=your_actual_supabase_url
   SUPABASE_ANON_KEY=your_actual_anon_key
   ```

3. The `.env` file is gitignored and will not be committed

### Production Deployment (CI/CD)

#### Option 1: Vercel / Netlify
Add environment variables in your dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

#### Option 2: GitHub Actions
Add secrets to your repository:
1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

Example `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

#### Option 3: Docker
Use environment variables in your `docker-compose.yml`:
```yaml
environment:
  - SUPABASE_URL=${SUPABASE_URL}
  - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
```

### Security Best Practices

✅ **DO:**
- Use Row Level Security (RLS) policies in Supabase
- Rotate keys periodically
- Use different credentials for dev/staging/prod
- Monitor Supabase logs for suspicious activity

❌ **DON'T:**
- Never commit `.env` file
- Never hardcode credentials in source code
- Never share credentials in chat/email
- Never use production keys in development

## Building for Production

```bash
npm run build
```

This creates an optimized build in `dist/cafe-menu/`
