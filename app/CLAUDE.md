# app/ — Juice Mobile (Expo/RN)

> Contexto geral, gotchas e regras de "não fazer sem confirmar" estão no `CLAUDE.md` do root. Este arquivo só adiciona o que é específico do app.

## Identidades

- **Display name:** JUICE
- **Slug Expo:** `cnbmobile`
- **Bundle/package:** `com.cnb.cnbappv2`
- **Scheme:** `com.cnb.cnbappv2`
- **EAS project:** `92b79039-a34d-43b2-b749-140b565e5a4c` (owner: marianoangra)
- **Versão atual:** `1.2.43` (Android versionCode 207, iOS buildNumber 187)
- **iOS ascAppId:** `6762065336`

Ao subir versão: bumpar `version` em `app.json` **e** `android.versionCode` **e** `ios.buildNumber`. Os três precisam subir junto pra cada release.

## Arquitetura

- **`src/screens/`** — uma tela por arquivo, navegação via `@react-navigation/native-stack` + bottom-tabs. Tela mais crítica: `ChargingScreen.js` (consome `useCarregamento`).
- **`src/hooks/useCarregamento.js`** — coração do produto. Detecta charging via `expo-battery`, dispara foreground service via `react-native-background-actions`, conta minutos, fecha sessão e chama `registrarProvasSessao`. Mexer aqui com extremo cuidado.
- **`src/services/`** — Firebase (`firebase.js`), pontos (`pontos.js`), sessão (`session.js`), wallet Solana (`walletService.js`), anti-fraude (`deviceFingerprint.js`, `installReferrer.js`), notificações (`notificacoes.js`), auth social (`authSocial.js` — expo-auth-session + PKCE).
- **`src/context/`** — AuthContext e ThemeContext (tema é dark fixo: `userInterfaceStyle: "dark"`).
- **`src/i18n/{pt,en,es}.json`** — strings traduzidas. Default é pt.

## Plugins Expo customizados

Em `plugins/`:
- `withBackgroundActions.js` — config nativa pro foreground service do charging
- `withIOSFixes.js` — patches específicos do iOS no prebuild

Esses plugins rodam no `expo prebuild`. Se mexer neles, **sempre rodar `npx expo prebuild --clean -p android`** (e ios) depois.

## Cloud Functions (`functions/`)

- Runtime Node 22, ponto de entrada `index.js`.
- **`registrarProvasSessao`** — recebe sessão do app, valida, escreve Memo na Solana mainnet (`anchor-helper.js`), credita pontos no Firestore.
- **`solicitarSaque`** — request de PIX, gera registro pendente em `saques/` collection.
- **`onReferreeBecameActive`** — trigger Firestore: quando um referee atinge 60min, valida (anti-fraude + IP + grafo de referência), credita bônus pro referrer.
- **`cloak-helper.js`** — mascaramento de UID antes de gravar Memo on-chain.
- **`cnb_program_idl.json`** — IDL do programa Anchor (escrito mas não usado em prod ainda — Memo Program é o que tá ativo).
- **`test-devnet.js`** — script standalone pra testar na devnet. **Prod é mainnet.**
- **`sa-key.json`** — service account Firebase Admin, **não commitar** se mexer.

Antes de `firebase deploy --only functions`, **sempre pergunte ao usuário primeiro**.

## Anti-fraude

Não enfraquecer. As regras existem por contexto histórico de abuso:
- `deviceFingerprint.js` gera SHA-256 estável do device (não é PII)
- Limite de 60min antes de ativar referral
- `onReferreeBecameActive` faz traversal do grafo de referrals até 15 níveis pra detectar circular
- IP do referrer vs referee é correlacionado server-side

## Comandos

```bash
npx expo start                                    # dev
npx expo install <pkg>                            # adicionar dependência (depois: regenerar lock — vide root)
npx expo prebuild --clean -p android              # antes de QUALQUER build android
npx expo prebuild --clean -p ios                  # antes de build ios
eas build -p android --profile production         # APK assinado
eas build -p android --profile testflight         # APK de teste
eas build -p ios --profile production
eas submit -p ios --profile production
```

## Tailwind/NativeWind

- `global.css` + `tailwind.config.js`. Importa via `nativewind-env.d.ts`.
- Classes nas props `className` direto nos componentes RN.
- Cor principal de brand: `#00FF7F` (verde Juice, vide config de push notifications).
- Background padrão dark: `#0A0F1E`.

## Não fazer

- **Não trocar `expo-auth-session` por `@react-native-google-signin/google-signin`.** Já tentamos, foi um inferno em prod.
- **Não converter `src/` pra TypeScript** sem alinhar — é trabalho grande e o código atual roda em mãos de 2000 DAU.
- **Não comitar `google-services.json`, `GoogleService-Info.plist`, `sa-key.json`, `credentials.json`**, nem `*.jks`/keystore novos.
- **Não rodar `eas build` sem perguntar** — custa crédito e leva 10-20min.
- **Não mexer em `firestore.rules`/`storage.rules`** sem revisar o impacto em produção.
