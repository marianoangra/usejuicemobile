# CNB Mobile — Web

Site institucional do **CNB Mobile**, app DePIN de energia na Solana competindo no **Frontier Colosseum** da Solana Foundation.

Construído com Next.js 14 (App Router), TypeScript, Tailwind, next-intl (pt/en/es), Framer Motion, Lucide e Supabase.

---

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# (edite .env.local com seus valores reais — veja seção "Variáveis de ambiente")

# 3. Rodar em desenvolvimento
npm run dev
# → abre em http://localhost:3000 (redireciona para /pt por padrão)
```

Build de produção local:

```bash
npm run build
npm run start
```

Type-check sem build:

```bash
npm run type-check
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, RSC, static + ISR) |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS 3 + CSS variáveis |
| i18n | next-intl 3 (pt padrão, en, es) |
| Animação | Framer Motion 11 (com `prefers-reduced-motion`) |
| Ícones | Lucide React |
| Backend (leads) | Supabase JS |
| Wallet (futuro) | `@solana/wallet-adapter-*` (instalado, **não ativo**) |
| Deploy | Vercel (`vercel.json` incluso) |

---

## Estrutura de pastas

```
cnbmobile-web/
├── app/
│   ├── layout.tsx                # Root: <html>, fontes (Inter + JetBrains Mono)
│   ├── globals.css               # Tailwind base + tokens custom
│   └── [locale]/
│       ├── layout.tsx            # NextIntlClientProvider + Nav + Footer
│       ├── page.tsx              # Landing (Hero + Features + How + Hackathon + Token + Waitlist)
│       ├── token/page.tsx
│       ├── hackathon/page.tsx
│       ├── wallet/page.tsx       # Placeholder "em breve"
│       ├── faq/page.tsx
│       ├── privacidade/page.tsx
│       ├── termos/page.tsx
│       └── suporte/page.tsx
├── components/
│   ├── ui/                       # Button, Card, Logo, Nav, LangSwitcher, PhoneMockup, Stars, …
│   └── sections/                 # Hero, Features, HowItWorks, Hackathon, Token, Waitlist, Footer
├── messages/
│   ├── pt.json                   # padrão
│   ├── en.json
│   └── es.json
├── i18n/
│   ├── routing.ts                # locales + Link/redirect/usePathname/useRouter tipados
│   └── request.ts                # carrega messages por locale no servidor
├── lib/
│   ├── supabase.ts               # singleton + insertLead()
│   └── cn.ts                     # clsx wrapper
├── public/images/
│   ├── screen-home.png           # screenshot real do app — Início
│   ├── screen-charging.png       # Carregar
│   ├── screen-ranking.png        # Ranking
│   └── screen-profile.png        # Perfil
├── middleware.ts                 # next-intl middleware (detecção de idioma)
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
├── .env.example
└── package.json
```

---

## Variáveis de ambiente

Todas opcionais para o build subir, mas necessárias para funcionalidade plena. Veja `.env.example` para o formato.

| Variável | Para quê | Sem ela |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Form de waitlist retorna erro graceful |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anônima | Idem |
| `NEXT_PUBLIC_CNB_MINT_ADDRESS` | Endereço da mint SPL | Mostra placeholder "Será divulgado em breve" |
| `NEXT_PUBLIC_TWITTER_URL` | URL do X/Twitter | Ícone do X some do footer |
| `NEXT_PUBLIC_TELEGRAM_URL` | URL do Telegram | Ícone some |
| `NEXT_PUBLIC_DISCORD_URL` | URL do Discord | Ícone some |
| `NEXT_PUBLIC_GITHUB_URL` | URL do GitHub | Ícone some |
| `NEXT_PUBLIC_APP_STORE_URL` | Link App Store | (a fazer: ligar nos CTAs Download App) |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Link Play Store | Idem |

Por design, **links sociais sem env var não renderizam** — preferimos esconder o ícone a mostrar um link quebrado.

---

## Schema Supabase (tabela `leads`)

Crie a tabela no Supabase (SQL Editor):

```sql
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  locale      text not null,
  source      text,
  created_at  timestamptz not null default now()
);

create unique index leads_email_unique on public.leads (lower(email));

-- RLS: permitir apenas INSERT da chave anon
alter table public.leads enable row level security;

create policy "anon can insert leads"
  on public.leads
  for insert
  to anon
  with check (true);
```

A função `insertLead` em `lib/supabase.ts` trata `unique_violation` (23505) como sucesso silencioso, então re-cadastros do mesmo email não geram erro para o usuário.

---

## i18n — adicionar/editar traduções

**Editar uma string existente:** abra `messages/{pt,en,es}.json` e altere o valor. Não há geração de tipos automática — basta salvar.

**Adicionar uma nova string:**
1. Adicione a chave nos três arquivos (`pt.json`, `en.json`, `es.json`) — manter paridade é importante.
2. No componente, use `const t = useTranslations('namespace')` e `t('chave')`.

**Adicionar um novo idioma (ex: francês):**
1. Crie `messages/fr.json` copiando `pt.json`.
2. Em `i18n/routing.ts`, adicione `'fr'` ao array `locales`.
3. Em `components/ui/LangSwitcher.tsx`, adicione um item no array `LANGS`.

**Idioma padrão:** `pt`. URL `/` redireciona para `/pt` via middleware. Trocar requer mudar `defaultLocale` em `i18n/routing.ts`.

---

## Deploy na Vercel

```bash
# 1. Push para o GitHub
git init
git add .
git commit -m "feat: initial CNB Mobile web"
git branch -M main
git remote add origin git@github.com:YOUR_ORG/cnbmobile-web.git
git push -u origin main

# 2. Importar no painel da Vercel — framework é auto-detectado (Next.js)
#    Region default no vercel.json: gru1 (São Paulo)

# 3. Configurar variáveis de ambiente no painel:
#    Settings → Environment Variables → adicione todas as do .env.example
#    Marque como "Production", "Preview", "Development" conforme necessário.

# 4. Domínio:
#    Settings → Domains → adicione cnbmobile.com (e www.cnbmobile.com com redirect)
```

O `vercel.json` incluso já configura headers de segurança (`X-Frame-Options`, `Permissions-Policy`, etc.) e cache imutável para `/images/*`.

---

## Convenções de design

**Paleta** (em `tailwind.config.ts`):
- `primary`: `#c6ff4a` (lime neon — CTAs, destaques)
- `secondary`: `#00FF7F` (verde spring — estados ativos/glows)
- `bg-deep`: `#070a07` (fundo principal)
- `bg-card`: `#182418` (cards)
- `bg-page`: `#0A0F1E` (azul-noite, do app)

**Tipografia:**
- Body: **Inter** (via `next/font/google`)
- Mono (badges/labels técnicos): **JetBrains Mono**

**Componentes:** sempre escolher entre `Button` / `ButtonLink` / `Card` / `SectionBadge` antes de criar variantes ad-hoc. Estilos de hover com `transition-all duration-200/300`. Glow via `box-shadow` definido como utilities Tailwind (`shadow-glow-primary`, `shadow-glow-card`, `shadow-glow-phone`).

**Animação:** Framer Motion sempre que envolver scroll ou stagger. Componente `Stars` usa seed determinístico (Mulberry32) para evitar mismatch SSR/CSR. `PhoneMockup` aplica `phone-tilt` (3D), neutralizado quando `prefers-reduced-motion: reduce`.

---

## Performance

Targets do briefing — **a verificar antes do go-live com `npm run build && npm run start` + Lighthouse:**
- Performance ≥ 95
- SEO = 100
- Acessibilidade = 100

Já implementado:
- Fontes via `next/font` (zero FOUT, swap)
- Imagens via `next/image` com `sizes` explícito
- `optimizePackageImports` para `lucide-react` e `framer-motion`
- Headers de segurança via `vercel.json`
- `prefers-reduced-motion` honrado em `Stars` e `PhoneMockup`

---

## Assets que faltam fornecer

Os screenshots do app já estão em `public/images/` (extraídos do projeto: telas Início, Carregar, Ranking, Perfil — IMG_7078–7081). **Você ainda precisa fornecer:**

| Arquivo | Tamanho | Onde é usado |
|---|---|---|
| `public/favicon.ico` | 32×32 (multi-size) | Aba do navegador |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/og-image.png` | 1200×630 | Open Graph share preview |
| `public/logo.svg` (opcional) | vetor | Substitui o SVG inline em `Logo.tsx` se quiser logo customizado |
| `public/images/hero-video.mp4` (opcional) | otimizado com `-g 1` | Scroll-driven video do hero (ver abaixo) |

**Logo atual** é um SVG inline em `components/ui/Logo.tsx` (raio estilizado lime). Se você tiver o logo oficial, substitua o SVG pelo seu — mantendo o tamanho 32×32 para o ícone e a wordmark "CNB" do lado.

---

## Recursos comentados / não-ativos

**Wallet adapter Solana** — pacotes (`@solana/wallet-adapter-react` e `-base`) instalados mas não inicializados. Botão "Conectar Carteira" no header está **disabled** com tooltip "Em breve". Para ativar:
1. Crie um `WalletProvider` em `app/[locale]/layout.tsx` envolvendo `{children}`.
2. Substitua o botão disabled em `components/ui/Nav.tsx` pelo `WalletMultiButton` do adapter.
3. Adicione página `/wallet` real (a placeholder atual já está pronta para receber).

**Scroll-driven video no hero** — não implementado. Quando você tiver o vídeo do hero:
1. Otimize com `ffmpeg -i hero.mp4 -g 1 -crf 23 -preset fast hero_otimizado.mp4` (cada frame vira keyframe → seek instantâneo).
2. Coloque em `public/images/hero-video.mp4`.
3. Substitua o conteúdo de `Hero.tsx` para usar `<video>` com `useScroll` + `useMotionValueEvent` controlando `videoRef.currentTime`. Layering: vídeo `z-0` absolute inset-0, overlay `bg-black/60` em `z-10`, conteúdo em `z-20`.

---

## ⚠️ Pendências honestas (LEIA antes do go-live)

Trabalhei do zero seguindo o briefing, mas algumas coisas dependem de decisão sua / asset que eu não consegui buscar:

### 1. Mapeamento do `cnbmobile.com` foi parcial
O `web_fetch` retornou apenas o `<title>` da página (`"CNB Mobile — Carregue o Celular e Ganhe PIX de Verdade"`) e o logo em base64 — o restante do HTML não foi extraível, e a busca não trouxe inner-routes específicas. Por isso, as rotas legais (`/privacidade`, `/termos`, `/suporte`, `/faq`) e o `/wallet` foram criadas com base no que um app brasileiro tipicamente tem.

**Ação:** abra `cnbmobile.com` no navegador, anote toda rota existente e confirme se algo precisa ser adicionado. Se houver algo como `/blog`, `/imprensa`, `/contato`, replicar como em `/suporte/page.tsx`.

### 2. Redes sociais — não inventei
O briefing foi explícito: "Redes sociais extraídas do site atual — não inventar". Como não consegui extrair com confiança, o footer (`components/sections/Footer.tsx`) lê 4 env vars (`NEXT_PUBLIC_TWITTER_URL`, `_TELEGRAM_URL`, `_DISCORD_URL`, `_GITHUB_URL`) e **só renderiza ícones cujas URLs estejam preenchidas**. URLs vazias somem.

**Ação:** preencha no `.env.local` (e no painel da Vercel) com as URLs reais do site atual. Se houver redes que não previ (Instagram, YouTube, LinkedIn), adicione no array `SOCIALS` em `Footer.tsx`.

### 3. Conflito de posicionamento PIX → Solana
O site atual posiciona o produto como **"app que paga PIX por carregar"**. O código do app (em `PROJETO.md` do project knowledge) também usa pontos + saque PIX. Já o briefing pede pivô completo para **DePIN/Solana/CNB tokens** para o hackathon Frontier Colosseum.

**Eu segui o briefing**: o site novo é todo voltado para DePIN/Solana, com tokens CNB no lugar de pontos PIX. Isso pode ser intencional (rebrand para o hackathon) ou um problema (descontinuidade com o app real que está nas lojas).

**Ação:** confirmar a direção. Se quiser **manter PIX em paralelo** (ex: app continua pagando PIX no Brasil, mas o token CNB é o lado on-chain), me avise — dá para adicionar uma seção "PIX cashout" e dual-pitch.

### 4. Endereço da mint do token
Briefing diz "buscar em cnbmobile.com ou deixar placeholder TOKEN_MINT_ADDRESS". Não consegui extrair, então deixei placeholder via env var. Quando lançar, preencha `NEXT_PUBLIC_CNB_MINT_ADDRESS` e os botões Solscan/Jupiter já apontam dinamicamente para o endereço.

### 5. Conteúdo legal real
Páginas `/privacidade` e `/termos` têm placeholder ("Conteúdo legal a ser revisado pelo jurídico antes da publicação"). **Não vou inventar termos jurídicos.** Substitua pelos textos do site atual ou pelos novos textos revisados pelo jurídico.

### 6. Lighthouse não rodado
Não rodei build aqui (sem `node_modules`). Antes de mergear: `npm install && npm run build`, e rode Lighthouse contra `npm run start`. Se algo cair abaixo do target (95/100/100), os culpados mais prováveis são (a) imagens sem `priority` em viewport inicial, (b) Framer Motion bundle — já tem `optimizePackageImports`, mas se ainda pesar, troque por CSS animations onde possível.

---

## Comandos úteis

```bash
npm run dev            # dev server em localhost:3000
npm run build          # build de produção
npm run start          # serve build de produção
npm run lint           # eslint
npm run type-check     # tsc --noEmit
```

---

## Licença

Proprietário — CNB Mobile, 2026.
