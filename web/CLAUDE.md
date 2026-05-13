# web/ — Juice landing + dashboard (Next.js 14)

> Contexto geral e regras estão no `CLAUDE.md` do root. Este arquivo só adiciona o específico do web.

## Stack

- **Next.js 14 App Router** (não Pages Router, não Next 15+).
- **TypeScript** — diferente do app/, aqui tudo é TS. Manter.
- **next-intl** pra i18n com rotas localizadas (`/pt`, `/en`, `/es`). Middleware em `middleware.ts`.
- **Tailwind + Framer Motion** pra UI/animação. Cor de brand: `#00FF7F`.
- **PostHog** + **Vercel Analytics** + **Google Analytics Data API** (server-side em `app/api/`).
- **Solana wallet adapter** — Phantom/Solflare/etc via `@solana/wallet-adapter-react-ui`.
- **Firebase** (v12 aqui, v10 no app) — somente leitura em geral, pra mostrar stats públicos.
- **Deploy:** Vercel (`vercel.json` configurado).

## Estrutura

```
app/
├── [locale]/             # todas as páginas públicas com i18n
│   ├── page.tsx          # landing principal
│   ├── airdrop/
│   ├── token/, tokenomics/
│   ├── wallet/           # conexão wallet Solana
│   ├── hackathon/, pitch/, manifesto/
│   ├── faq/, suporte/, parceiros/
│   ├── privacidade/, termos/, copyright/
│   ├── delete-account/   # requirement das stores
│   └── layout.tsx
├── api/
│   ├── active-users/     # GA4 realtime → JSON
│   └── total-minutes/    # Firebase agg → JSON
├── layout.tsx            # root layout (sem locale)
├── opengraph-image.tsx   # OG image dinâmica
├── robots.ts, sitemap.ts
└── globals.css

components/
├── sections/             # blocos de landing (hero, traction, etc)
├── ui/                   # primitives reutilizáveis
├── providers/            # PostHog, wallet, etc
├── seo/
└── PostHogProvider.tsx, PostHogPageView.tsx

i18n/
├── request.ts            # config next-intl server
└── routing.ts            # locales suportados + default
messages/{pt,en,es}.json  # strings traduzidas
lib/
├── firebase.ts           # cliente firebase web
├── analytics.ts
├── cn.ts                 # clsx + tailwind-merge
└── useMetalSpotlight.ts  # efeito hover
```

## i18n

- Locales: `pt` (default), `en`, `es`. Definidos em `i18n/routing.ts`.
- Toda string nova vai em `messages/{pt,en,es}.json`. Não hardcodar texto em jsx exceto em `app/api/` e componentes técnicos.
- Acesso: `const t = useTranslations('namespace')` em client, `getTranslations` em server.

## Comandos

```bash
npm run dev          # localhost:3000
npm run build        # produção
npm run start        # produção local depois do build
npm run lint         # eslint next
npm run type-check   # tsc --noEmit
```

## Vercel / Deploy

- Deploy automático via GitHub push (presumido).
- **Env vars críticas** (configurar na Vercel, não comitar):
  - Firebase config (`NEXT_PUBLIC_FIREBASE_*`)
  - PostHog (`NEXT_PUBLIC_POSTHOG_KEY`)
  - Google Analytics service account (`GA_*` — usado em `app/api/active-users/`)

## Dashboard `/admin` (planejado, ainda não existe)

Quando for criar:
- Estende `app/[locale]/admin/` (ou rota separada `/admin` sem locale — decidir)
- MVP: saques, compras, banner, push notifications, analytics
- Estratégia: vanilla JS injetado nas páginas Next em vez de splitar tudo em componentes React — é dashboard ops, não precisa ser bonito, precisa ser rápido de construir
- Auth: provavelmente bypass via env var/cookie pra rafa@ — definir antes de implementar
- Schema considera futuras campanhas de **boost network** (engagement-as-a-service)

Pergunta antes de começar a implementar — ainda tem decisões em aberto.

## Convenções

- **`lib/cn.ts`** pra mergear classes Tailwind. Usar.
- **Server Components por default**, `"use client"` só quando precisa de state/effects/wallet.
- **Rotas dinâmicas com locale:** `/[locale]/<rota>`. Linkar via `Link` do `next-intl`, não do `next/link`, pra preservar locale.
- **Imagens:** `next/image` quando possível. OG em `opengraph-image.tsx`.

## Não fazer

- **Não migrar pra Next 15 ou React 19** sem planejar — várias libs (next-intl 3.x, wallet adapter) podem quebrar.
- **Não trocar next-intl por outra solução de i18n** — rotas, middleware e messages já estão estruturados em torno dele.
- **Não adicionar deps pesadas** sem necessidade — bundle do landing importa pra SEO/LCP.
- **Não expor chaves server-side em `NEXT_PUBLIC_*`** (GA service account em particular).
