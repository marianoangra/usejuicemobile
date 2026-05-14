// Juice Telegram Bot — Fase 1: FAQ via Claude Haiku
// Recebe mensagens, manda pro Claude com o system prompt do Juice, responde.

import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { Telegraf } from 'telegraf';
import Anthropic from '@anthropic-ai/sdk';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Env validation ────────────────────────────────────────────────────
const {
  TELEGRAM_BOT_TOKEN,
  ANTHROPIC_API_KEY,
  FIREBASE_SA_PATH,
  LOG_LEVEL = 'info',
} = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não definido. Veja .env.example.');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY não definido. Veja .env.example.');
  process.exit(1);
}

// ─── Carrega system prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts', 'system.md'), 'utf8');
console.log(`✓ System prompt carregado (${SYSTEM_PROMPT.length} chars)`);

// ─── Clientes ──────────────────────────────────────────────────────────
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ─── Firebase Admin (persiste conversas no Firestore pro dashboard) ────
// Opcional: se FIREBASE_SA_PATH não está setado ou o arquivo não existe,
// o bot roda normalmente mas não grava nada — só loga warning no boot.
let firestore = null;
if (FIREBASE_SA_PATH) {
  const saPath = isAbsolute(FIREBASE_SA_PATH)
    ? FIREBASE_SA_PATH
    : resolve(__dirname, FIREBASE_SA_PATH);
  if (existsSync(saPath)) {
    try {
      const sa = JSON.parse(readFileSync(saPath, 'utf8'));
      initializeApp({ credential: cert(sa), projectId: sa.project_id });
      firestore = getFirestore();
      console.log(`✓ Firebase Admin conectado (project ${sa.project_id})`);
    } catch (err) {
      console.error('⚠️  Firebase Admin falhou ao iniciar:', err.message);
      console.error('   Bot vai rodar sem persistir conversas no dashboard.');
    }
  } else {
    console.warn(`⚠️  FIREBASE_SA_PATH aponta pra ${saPath} (não existe). Conversas não vão pro dashboard.`);
  }
} else {
  console.warn('⚠️  FIREBASE_SA_PATH não setado. Conversas não vão pro dashboard.');
}

// ─── Rate limit por usuário (anti-abuse) ───────────────────────────────
const userRateLimit = new Map(); // userId -> { count, windowStart }
const RATE_LIMIT = 20;        // máx mensagens
const RATE_WINDOW_MS = 60_000; // por minuto

function isRateLimited(userId) {
  const now = Date.now();
  const r = userRateLimit.get(userId);
  if (!r || (now - r.windowStart) > RATE_WINDOW_MS) {
    userRateLimit.set(userId, { count: 1, windowStart: now });
    return false;
  }
  r.count++;
  return r.count > RATE_LIMIT;
}

// ─── Histórico curto por usuário (memória conversacional) ──────────────
const conversationHistory = new Map(); // userId -> [{ role, content }]
const MAX_HISTORY = 6; // últimos 3 turnos (3 user + 3 assistant)

function getHistory(userId) {
  return conversationHistory.get(userId) || [];
}
function pushHistory(userId, role, content) {
  const h = getHistory(userId);
  h.push({ role, content });
  while (h.length > MAX_HISTORY) h.shift();
  conversationHistory.set(userId, h);
}

// ─── Helpers ───────────────────────────────────────────────────────────
function logInfo(...args) { if (LOG_LEVEL !== 'silent') console.log(new Date().toISOString(), ...args); }
function logError(...args) { console.error(new Date().toISOString(), '❌', ...args); }

// Grava 1 doc por turno (pergunta + resposta) em bot_conversations.
// Fire-and-forget: falha de Firestore nunca derruba a resposta ao usuário.
async function persistirConversa(ctx) {
  if (!firestore) return;
  const log = ctx.state?.juiceLog;
  if (!log?.answer) return;
  const u = ctx.from || {};
  const question = log.question ?? null;
  const isCommand = typeof question === 'string' && question.startsWith('/');
  try {
    await firestore.collection('bot_conversations').add({
      telegramUserId: u.id ?? null,
      telegramUsername: u.username ?? null,
      telegramFirstName: u.first_name ?? null,
      telegramLastName: u.last_name ?? null,
      telegramLanguage: u.language_code ?? null,
      chatId: ctx.chat?.id ?? null,
      chatType: ctx.chat?.type ?? null,
      question,
      answer: log.answer,
      isCommand,
      command: isCommand ? question.split(/\s+/)[0].slice(1).toLowerCase() : null,
      inputTokens: log.usage?.input_tokens ?? null,
      outputTokens: log.usage?.output_tokens ?? null,
      criadoEm: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logError('Firestore persist falhou:', err.message);
  }
}

// Middleware: intercepta o primeiro ctx.reply do turno e dispara persistência.
// Handlers podem setar ctx.state.juiceLog.answer/.usage antes do reply pra
// gravar o texto raw do Claude (sem HTML) e os tokens consumidos.
bot.use(async (ctx, next) => {
  const userText = ctx.message?.text;
  if (firestore && userText) {
    ctx.state.juiceLog = { question: userText, answer: null, usage: null, logged: false };
    const origReply = ctx.reply.bind(ctx);
    ctx.reply = async (text, ...args) => {
      const result = await origReply(text, ...args);
      if (!ctx.state.juiceLog.logged) {
        ctx.state.juiceLog.logged = true;
        if (!ctx.state.juiceLog.answer) ctx.state.juiceLog.answer = String(text);
        persistirConversa(ctx); // fire and forget
      }
      return result;
    };
  }
  await next();
});

// Claude usa markdown padrão (*bold*), Telegram quer formato próprio.
// Converte pra HTML (mais robusto que Markdown legacy do Telegram).
function toTelegramHTML(text) {
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  out = out.replace(/__(.+?)__/g, '<b>$1</b>');
  out = out.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  return out;
}

async function perguntarAoClaude(userId, mensagemUsuario) {
  const history = getHistory(userId);
  const messages = [...history, { role: 'user', content: mensagemUsuario }];

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages,
  });

  const reply = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();

  pushHistory(userId, 'user', mensagemUsuario);
  pushHistory(userId, 'assistant', reply);

  return { reply, usage: response.usage };
}

// ─── Comandos ──────────────────────────────────────────────────────────
bot.start((ctx) => {
  const nome = ctx.from?.first_name || 'amigo';
  return ctx.reply(
    `Fala, ${nome}! 👋\n\n` +
    `Sou o assistente oficial do Juice. Pode mandar suas dúvidas aqui — como funciona o app, como sacar, indicações, token JUICE, qualquer coisa.\n\n` +
    `Comandos rápidos:\n` +
    `/ajuda — menu de tópicos\n` +
    `/saque — como sacar\n` +
    `/indicar — programa de indicações\n` +
    `/token — sobre o JUICE\n` +
    `/humano — falar com a equipe`
  );
});

bot.command('ajuda', (ctx) => {
  return ctx.reply(
    `O que você quer saber?\n\n` +
    `💰 /saque — saques via PIX, mínimo, prazo\n` +
    `👥 /indicar — programa de indicações e bônus\n` +
    `🪙 /token — token JUICE, TGE, supply\n` +
    `⚡ /carregar — como ganhar pontos carregando\n` +
    `🤝 /humano — chamar a equipe humana\n\n` +
    `Ou simplesmente me pergunta qualquer coisa em texto livre.`
  );
});

bot.command('saque', (ctx) => ctx.reply(
  `*Saques via PIX:*\n\n` +
  `• Mínimo: *100.000 pontos*\n` +
  `• Prazo: até *72 horas* após solicitar\n` +
  `• Como: abra o app → aba Perfil → Solicitar saque\n` +
  `• PIX vai cair na chave que você cadastrou\n\n` +
  `Passou de 72 horas sem cair? Manda /humano que aviso a equipe.`,
  { parse_mode: 'Markdown' }
));

bot.command('indicar', (ctx) => ctx.reply(
  `*Programa de indicações:*\n\n` +
  `1. Abre o app → aba *Indicações* → copia seu código\n` +
  `2. Manda pro amigo se cadastrar usando esse código\n` +
  `3. *Ele precisa carregar 1 hora completa* (60 min) pra virar indicação ativa\n\n` +
  `*Bônus:*\n` +
  `• 5 indicações ativas = +50.000 pontos\n` +
  `• Toda vez que um indicado seu saca, você ganha 1% em pontos\n\n` +
  `Lembra: só conta depois de 1 hora completa de carregamento. Antes disso, fica esperando.`,
  { parse_mode: 'Markdown' }
));

bot.command('token', (ctx) => ctx.reply(
  `*Sobre o token JUICE:*\n\n` +
  `• Ainda *não foi lançado* (pré-TGE)\n` +
  `• Quando lançar: *1 ponto vira 1 JUICE*\n` +
  `• Supply fixo: *21 bilhões* de JUICE (como o Bitcoin tem 21 milhões)\n` +
  `• Rede: *Solana*\n\n` +
  `*Data do TGE:* ainda não anunciada oficialmente. Segue @usejuicemobile no Instagram pra ser avisado primeiro.\n\n` +
  `⚠️ Se alguém te oferecer "JUICE" pra comprar agora, é golpe. O token literalmente não existe ainda.`,
  { parse_mode: 'Markdown' }
));

bot.command('carregar', (ctx) => ctx.reply(
  `*Como ganhar pontos:*\n\n` +
  `1. Pluga o celular na tomada\n` +
  `2. Abre o app Juice (precisa estar em primeiro plano, não minimizado)\n` +
  `3. Cada minuto carregando = *10 pontos*\n` +
  `4. Cada hora completa = *+50 pontos de bônus* (total: 650 pts/hora)\n\n` +
  `Tudo registrado on-chain na Solana, dá pra auditar.`,
  { parse_mode: 'Markdown' }
));

bot.command('humano', (ctx) => {
  const u = ctx.from;
  logInfo(`🤝 Pedido humano de @${u?.username || u?.id}:`, ctx.message?.text);
  return ctx.reply(
    `Anotado. A equipe humana vai te responder em até 24h úteis aqui mesmo no Telegram.\n\n` +
    `Se for urgente, manda email pra *suporte@usejuicemobile.com* ou DM em @usejuicemobile no Instagram.`,
    { parse_mode: 'Markdown' }
  );
});

// ─── Handler principal: qualquer texto não-comando ─────────────────────
bot.on('text', async (ctx) => {
  const userId = ctx.from?.id;
  const text = ctx.message?.text?.trim();
  if (!userId || !text) return;
  if (text.startsWith('/')) return; // comandos têm handler próprio

  if (isRateLimited(userId)) {
    return ctx.reply('Calma aí, tô atendendo muita gente. Espera 1 minuto e manda de novo.');
  }

  // Sinaliza "digitando..."
  await ctx.sendChatAction('typing').catch(() => {});

  try {
    const { reply, usage } = await perguntarAoClaude(userId, text);
    logInfo(
      `💬 @${ctx.from.username || userId} (${text.length} chars in / ${reply.length} chars out · ` +
      `tokens: ${usage.input_tokens} in, ${usage.output_tokens} out)`,
    );
    // Dashboard guarda o texto raw do Claude (sem markup HTML) + tokens.
    if (ctx.state.juiceLog) {
      ctx.state.juiceLog.answer = reply;
      ctx.state.juiceLog.usage = usage;
    }
    await ctx.reply(toTelegramHTML(reply), { parse_mode: 'HTML' }).catch(async (err) => {
      logError('Falha no parse HTML, mandando texto plano:', err.message);
      await ctx.reply(reply.replace(/\*\*/g, '').replace(/`/g, ''));
    });
  } catch (err) {
    logError('Erro no Claude:', err.message);
    await ctx.reply(
      'Bug aqui do meu lado — não consegui responder agora. Tenta de novo em alguns segundos ou usa /humano que a equipe responde.',
    );
  }
});

// ─── Inicializa ────────────────────────────────────────────────────────
logInfo('🤖 Bot Juice subindo... (Ctrl+C pra parar)');
bot.launch();
logInfo('✅ Conectado ao Telegram. Manda /start pro seu bot agora.');

// Shutdown limpo
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
