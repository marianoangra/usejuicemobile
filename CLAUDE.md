# Juice Mobile

DePIN na Solana que paga usuários por sessões de carregamento de celular verificadas. Pontos viram PIX, cada prova vai pro Solana Mainnet via Memo Program. Brasil-first.

> Nome interno antigo: **CNB / cnbmobile**. Várias referências (pasta, package name, keystore, projeto EAS) ainda usam esse nome — não renomear sem avisar.

## Stack

- **app/** — React Native 0.81 + Expo SDK 54 + NativeWind 4 (Tailwind), Firebase 10 (auth/firestore/functions), Solana via `@solana/web3.js`. Sem TypeScript no código de runtime (`src/` é JS); `tsconfig.json` existe só pra type-check ocasional. React 19.
- **app/functions/** — Firebase Cloud Functions Node 22. Ponto de entrada `index.js`. Funções principais: `registrarProvasSessao` (escreve Memo na Solana), `solicitarSaque` (PIX), `onReferreeBecameActive` (anti-fraude + referral). Anchor IDL em `cnb_program_idl.json`.
- **web/** — Next.js 14 App Router + TypeScript + next-intl (rotas em `[locale]`), Tailwind, Framer Motion. Wallet adapters da Solana. Deploy na Vercel. Inclui `/admin` (dashboard ops em vanilla JS injetado nas páginas Next).

## Layout

```
usejuicemobile/
├── app/
│   ├── src/
│   │   ├── screens/        # 20 telas, uma por arquivo (HomeScreen.js, ChargingScreen.js, etc)
│   │   ├── services/       # firebase, walletService, session, pontos, deviceFingerprint, analytics, notificacoes...
│   │   ├── hooks/          # useCarregamento (lógica core de charging), useScreenTrace
│   │   ├── context/        # auth, theme
│   │   ├── components/
│   │   ├── i18n/           # pt, en, es
│   │   ├── theme/
│   │   └── utils/
│   ├── functions/          # Cloud Functions (Node 22)
│   ├── android/            # GERADO — não editar à mão, vide gotcha abaixo
│   ├── plugins/            # Expo config plugins custom
│   ├── app.json, eas.json
│   └── google-services.json  # gitignored, manter local
└── web/
    ├── app/
    │   ├── [locale]/       # páginas i18n (pt/en/es)
    │   ├── api/            # active-users, total-minutes
    │   └── layout.tsx, opengraph-image.tsx, sitemap.ts
    ├── components/
    ├── i18n/, messages/    # next-intl
    └── middleware.ts       # locale routing
```

## Comandos comuns

### app (Expo)
```bash
cd app
npm install
npx expo start                          # dev server
npx expo prebuild --clean -p android    # SEMPRE antes de buildar android (vide gotcha)
eas build -p android --profile production
eas build -p ios --profile production
eas build -p android --profile testflight   # apk de teste
```

### web (Next.js)
```bash
cd web
npm install
npm run dev          # localhost:3000
npm run build
npm run type-check   # tsc --noEmit
npm run lint
```

### functions
```bash
cd app/functions
firebase deploy --only functions
firebase deploy --only functions:registrarProvasSessao   # função única
```

## Gotchas críticos deste repo

1. **`app/android/` fica stale.** Toda vez que mexer em `app.json`, plugins, ou dependências nativas, rode `npx expo prebuild --clean -p android` antes de buildar. Não confiar no estado atual da pasta `android/`.

2. **`google-services.json` está no `.gitignore`** — mantenha sempre o local atualizado; pull novo da Firebase Console se sumir. Idem `GoogleService-Info.plist`.

3. **`package-lock.json` precisa ser regenerado depois de `expo install`.** Meu npm local (v11) gera lock que o npm 10 do EAS recusa. Depois de qualquer `expo install`/`npm install`, rodar:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
   Senão `eas build` falha com erro de lockfile.

4. **Google Sign-In usa `expo-auth-session` com code + PKCE.** A lib nativa `@react-native-google-signin/google-signin` foi tentada antes e dá problema em prod. Não trocar — ver `src/services/authSocial.js`.

5. **Keystores estão no repo (`*.jks`).** Não comitar nova versão sem confirmar — production signing depende deles. `credentialsSource: "local"` no eas.json android production.

6. **App "name" no package.json é `cnbmobile2`**, EAS project, keystore, e várias chaves de Firebase Analytics ainda referenciam CNB. Mudar com cuidado, ou nunca.

## Convenções

- **JS no app/, TS no web/.** Não converter `app/src/` pra TS sem pedir — é trabalho grande e o código atual funciona.
- **NativeWind para estilo no app**, Tailwind no web. Sem styled-components/StyleSheet novos.
- **Idioma:** comentários e variáveis em inglês quando possível, mas vários nomes existentes estão em português (`solicitarSaque`, `registrarProvasSessao`, `pontos`, `carregamento`). Manter consistência com o arquivo onde estiver editando.
- **i18n:** strings novas no app vão em `src/i18n/{pt,en,es}.json`. No web, em `messages/{pt,en,es}.json`.
- **Solana:** Memo Program é o coração da prova on-chain. Ver `functions/anchor-helper.js`. Mainnet, não devnet (devnet só em `test-devnet.js`).

## Não fazer sem confirmar

- **`eas build`, `expo run:android`, `gradlew assemble*` ou qualquer build pesado.** Sempre pergunta antes — builds custam crédito EAS e tempo.
- **Deploy de cloud functions em produção.** Pergunta antes de `firebase deploy`.
- **Mexer em Firestore Security Rules** (`firestore.rules`, `storage.rules`) sem revisar o impacto.
- **Renomear `cnbmobile` → `juice`** em larga escala (package.json, EAS project ID, etc).
- **Push notifications de teste no app de produção.** Tem milhares de usuários ativos.

## Contexto de negócio

- **MAU 7.6k, DAU ~2k**, app de produção real. Não é protótipo.
- **Hackathon Colosseum 2025** em curso — vide `PITCH.md`.
- **`/admin` no web é o dashboard ops** (saques, compras, banner, push, analytics). MVP em vanilla JS injetado, não componentes React separados.
- Estratégia futura: **boost network** (engagement-as-a-service pra outros projetos Solana). Schema do dashboard já preparado pra campanhas.

## Links

- Produção: https://usejuicemobile.com
- Firebase: projeto `cnbmobile` (legacy name)
- Solscan amostra: tx `2Bkui44aPDVC5TdF3mg8RsytKQWmEzXcABVKA6kiZSzdreeZUP4K6q7Za53YYYvR73Bj9hj1ihbcVDdbMsPwao8y`
