# CreatorAI Studio

AI platform for YouTube and short-form video creators.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Google Gemini (video analysis)
- Stripe (Pro subscriptions)

## Quick start

```bash
npm install
cp .env.local.example .env.local   # or use the included .env.local
npm run dev
```

Open http://localhost:3000

## Environment variables

Already partially filled in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase project
- `GEMINI_API_KEY` — Gemini API key
- `STRIPE_*` — add your Stripe keys for payments
- `STRIPE_PRO_PRICE_ID` — already set to test price

## Features
- Sign up / Login (Supabase Auth)
- Upload video → Supabase Storage
- Gemini AI analysis (titles, description, SEO, hooks, thumbnails, Shorts, etc.)
- Projects, History, Saved results
- Free / Pro plans + usage limits
- Stripe Checkout + webhook

## Android APK
See `BUILD_APK.md` and the `android-apk/` folder.
A debug APK was also built separately as `CreatorAI-Studio.apk`.

## Supabase
Project: CreatorAI Studio (pxuvirzxjqowayxfouge)
Schema, RLS, Storage bucket `videos`, and auth trigger are already applied.
