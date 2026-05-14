# Juice Telegram Bot — Fase 1

Bot de FAQ pro Juice no Telegram. Cérebro: Claude Haiku. System prompt versionado em `prompts/system.md`.

## O que ele faz hoje

- Responde dúvidas em texto livre usando o system prompt do Juice
- Comandos rápidos: `/start`, `/ajuda`, `/saque`, `/indicar`, `/token`, `/carregar`, `/humano`
- Mantém **histórico curto** (últimos 3 turnos por usuário) pra conversa fluir
- **Rate limit:** 20 mensagens por usuário por minuto
- Logs em console — `username`, tamanho da pergunta, tokens consumidos

## O que NÃO faz ainda (Fase 2/3)

- Não vê dados específicos do usuário (pontos, saques, indicações). Pra isso precisa de **/vincular** (Fase 3).
- Não responde no WhatsApp (Fase 2).
- Não cria tickets automáticos no `/humano` ainda — só registra no log do servidor.

## Setup local — 5 passos

### 1. Cria o bot no Telegram

1. Abre Telegram → busca **@BotFather**
2. Manda `/newbot`
3. Nome: "Juice Mobile Oficial" (ou similar)
4. Username: termina com `_bot`, tipo `juice_oficial_bot`
5. Copia o token que aparece (longa string com `:` no meio)

### 2. Pega a API key do Claude

1. Acessa **console.anthropic.com**
2. Login (mesmo email da Rafa: contato@rafaelmariano.com.br)
3. Settings → API Keys → **Create Key**
4. Copia (só aparece 1 vez)

### 3. Configura o `.env`

```bash
cd bot
cp .env.example .env
```

Abre `.env` em editor de texto e cola:
```
TELEGRAM_BOT_TOKEN=<token do BotFather>
ANTHROPIC_API_KEY=<key da console.anthropic>
```

### 4. Instala dependências

```bash
npm install
```

### 5. Liga o bot

```bash
npm start
```

Você vai ver:
```
✓ System prompt carregado (5234 chars)
🤖 Bot Juice no ar. Aperta Ctrl+C pra parar.
```

Agora abre o Telegram, procura pelo username do seu bot, manda `/start`. Pronto.

## Como editar o cérebro do bot

Tudo que o bot sabe está em `prompts/system.md`. Pra mudar uma resposta, edita o arquivo e reinicia o bot (`Ctrl+C` e `npm start` de novo).

Ou roda `npm run dev` — usa `--watch` do Node 20+ e reinicia automaticamente quando salva.

## Custo estimado

Claude Haiku: ~US$ 0,001 por pergunta+resposta média. 1.000 perguntas/dia ≈ US$ 1/dia ≈ R$ 5/dia ≈ R$ 150/mês.

Telegram: grátis, ilimitado.

## Quando estiver pronto pra produção

1. **Hospedagem:** sobe num VPS (Hetzner CX11 ~R$ 30/mês) ou Fly.io free tier
2. **PM2 ou systemd** pra manter o processo rodando
3. **Logs centralizados** (`pm2 logs` ou tail no arquivo)
4. **Backup do `.env`** num gerenciador de senha (1Password, Bitwarden)

## Próximas fases

- **Fase 2 (WhatsApp):** adicionar Baileys ou whatsapp-web.js no mesmo backend
- **Fase 3 (vincular conta):** comando `/vincular` que pede email Juice + OTP, depois bot tem acesso a Firestore pra responder com dados do usuário
- **Fase 4 (proativo):** push de notificações quando indicação ativar, saque processar, etc.
