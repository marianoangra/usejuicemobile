# Patch CNB Mobile — atualização de identidade visual

Atualizações: logo oficial, screenshots novos do app, botões App Store + Google Play, vocabulário alinhado com o app (kWh, pseudônimo on-chain, DePIN, mainnet ativa).

---

## Como aplicar (3 passos)

### 1) Pare o servidor

No terminal do VS Code onde está rodando o `npm run dev`, aperte `Ctrl + C` (depois `S` se perguntar).

### 2) Cole os arquivos

Este patch tem a mesma estrutura do projeto. Para cada arquivo deste zip, **cole na mesma posição relativa** dentro de `cnbmobile-web`, sobrescrevendo o que existir.

Estrutura do patch:

```
patch/
├── public/images/                 ← Sobrescreve TODOS os PNG de imagens
│   ├── logo.png                   (NOVO — logo oficial)
│   ├── screen-home.png            (substitui)
│   ├── screen-charging.png        (substitui)
│   ├── screen-ranking.png         (substitui)
│   ├── screen-profile.png         (substitui)
│   └── screen-missions.png        (NOVO)
│
├── components/
│   ├── ui/
│   │   ├── Logo.tsx               (substitui — agora usa logo.png)
│   │   ├── Nav.tsx                (substitui — Download App vai pra App Store)
│   │   └── StoreButtons.tsx       (NOVO — botões App Store + Google Play)
│   └── sections/
│       ├── Hero.tsx               (substitui — usa StoreButtons)
│       ├── HowItWorks.tsx         (substitui — usa screen-missions)
│       └── Footer.tsx             (substitui — banner de download)
│
└── messages/
    ├── pt.json                    (substitui)
    ├── en.json                    (substitui)
    └── es.json                    (substitui)
```

**Forma mais fácil:** abre os dois Explorer/Finder lado a lado, arrasta a pasta `public` deste patch pra cima da pasta `cnbmobile-web` → confirma "Substituir tudo". Repete para `components` e `messages`.

**Se preferir VS Code:** abre cada arquivo deste patch, copia tudo, cola sobrescrevendo o arquivo correspondente do projeto. São 11 arquivos.

### 3) Suba o servidor de novo

No terminal:

```
npm run dev
```

Abre `localhost:3000`. Pronto.

Não precisa rodar `npm install` de novo — nenhuma dependência mudou.

---

## O que mudou — visual

- **Logo:** raio branco sobre gradient verde→azul (igual ao ícone do app na App Store/Play Store), substituindo o placeholder lime que tinha antes
- **Wordmark:** "CNB Mobile" com "Mobile" em lime
- **Mockups:** os 5 telefones agora usam screenshots reais da versão atual do app (Home com 120.700 pts e Frontier card, Carregamento com partículas, Missões/desafios, Ranking, Perfil)
- **Botões de download:** App Store + Google Play oficiais, com links reais já configurados:
  - iOS: `https://apps.apple.com/br/app/cnb-mobile/id6762065336`
  - Android: `https://play.google.com/store/apps/details?id=com.cnb.cnbappv2`
- **Hero:** botões de loja substituem o CTA "Baixar App" anterior. CTA secundário "Ver no Solana" virou ghost (mais sutil)
- **Footer:** ganhou um banner destacado com "Baixe o CNB Mobile" antes dos links
- **Nav:** botão "Baixar App" agora vai direto para a App Store (apontamento iOS por padrão)

## O que mudou — texto (vocabulário do app)

Mudanças cirúrgicas, sem quebrar o pitch amplo:

- Hero subtitle agora menciona **"kWh"** e identidade pseudônima on-chain (palavras do app)
- Stats no Hero: "Mainnet ativa", "SPL Token", "**iOS · Android**" (era "Open beta")
- Feature card "Carregamento que rende": descrição agora fala "Cada kWh conta"
- Feature card "Prova on-chain": agora menciona identidade pseudônima via hash on-chain (substituiu "Privacidade ZK" — termo era impreciso, ZK Compression real entra como pilar em /tokenomics).

Nada além disso. O resto do site mantém o pitch DePIN/Solana mais amplo, como você pediu.

## O que NÃO mudei

- Paleta, tipografia, espaçamentos: zero alteração
- Outras seções (Features grid, Hackathon, Token, Waitlist): intactas
- Páginas internas (/token, /hackathon, /faq, /privacidade, /termos, /suporte, /wallet): intactas
- Estrutura de pastas, configs, env vars: intactas

## Próximos pontos de atenção (não bloqueantes)

- Você ainda pode preencher `NEXT_PUBLIC_TWITTER_URL`, `_TELEGRAM_URL`, `_DISCORD_URL`, `_GITHUB_URL` no `.env.local` para os ícones sociais aparecerem no footer
- A logo atualmente está como PNG quadrada (1024×1024). Se você tiver SVG vetorial, troca por `logo.svg` e atualiza `Logo.tsx` para `import` direto — fica mais nítido em qualquer tamanho
- Os links das stores estão hardcoded como fallback dentro do código, mas podem ser sobrescritos via `NEXT_PUBLIC_APP_STORE_URL` e `NEXT_PUBLIC_PLAY_STORE_URL` se precisar testar com builds de staging
