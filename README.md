# NutriAI 🥗

Tu nutricionista inteligente. Registra comidas con lenguaje natural, la IA calcula los macros.

## Setup

### 1. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Base de datos

Ejecuta `supabase/schema.sql` en tu Supabase SQL Editor.

### 3. Supabase Auth

En tu proyecto Supabase → Authentication → URL Configuration:
- Site URL: `https://tu-dominio.vercel.app`
- Redirect URLs: `https://tu-dominio.vercel.app/**`

Habilita providers: Email (magic link) + Google OAuth.

### 4. Vercel

Variables de entorno en Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `ANTHROPIC_API_KEY`

### 5. Local

```bash
npm install
npm run dev
```

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Anthropic Claude (parse de comidas + consejos)
- Vercel (deploy)

## Features MVP

- ✅ Auth (magic link + Google)
- ✅ Onboarding 3 pasos
- ✅ Input de comida con IA (texto natural)
- ✅ Dashboard con anillo de macros
- ✅ Consejo diario de IA
- ✅ Tracker de peso con gráfica
- ✅ Timer de ayuno intermitente
- ✅ Dark mode nativo
