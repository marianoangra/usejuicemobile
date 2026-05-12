const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { acumularPontosOnChain, tentarResgatarTokensOnChain } = require('./anchor-helper');
const { resgatarPontosPrivado, PONTOS_POR_BLOCO } = require('./cloak-helper');

initializeApp();

const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');
const solanaPrivateKey = defineSecret('SOLANA_PRIVATE_KEY');
const testerSecret = defineSecret('TESTER_SECRET');
const adminUids = defineString('ADMIN_UIDS', { default: 'X619NYBpp5OqXKTBomuFTISuQGY2' });

// Escapa caracteres HTML para prevenir HTML injection em emails
function escHtml(str) {
  return String(str ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DESTINATARIO = 'contato@rafaelmariano.com.br';

// ─── Notificação de saque por email ──────────────────────────────────────────
exports.notificarSaque = onDocumentCreated(
  {
    document: 'saques/{saqueId}',
    secrets: [smtpUser, smtpPass],
    region: 'us-central1',
  },
  async (event) => {
    const saque = event.data?.data();
    if (!saque) return;

    const { nome, chavePix, pontos, uid, criadoEm } = saque;

    const data = criadoEm?.toDate
      ? criadoEm.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const saqueId = event.params.saqueId;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser.value(),
        pass: smtpPass.value(),
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00FF88; background: #0A0F1E; padding: 20px; border-radius: 8px;">
          ⚡ Nova Solicitação de Saque — Juice Mobile
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold; width: 40%;">ID do Saque</td>
            <td style="padding: 10px;">${escHtml(saqueId)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">UID do Usuário</td>
            <td style="padding: 10px;">${escHtml(uid)}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Nome Completo</td>
            <td style="padding: 10px;">${escHtml(nome)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Chave PIX</td>
            <td style="padding: 10px; font-size: 16px; color: #333;">${escHtml(chavePix)}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Pontos Solicitados</td>
            <td style="padding: 10px; font-size: 18px; font-weight: bold; color: #00AA55;">
              ${Number(pontos ?? 0).toLocaleString('pt-BR')} pontos
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Data/Hora</td>
            <td style="padding: 10px;">${escHtml(data)}</td>
          </tr>
        </table>
        <p style="margin-top: 24px; color: #666; font-size: 13px;">
          Acesse o <a href="https://console.firebase.google.com/project/cnbmobile-2053c/firestore/data/saques">Firebase Console</a>
          para ver todos os saques pendentes.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Juice Mobile" <${smtpUser.value()}>`,
      to: DESTINATARIO,
      subject: `💰 Novo saque: ${nome ?? uid} — ${Number(pontos ?? 0).toLocaleString('pt-BR')} pontos`,
      html,
    });

    console.log(`Notificação enviada para ${DESTINATARIO} — saque ${saqueId}`);
  }
);

// ─── Notificação de SOLICITAÇÃO de compra de pontos ─────────────────────────
// Disparada quando o cliente toca "copiar chave PIX" no BuyTokensScreen.
// Email deixa explícito que é uma SOLICITAÇÃO (aguardando comprovante PIX).
exports.notificarSolicitacaoCompra = onDocumentCreated(
  {
    document: 'solicitacoes_compra/{id}',
    secrets: [smtpUser, smtpPass],
    region: 'us-central1',
  },
  async (event) => {
    const sol = event.data?.data();
    if (!sol) return;

    const { nome, email, valorBRL, cnbCalculado, uid, criadoEm } = sol;
    const id = event.params.id;
    const data = criadoEm?.toDate
      ? criadoEm.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const valorBRLFmt = Number(valorBRL ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const cnbFmt = Number(cnbCalculado ?? 0).toLocaleString('pt-BR');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: smtpUser.value(), pass: smtpPass.value() },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c6ff4a; background: #0A0F1E; padding: 20px; border-radius: 8px;">
          🛒 Nova SOLICITAÇÃO de compra de pontos
        </h2>
        <p style="background: #fff8e1; border-left: 4px solid #f5a623; padding: 12px; margin: 16px 0; color: #5d4e00;">
          <strong>Status:</strong> Aguardando pagamento via PIX. Aguarde o comprovante por e-mail antes de creditar os pontos.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;width:35%;">ID</td><td style="padding:10px;">${escHtml(id)}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Cliente</td><td style="padding:10px;">${escHtml(nome)}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;">UID</td><td style="padding:10px;font-family:monospace;font-size:11px;">${escHtml(uid)}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">E-mail</td><td style="padding:10px;">${escHtml(email)}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;">Valor (R$)</td><td style="padding:10px;font-size:16px;font-weight:bold;">R$ ${escHtml(valorBRLFmt)}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Pontos solicitados</td><td style="padding:10px;font-size:18px;font-weight:bold;color:#00AA55;">${escHtml(cnbFmt)} pontos Juice</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;">Data/Hora</td><td style="padding:10px;">${escHtml(data)}</td></tr>
        </table>
        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          Para creditar manualmente após confirmação:
          <a href="https://console.firebase.google.com/project/cnbmobile-2053c/firestore/data/usuarios/${escHtml(uid)}">Firestore → usuarios/${escHtml(uid)}</a>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Juice Mobile" <${smtpUser.value()}>`,
      to: DESTINATARIO,
      subject: `🛒 Solicitação de compra: ${nome ?? uid} — R$ ${valorBRLFmt}`,
      html,
    });

    console.log(`[Solicitação] enviada para ${DESTINATARIO} — ${id}`);
  }
);

// ─── Notificação de novo lead na lista de espera ────────────────────────────
// Disparada quando o site (cnbmobile.com) insere um doc em /leads.
exports.notificarNovoLead = onDocumentCreated(
  {
    document: 'leads/{leadId}',
    secrets: [smtpUser, smtpPass],
    region: 'us-central1',
  },
  async (event) => {
    const lead = event.data?.data();
    if (!lead) return;

    const { email, locale, source } = lead;
    const id = event.params.leadId;
    const data = lead.createdAt?.toDate
      ? lead.createdAt.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Total de leads acumulados na fila
    const db = getFirestore();
    let total = 0;
    try {
      const countSnap = await db.collection('leads').count().get();
      total = countSnap.data().count;
    } catch {}

    const localeFlag = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' }[locale] || '🌐';

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: smtpUser.value(), pass: smtpPass.value() },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c6ff4a; background: #0A0F1E; padding: 20px; border-radius: 8px;">
          ✉️ Novo lead na lista de espera Juice
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;width:30%;">E-mail</td><td style="padding:10px;font-size:16px;"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Idioma</td><td style="padding:10px;">${localeFlag} ${escHtml(locale)}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;">Origem</td><td style="padding:10px;">${escHtml(source)}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Data/Hora</td><td style="padding:10px;">${escHtml(data)}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;">Total na fila</td><td style="padding:10px;font-size:16px;font-weight:bold;color:#00AA55;">${total} ${total === 1 ? 'lead' : 'leads'}</td></tr>
        </table>
        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          Ver lista completa:
          <a href="https://console.firebase.google.com/project/cnbmobile-2053c/firestore/data/~2Fleads">Firestore → /leads</a>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Juice Mobile" <${smtpUser.value()}>`,
      to: DESTINATARIO,
      subject: `✉️ Novo lead: ${email}${total > 0 ? ` (#${total})` : ''}`,
      html,
    });

    console.log(`[Lead] notificação enviada para ${DESTINATARIO} — ${id}`);
  }
);

// ─── Registro de lead com rate limiting por IP ───────────────────────────────
// Substitui escrita direta do client em /leads (bloqueada nas Firestore rules).
// Rate limit: máx 3 submissões por IP a cada 10 minutos.
exports.registrarLead = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ ok: false, reason: 'method_not_allowed' }); return; }

    const { email, locale, source } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
      email.length < 6 || email.length > 200
    ) { res.status(400).json({ ok: false, reason: 'invalid_email' }); return; }

    if (!['pt', 'en', 'es'].includes(locale)) { res.status(400).json({ ok: false, reason: 'invalid_locale' }); return; }

    if (typeof source !== 'string' || source.length > 50) { res.status(400).json({ ok: false, reason: 'invalid_source' }); return; }

    const db = getFirestore();
    const ipRaw = req.headers['x-forwarded-for'] ?? req.ip ?? '';
    const ip = ipRaw.split(',')[0].trim();
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Rate limit: máx 3 por IP a cada 10 min
    const rlRef = db.doc(`rate_limit/lead_${ipHash}`);
    const JANELA_MS = 10 * 60 * 1000;
    const LIMITE = 3;

    try {
      await db.runTransaction(async (tx) => {
        const rlSnap = await tx.get(rlRef);
        const agora = Date.now();
        const rl = rlSnap.exists ? rlSnap.data() : { count: 0, windowStart: agora };
        const emJanela = (agora - rl.windowStart) < JANELA_MS;
        const count = emJanela ? rl.count : 0;
        const windowStart = emJanela ? rl.windowStart : agora;
        if (count >= LIMITE) throw Object.assign(new Error('rate_limit'), { code: 429 });
        tx.set(rlRef, { count: count + 1, windowStart });
      });
    } catch (e) {
      if (e.code === 429) { res.status(429).json({ ok: false, reason: 'rate_limit' }); return; }
      throw e;
    }

    const emailNorm = email.toLowerCase().trim();
    const leadRef = db.collection('leads').doc(emailNorm);
    const snap = await leadRef.get();
    if (snap.exists) { res.status(200).json({ ok: true, existing: true }); return; }

    await leadRef.set({ email: emailNorm, locale, source, createdAt: new Date() });
    res.status(200).json({ ok: true });
  }
);

// ─── Registro na waitlist JUICE com rate limiting por IP ─────────────────────
// Substitui escrita direta do client em /juice_waitlist.
// Rate limit: máx 3 submissões por IP a cada 10 minutos.
exports.registrarWaitlist = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ ok: false, reason: 'method_not_allowed' }); return; }

    const { email, locale, source, walletAddress, walletSolana, uid: uidParam, pontosApp, juiceEstimado } = req.body ?? {};
    const wallet = walletAddress ?? walletSolana ?? null; // app usa walletSolana, web usa walletAddress

    if (
      typeof email !== 'string' ||
      !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
      email.length < 6 || email.length > 200
    ) { res.status(400).json({ ok: false, reason: 'invalid_email' }); return; }

    if (!['pt', 'en', 'es'].includes(locale)) { res.status(400).json({ ok: false, reason: 'invalid_locale' }); return; }

    if (typeof source !== 'string' || source.length > 50) { res.status(400).json({ ok: false, reason: 'invalid_source' }); return; }

    if (wallet != null && (typeof wallet !== 'string' || wallet.length > 100)) {
      res.status(400).json({ ok: false, reason: 'invalid_wallet' }); return;
    }

    if (uidParam != null && (typeof uidParam !== 'string' || uidParam.length > 100)) {
      res.status(400).json({ ok: false, reason: 'invalid_uid' }); return;
    }

    const db = getFirestore();
    const ipRaw = req.headers['x-forwarded-for'] ?? req.ip ?? '';
    const ip = ipRaw.split(',')[0].trim();
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Rate limit: máx 3 por IP a cada 10 min (compartilha namespace com leads)
    const rlRef = db.doc(`rate_limit/waitlist_${ipHash}`);
    const JANELA_MS = 10 * 60 * 1000;
    const LIMITE = 3;

    try {
      await db.runTransaction(async (tx) => {
        const rlSnap = await tx.get(rlRef);
        const agora = Date.now();
        const rl = rlSnap.exists ? rlSnap.data() : { count: 0, windowStart: agora };
        const emJanela = (agora - rl.windowStart) < JANELA_MS;
        const count = emJanela ? rl.count : 0;
        const windowStart = emJanela ? rl.windowStart : agora;
        if (count >= LIMITE) throw Object.assign(new Error('rate_limit'), { code: 429 });
        tx.set(rlRef, { count: count + 1, windowStart });
      });
    } catch (e) {
      if (e.code === 429) { res.status(429).json({ ok: false, reason: 'rate_limit' }); return; }
      throw e;
    }

    const emailNorm = email.toLowerCase().trim();
    const ref = db.collection('juice_waitlist').doc(emailNorm);
    const snap = await ref.get();

    // Recusa uids obviamente fake (test, dummy, fake, sample) — só vieram via curl manual
    const uidLimpo = (uidParam && /^(test|dummy|fake|sample)/i.test(uidParam.trim())) ? null : uidParam;

    if (snap.exists) {
      // Merge: atualiza só os campos que vieram mais ricos do que estavam.
      const prev = snap.data() ?? {};
      const update = {};
      if (wallet && wallet !== prev.walletAddress) update.walletAddress = wallet;
      if (uidLimpo && uidLimpo !== prev.uid) update.uid = uidLimpo;
      if (typeof pontosApp === 'number' && pontosApp > (prev.pontosApp ?? 0)) update.pontosApp = pontosApp;
      if (typeof juiceEstimado === 'number' && juiceEstimado > (prev.juiceEstimado ?? 0)) update.juiceEstimado = juiceEstimado;
      if (locale && locale !== prev.locale) update.locale = locale;

      if (Object.keys(update).length > 0) {
        update.updatedAt = new Date();
        await ref.update(update);
        res.status(200).json({ ok: true, existing: true, updated: true, fields: Object.keys(update) });
        return;
      }
      res.status(200).json({ ok: true, existing: true, updated: false });
      return;
    }

    const data = { email: emailNorm, locale, source, createdAt: new Date() };
    if (wallet) data.walletAddress = wallet;
    if (uidLimpo) data.uid = uidLimpo;
    if (typeof pontosApp === 'number') data.pontosApp = pontosApp;
    if (typeof juiceEstimado === 'number') data.juiceEstimado = juiceEstimado;

    await ref.set(data);
    res.status(200).json({ ok: true });
  }
);

// ─── 1% de comissão para o indicador quando o indicado faz um saque ─────────
// Ex: saque de 100.000 pts → indicador recebe +1.000 pts automaticamente.
exports.processarComissaoSaque = onDocumentCreated(
  { document: 'saques/{saqueId}', region: 'us-central1' },
  async (event) => {
    const saque = event.data?.data();
    if (!saque) return;

    const { uid, pontos } = saque;
    if (!uid || !pontos) return;

    const db = getFirestore();
    const userSnap = await db.doc(`usuarios/${uid}`).get();
    if (!userSnap.exists) return;

    const referidoPor = userSnap.data().referidoPor;
    if (!referidoPor) return;

    const comissao = Math.floor(pontos * 0.01);
    if (comissao < 1) return;

    await db.doc(`usuarios/${referidoPor}`).update({
      pontos: FieldValue.increment(comissao),
    });

    console.log(`Comissão: +${comissao} pts → ${referidoPor} (saque de ${uid}: ${pontos} pts)`);
  }
);

// ─── Creditar indicador quando novo usuário aplica um código ─────────────────
// Dispara ao criar referral_events/{uid} (via processarIndicacao no cliente).
// Usa Admin SDK — bypassa regras do Firestore.
// IMPORTANTE: sem secrets no config para garantir que a função seja implantada
// mesmo que SOLANA_PRIVATE_KEY não esteja configurado no Secret Manager.
// A prova on-chain de indicações é feita separadamente via referrals_onchain
// quando o secret estiver disponível.
exports.onReferralCreated = onDocumentCreated(
  { document: 'referral_events/{uid}', region: 'us-central1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { referrerUid } = data;
    const newUserUid = event.params.uid;

    if (!referrerUid || referrerUid === newUserUid) return;

    const db = getFirestore();

    // Verifica se o indicador existe antes de creditar
    const referrerSnap = await db.doc(`usuarios/${referrerUid}`).get();
    if (!referrerSnap.exists) {
      console.warn(`Indicador ${referrerUid} não encontrado. Evento ignorado.`);
      await event.data.ref.delete();
      return;
    }

    // Credita +100 pts ao indicador
    await db.doc(`usuarios/${referrerUid}`).update({
      pontos: FieldValue.increment(100),
      referidos: FieldValue.increment(1),
    });

    // Deleta o evento após processar (coleção é efêmera)
    await event.data.ref.delete();

    console.log(`Indicação processada: ${newUserUid} → ${referrerUid} (+100 pts)`);
  }
);

// ─── Bônus de milestone: 50k pts por 5 indicações ativas, 100k por 10 ──────
// "Ativa" = indicado com minutos >= 60 (1 hora real de carregamento).
// SEGURANÇA: valida device hash, IP hash e cadeia circular de indicações.
// Idempotência: contadoComoAtivo no indicado impede recontagem;
// bonus5kGranted/bonus10kGranted no indicador impedem duplo crédito.

// Detecta referral circular: percorre a cadeia referidoPor até MAX_DEPTH.
// Retorna true se o uid do indicado aparecer na cadeia (fraude em anel).
async function detectarReferralCircular(db, refereeUid, referrerUid, maxDepth = 15) {
  const visitados = new Set([refereeUid]);
  let currentUid = referrerUid;
  for (let i = 0; i < maxDepth; i++) {
    if (!currentUid) break;
    if (visitados.has(currentUid)) return true; // ciclo detectado
    visitados.add(currentUid);
    try {
      const snap = await db.doc(`usuarios/${currentUid}`).get();
      if (!snap.exists) break;
      currentUid = snap.data().referidoPor ?? null;
    } catch { break; }
  }
  return false;
}

exports.onReferreeBecameActive = onDocumentUpdated(
  { document: 'usuarios/{uid}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data();
    const after  = event.data?.after?.data();
    if (!before || !after) return;

    const minutosBefore = before.minutos ?? 0;
    const minutosAfter  = after.minutos  ?? 0;

    // MUDANÇA: threshold elevado de 3 → 60 minutos (1h de uso real obrigatório)
    const MINUTOS_PARA_ATIVAR = 60;
    if (minutosBefore >= MINUTOS_PARA_ATIVAR || minutosAfter < MINUTOS_PARA_ATIVAR) return;

    const referidoPor = after.referidoPor;
    if (!referidoPor) return;
    if (after.contadoComoAtivo === true) return;

    const refereeUid = event.params.uid;
    const db = getFirestore();
    const refereeRef  = db.doc(`usuarios/${refereeUid}`);
    const referrerRef = db.doc(`usuarios/${referidoPor}`);

    // ── Verificação anti-fraude 1: conta banida/suspeita não conta ────────────
    if (after.contaBanida === true || after.contaSuspeita === true) {
      console.warn(`[AntiF] Indicado ${refereeUid} está banido/suspeito. Ignorando ativação.`);
      await refereeRef.update({ contadoComoAtivo: true }); // marca para não reprocessar
      return;
    }

    // ── Verificação anti-fraude 2: referral circular (anel de contas) ────────
    const ehCircular = await detectarReferralCircular(db, refereeUid, referidoPor);
    if (ehCircular) {
      console.warn(`[AntiF] Referral circular detectado: ${refereeUid} → ${referidoPor}. Bloqueado.`);
      await refereeRef.update({
        contadoComoAtivo: true,
        fraudeDetectada: 'referral_circular',
        saquesBloqueados: true,
        contaSuspeita: true,
        motivoBloqueio: 'Identificamos que sua conta faz parte de uma rede de indicações circulares — contas que se indicam mutuamente para acumular bônus artificialmente. Essa prática não é permitida e os saques foram bloqueados preventivamente.',
      });
      return;
    }

    // ── Verificação anti-fraude 3: mesmo device hash que o indicador ─────────
    const referrerSnap0 = await referrerRef.get();
    if (referrerSnap0.exists) {
      const referrerData0 = referrerSnap0.data();

      // Banido não pode receber bônus de indicação
      if (referrerData0.contaBanida === true) {
        console.warn(`[AntiF] Indicador ${referidoPor} está banido. Ignorando ativação.`);
        await refereeRef.update({ contadoComoAtivo: true });
        return;
      }

      const refereeDevice   = after.deviceHash ?? null;
      const referrerDevice  = referrerData0.deviceHash ?? null;
      const refereeIp       = after.ipHash ?? null;
      const referrerIp      = referrerData0.ipHash ?? null;

      // Mesmo dispositivo físico → fraude
      if (refereeDevice && referrerDevice && refereeDevice === referrerDevice) {
        console.warn(`[AntiF] Mesmo deviceHash: ${refereeUid} e ${referidoPor}. Bloqueado.`);
        await refereeRef.update({
          contadoComoAtivo: true,
          fraudeDetectada: 'mesmo_dispositivo',
          saquesBloqueados: true,
          contaSuspeita: true,
          motivoBloqueio: 'Identificamos que sua conta e a conta de quem te indicou foram usadas no mesmo dispositivo. Criar múltiplas contas no mesmo aparelho não é permitido e os saques foram bloqueados preventivamente.',
        });
        return;
      }

      // Mesmo IP → sinaliza suspeita mas não bloqueia (pode ser família)
      if (refereeIp && referrerIp && refereeIp === referrerIp) {
        console.warn(`[AntiF] Mesmo ipHash: ${refereeUid} e ${referidoPor}. Marcando suspeita.`);
        await refereeRef.update({ ipCoincide: true });
        // Continua mas não bloqueia — IP compartilhado pode ser legítimo (residência, roteador)
      }
    }

    // ── Transação: credita bônus ao indicador ─────────────────────────────────
    try {
      await db.runTransaction(async (t) => {
        const refereeSnap  = await t.get(refereeRef);
        if (!refereeSnap.exists) return;
        const refereeData = refereeSnap.data();
        if (refereeData.contadoComoAtivo === true) return;
        if ((refereeData.minutos ?? 0) < MINUTOS_PARA_ATIVAR) return;
        if (refereeData.contaBanida === true || refereeData.contaSuspeita === true) {
          t.update(refereeRef, { contadoComoAtivo: true });
          return;
        }

        const referrerSnap = await t.get(referrerRef);
        if (!referrerSnap.exists) {
          t.update(refereeRef, { contadoComoAtivo: true });
          return;
        }
        const referrerData = referrerSnap.data();
        if (referrerData.contaBanida === true) {
          t.update(refereeRef, { contadoComoAtivo: true });
          return;
        }

        const ativasDepois = (referrerData.indicacoesAtivas ?? 0) + 1;

        const update = { indicacoesAtivas: FieldValue.increment(1) };
        let bonus = 0;
        let log = '';
        if (ativasDepois >= 5 && !referrerData.bonus5kGranted) {
          bonus += 50000;
          update.bonus5kGranted = true;
          log += ' +50k (5 ativas)';
        }
        if (ativasDepois >= 10 && !referrerData.bonus10kGranted) {
          bonus += 100000;
          update.bonus10kGranted = true;
          log += ' +100k (10 ativas)';
        }
        if (bonus > 0) update.pontos = FieldValue.increment(bonus);

        t.update(refereeRef, { contadoComoAtivo: true });
        t.update(referrerRef, update);

        console.log(`Ativa: ${refereeUid} → ${referidoPor} (ativas=${ativasDepois})${log}`);
      });
    } catch (err) {
      console.error(`Erro em onReferreeBecameActive ${refereeUid} → ${referidoPor}:`, err);
    }
  }
);

// ─── Atualiza stats/public para o dashboard ───────────────────────────────────
// Roda a cada hora e agrega dados de todas as coleções.
exports.atualizarStatsDashboard = onSchedule(
  { schedule: 'every 60 minutes', region: 'us-central1' },
  async () => {
    const db = getFirestore();

    const [
      usersCount,
      saquesCount,
      referralsCount,
      provasCount,
      resgatesSnap,
      usuariosSnap,
    ] = await Promise.all([
      db.collection('usuarios').count().get(),
      db.collection('saques').count().get(),
      db.collection('referrals_onchain').count().get(),
      db.collection('provas_onchain').count().get(),
      db.collection('resgates_cnb').get(),
      db.collection('usuarios').select('minutos', 'pontos').get(),
    ]);

    let totalCNBDistribuidos = 0;
    let totalResgateCNB = resgatesSnap.size;
    resgatesSnap.forEach(d => { totalCNBDistribuidos += d.data().quantidade ?? 0; });

    let totalMinutos = 0;
    let totalPontos = 0;
    usuariosSnap.forEach(d => {
      totalMinutos += d.data().minutos ?? 0;
      totalPontos += d.data().pontos ?? 0;
    });

    await db.collection('stats').doc('public').set({
      totalUsuarios: usersCount.data().count,
      totalCNBDistribuidos,
      totalResgateCNB,
      totalSaquesPIX: saquesCount.data().count,
      totalIndicacoes: referralsCount.data().count,
      diasAtividade: provasCount.data().count,
      totalMinutos,
      totalPontos,
      atualizadoEm: FieldValue.serverTimestamp(),
    });

    console.log('[Stats] Dashboard atualizado.');
  }
);

// ─── Relatório semanal por e-mail ────────────────────────────────────────────
// Toda segunda-feira às 08:00 horário de Brasília, envia um resumo da semana.
exports.relatorioSemanal = onSchedule(
  {
    schedule: '0 8 * * 1',
    timeZone: 'America/Sao_Paulo',
    secrets: [smtpUser, smtpPass],
    region: 'us-central1',
  },
  async () => {
    const db = getFirestore();

    // Últimos 7 dias de provas on-chain
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const provasSnap = await db.collection('provas_onchain')
      .where('criadoEm', '>=', seteDiasAtras)
      .orderBy('criadoEm', 'asc')
      .get();

    let totalUsuariosAtivos = 0;
    let totalPontos = 0;
    let totalMinutos = 0;
    let diasComAtividade = 0;
    let linhasDias = '';

    provasSnap.forEach(doc => {
      const d = doc.data();
      totalUsuariosAtivos = Math.max(totalUsuariosAtivos, d.activeUsers ?? 0);
      totalPontos += d.totalPoints ?? 0;
      totalMinutos += d.totalMinutes ?? 0;
      diasComAtividade++;
      linhasDias += `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #1a2a1a;">${d.date ?? doc.id}</td>
          <td style="padding:8px;border-bottom:1px solid #1a2a1a;text-align:center;">${(d.activeUsers ?? 0).toLocaleString('pt-BR')}</td>
          <td style="padding:8px;border-bottom:1px solid #1a2a1a;text-align:center;">${(d.totalPoints ?? 0).toLocaleString('pt-BR')}</td>
          <td style="padding:8px;border-bottom:1px solid #1a2a1a;text-align:center;">${(d.totalMinutes ?? 0).toLocaleString('pt-BR')}</td>
          <td style="padding:8px;border-bottom:1px solid #1a2a1a;font-size:11px;">
            <a href="${d.solscanUrl ?? '#'}" style="color:#00FF88;">ver ◎</a>
          </td>
        </tr>`;
    });

    // Total de usuários cadastrados
    const totalUsersSnap = await db.collection('usuarios').count().get();
    const totalUsuarios = totalUsersSnap.data().count ?? 0;

    // Total de saques da semana
    const saquesSnap = await db.collection('saques')
      .where('criadoEm', '>=', seteDiasAtras)
      .get();
    const totalSaques = saquesSnap.size;

    // Resgates CNB da semana
    const resgatesSnap = await db.collection('resgates_cnb')
      .where('criadoEm', '>=', seteDiasAtras)
      .get();
    const totalResgatesCNB = resgatesSnap.size;
    let totalCNBEnviado = 0;
    resgatesSnap.forEach(d => { totalCNBEnviado += d.data().quantidade ?? 0; });

    const semanaStr = `${seteDiasAtras.toLocaleDateString('pt-BR')} – ${new Date().toLocaleDateString('pt-BR')}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;background:#0A0F1E;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0d1f0d;padding:28px 32px;border-bottom:2px solid #00FF88;">
          <h1 style="margin:0;color:#00FF88;font-size:22px;">⚡ Juice Mobile — Relatório Semanal</h1>
          <p style="margin:6px 0 0;color:#8a9a8a;font-size:14px;">${semanaStr}</p>
        </div>
        <div style="padding:28px 32px;">

          <div style="display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap;">
            <div style="flex:1;min-width:140px;background:#0d1f0d;border-radius:10px;padding:16px;border:1px solid #00FF88;">
              <div style="font-size:11px;color:#8a9a8a;margin-bottom:4px;">USUÁRIOS TOTAIS</div>
              <div style="font-size:28px;font-weight:bold;color:#00FF88;">${totalUsuarios.toLocaleString('pt-BR')}</div>
            </div>
            <div style="flex:1;min-width:140px;background:#0d0d20;border-radius:10px;padding:16px;border:1px solid #9945FF;">
              <div style="font-size:11px;color:#8a9a8a;margin-bottom:4px;">JUICE ENVIADOS</div>
              <div style="font-size:28px;font-weight:bold;color:#9945FF;">◎ ${totalCNBEnviado.toLocaleString('pt-BR')}</div>
            </div>
            <div style="flex:1;min-width:140px;background:#1a1200;border-radius:10px;padding:16px;border:1px solid #FFB800;">
              <div style="font-size:11px;color:#8a9a8a;margin-bottom:4px;">SAQUES PIX</div>
              <div style="font-size:28px;font-weight:bold;color:#FFB800;">${totalSaques}</div>
            </div>
          </div>

          <h3 style="color:#00FF88;margin-bottom:12px;">Atividade diária on-chain</h3>
          ${diasComAtividade > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#0d1f0d;color:#8a9a8a;">
                <th style="padding:8px;text-align:left;">Data</th>
                <th style="padding:8px;">Usuários</th>
                <th style="padding:8px;">Pontos</th>
                <th style="padding:8px;">Minutos</th>
                <th style="padding:8px;">Prova</th>
              </tr>
            </thead>
            <tbody>${linhasDias}</tbody>
          </table>` : '<p style="color:#8a9a8a;">Nenhuma atividade registrada esta semana.</p>'}

          <p style="margin-top:24px;font-size:12px;color:#555;">
            Relatório automático do Juice Mobile ·
            <a href="https://console.firebase.google.com/project/cnbmobile-2053c" style="color:#00FF88;">Firebase Console</a>
          </p>
        </div>
      </div>`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: smtpUser.value(), pass: smtpPass.value() },
    });

    await transporter.sendMail({
      from: `"Juice Mobile" <${smtpUser.value()}>`,
      to: DESTINATARIO,
      subject: `📊 Juice Mobile — Relatório Semanal (${semanaStr})`,
      html,
    });

    console.log(`[RelatorioSemanal] E-mail enviado para ${DESTINATARIO}`);
  }
);

// ─── Helper: carrega keypair do projeto a partir do secret ───────────────────
function carregarKeypair(secretValue) {
  const { Keypair } = require('@solana/web3.js');
  const bs58 = require('bs58');
  const value = secretValue.trim();
  try {
    return Keypair.fromSecretKey(new Uint8Array(JSON.parse(value)));
  } catch {
    return Keypair.fromSecretKey(bs58.decode(value));
  }
}

// ─── Proof of Activity: registra resumo diário na Solana ─────────────────────
// Roda todo dia às 03:00 horário de Brasília.
// Escreve um Memo na Solana com: data, usuários ativos, pontos e minutos do dia.
// Custo: ~0.000005 SOL por dia (~$0.001). Registro salvo em provas_onchain/{date}.
exports.registrarAtividadeDiaria = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'America/Sao_Paulo',
    secrets: [solanaPrivateKey],
    region: 'us-central1',
  },
  async () => {
    const { Connection, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
    const db = getFirestore();

    // Data de ontem (a função roda às 3h, registra o dia anterior)
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dateStr = ontem.toISOString().split('T')[0]; // ex: "2026-04-20"

    // Evita duplicata
    const provaRef = db.collection('provas_onchain').doc(dateStr);
    const provaSnap = await provaRef.get();
    if (provaSnap.exists) {
      console.log(`[ActivityProof] ${dateStr} já registrado. Pulando.`);
      return;
    }

    // Agrega dados do dia: usuários com ultimoLogin ontem
    const inicioDia = new Date(ontem);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(ontem);
    fimDia.setHours(23, 59, 59, 999);

    const snap = await db.collection('usuarios')
      .where('ultimoLogin', '>=', inicioDia)
      .where('ultimoLogin', '<=', fimDia)
      .get();

    let totalPontos = 0;
    let totalMinutos = 0;
    const uids = [];

    snap.forEach(doc => {
      const d = doc.data();
      totalPontos += d.pontos ?? 0;
      totalMinutos += d.minutos ?? 0;
      uids.push(doc.id);
    });

    const usuariosAtivos = uids.length;
    const payload = {
      app: 'Juice Mobile',
      date: dateStr,
      activeUsers: usuariosAtivos,
      totalPoints: totalPontos,
      totalMinutes: totalMinutos,
    };

    // Hash SHA-256 do payload para integridade
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(payload) + uids.sort().join(','))
      .digest('hex');

    const memo = JSON.stringify({ ...payload, hash });

    // Escreve no Solana Memo Program
    const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const projectKeypair = carregarKeypair(solanaPrivateKey.value());

    const transaction = new Transaction();
    transaction.add(new TransactionInstruction({
      keys: [{ pubkey: projectKeypair.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM,
      data: Buffer.from(memo, 'utf8'),
    }));

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = projectKeypair.publicKey;

    const signature = await connection.sendTransaction(transaction, [projectKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');

    // Salva no Firestore
    await provaRef.set({
      date: dateStr,
      activeUsers: usuariosAtivos,
      totalPoints: totalPontos,
      totalMinutes: totalMinutos,
      hash,
      signature,
      solscanUrl: `https://solscan.io/tx/${signature}`,
      criadoEm: FieldValue.serverTimestamp(),
    });

    console.log(`[ActivityProof] ${dateStr} | ${usuariosAtivos} usuários | sig: ${signature}`);
  }
);

// ─── Proof of Engagement: registra sessão individual na Solana ───────────────
// Chamado pelo app ao fim de cada sessão de carregamento.
// Escreve um Memo com: uidHash (privado), timestamp, duração e pontos da sessão.
exports.registrarProvasSessao = onCall(
  { secrets: [solanaPrivateKey], region: 'us-central1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');

    const uid = request.auth.uid;
    const { duracaoMinutos, deviceHash: deviceHashCliente } = request.data;

    if (
      typeof duracaoMinutos !== 'number' ||
      !Number.isInteger(duracaoMinutos) ||
      duracaoMinutos < 1 ||
      duracaoMinutos > 1440
    ) {
      throw new HttpsError('invalid-argument', 'Duração inválida (1–1440 minutos).');
    }

    const { Connection, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
    const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const db = getFirestore();

    // ── Validação server-side: duracaoMinutos não pode exceder tempo real desde última sessão ──
    const agora = new Date();
    const perfilSnap = await db.doc(`usuarios/${uid}`).get();
    const perfil = perfilSnap.exists ? perfilSnap.data() : {};
    const ultimaSessaoTs = perfil.ultimaSessao?.toDate?.() ?? null;

    if (ultimaSessaoTs) {
      const minutosdesdeuUltima = Math.floor((agora - ultimaSessaoTs) / 60000);
      const TOLERANCIA_MINUTOS = 5; // margem para clock drift e latência
      const limitePermitido = minutosdesdeuUltima + TOLERANCIA_MINUTOS;
      if (duracaoMinutos > limitePermitido) {
        console.warn(`[SessionProof] Rate limit: uid=${uid} claimed=${duracaoMinutos}min elapsed=${minutosdesdeuUltima}min`);
        throw new HttpsError('resource-exhausted', 'Duração informada excede o tempo desde a última sessão registrada.');
      }
    }

    // Hash do UID para preservar privacidade na blockchain pública
    const uidHash = crypto.createHash('sha256').update(uid).digest('hex').slice(0, 16);
    const pontos = duracaoMinutos * 10 + Math.floor(duracaoMinutos / 60) * 50;
    const ts = agora.toISOString();

    // ── Rastreamento anti-fraude: device hash + IP hash ─────────────────────
    const ipRaw = request.rawRequest?.ip ?? request.rawRequest?.headers?.['x-forwarded-for'] ?? '';
    const ipHash = ipRaw ? crypto.createHash('sha256').update(ipRaw.split(',')[0].trim()).digest('hex').slice(0, 16) : null;
    const deviceHash = (typeof deviceHashCliente === 'string' && deviceHashCliente.length >= 16)
      ? deviceHashCliente.slice(0, 64)  // aceita até 64 chars (SHA-256 truncado)
      : null;

    // Atualiza device/IP hash no perfil (usado em onReferreeBecameActive para detectar fraude)
    try {
      const profileUpdate = { ultimaSessao: agora };
      if (deviceHash) profileUpdate.deviceHash = deviceHash;
      if (ipHash)     profileUpdate.ipHash = ipHash;
      await db.doc(`usuarios/${uid}`).update(profileUpdate);
    } catch { /* não crítico */ }

    const memo = JSON.stringify({
      app: 'Juice Mobile',
      event: 'session',
      uidHash,
      ts,
      dur: duracaoMinutos,
      pts: pontos,
    });

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const projectKeypair = carregarKeypair(solanaPrivateKey.value());

      const transaction = new Transaction();
      transaction.add(new TransactionInstruction({
        keys: [{ pubkey: projectKeypair.publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM,
        data: Buffer.from(memo, 'utf8'),
      }));

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = projectKeypair.publicKey;

      const signature = await connection.sendTransaction(transaction, [projectKeypair]);
      await connection.confirmTransaction(signature, 'confirmed');

      const provaData = {
        uidHash,
        duracaoMinutos,
        pontos,
        ts,
        signature,
        solscanUrl: `https://solscan.io/tx/${signature}`,
        criadoEm: FieldValue.serverTimestamp(),
      };

      // Salva na coleção global (anônima via uidHash) + subcoleção do usuário + stats globais
      await Promise.all([
        db.collection('provas_sessao').add(provaData),
        db.collection('usuarios').doc(uid).collection('provas').add({
          duracaoMinutos,
          pontos,
          signature,
          solscanUrl: `https://solscan.io/tx/${signature}`,
          criadoEm: FieldValue.serverTimestamp(),
        }),
        db.collection('stats').doc('dashboard').set({
          totalMinutos:  FieldValue.increment(duracaoMinutos),
          totalSessoes:  FieldValue.increment(1),
          totalPontos:   FieldValue.increment(pontos),
          ultimaAtividade: FieldValue.serverTimestamp(),
        }, { merge: true }),
      ]);

      console.log(`[SessionProof] ${uidHash} | ${duracaoMinutos}min | ${pontos}pts | sig: ${signature}`);

      // Dual-write: espelha pontos/minutos no Anchor program (devnet)
      try {
        const userSnap = await db.collection('usuarios').doc(uid).get();
        const referrerUid = userSnap.exists ? (userSnap.data().referidoPor ?? null) : null;
        const anchorSig = await acumularPontosOnChain(projectKeypair, uid, pontos, duracaoMinutos, referrerUid);
        console.log(`[Anchor] acumular_pontos ok | sig: ${anchorSig}`);
      } catch (anchorErr) {
        console.warn('[Anchor] acumular_pontos falhou (não crítico):', anchorErr.message);
      }

      return { signature };
    } catch (e) {
      console.warn('[SessionProof] Falha ao registrar on-chain (não crítico):', e.message);
      return { error: 'falha' };
    }
  }
);

// ─── Resgatar pontos como JUICE Tokens na Solana ───────────────────────────────
// Phase 2: Firestore é source of truth; Anchor devnet recebe mirror do débito.
// 1 ponto = 1 JUICE token (6 decimais). Mínimo: 100.000 pontos.
const CNB_MINT = 'Ew92cAS3PmGqeNvUjsDCwHoVsiGeLSynFnzpdLTx2pu4';
const MINIMO_RESGATE = 100000;

exports.resgatarCNB = onCall(
  { secrets: [solanaPrivateKey], region: 'us-central1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');

    const uid = request.auth.uid;
    const { walletAddress, quantidade } = request.data;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new HttpsError('invalid-argument', 'Endereço de carteira inválido.');
    }
    if (!quantidade || typeof quantidade !== 'number' || quantidade < MINIMO_RESGATE) {
      throw new HttpsError('invalid-argument', `Mínimo de ${MINIMO_RESGATE.toLocaleString()} pontos.`);
    }

    const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
    const {
      getAssociatedTokenAddress,
      createAssociatedTokenAccountInstruction,
      createTransferInstruction,
      getAccount,
    } = require('@solana/spl-token');

    let userPublicKey;
    try {
      userPublicKey = new PublicKey(walletAddress);
    } catch {
      throw new HttpsError('invalid-argument', 'Endereço de carteira Solana inválido.');
    }

    const db = getFirestore();
    const usuarioRef = db.collection('usuarios').doc(uid);

    // ── 1. Débito atômico no Firestore (source of truth) ──────────────────────
    await db.runTransaction(async (t) => {
      const snap = await t.get(usuarioRef);
      if (!snap.exists) throw new HttpsError('not-found', 'Usuário não encontrado.');
      const pontos = snap.data().pontos ?? 0;
      if (pontos < quantidade) throw new HttpsError('failed-precondition', 'Pontos insuficientes.');
      t.update(usuarioRef, {
        pontos: FieldValue.increment(-quantidade),
        saques: FieldValue.increment(1),
      });
    });

    // ── 2. Mirror: espelha débito no Anchor program (devnet) ──────────────────
    try {
      const projectKeypair = carregarKeypair(solanaPrivateKey.value());
      const anchorResult = await tentarResgatarTokensOnChain(projectKeypair, uid, quantidade);
      if (anchorResult.success) {
        console.log(`[Anchor] resgatar_tokens mirror | sig: ${anchorResult.signature}`);
      } else {
        console.warn(`[Anchor] mirror ignorado — ${anchorResult.reason}`);
      }
    } catch (anchorErr) {
      console.warn('[Anchor] mirror falhou (não crítico):', anchorErr.message);
    }

    // ── 3. Envia CNB tokens na Solana mainnet ──────────────────────────────────
    try {
      const projectKeypair = carregarKeypair(solanaPrivateKey.value());
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const mintPublicKey = new PublicKey(CNB_MINT);

      const projectATA = await getAssociatedTokenAddress(mintPublicKey, projectKeypair.publicKey);
      const userATA = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);

      const transaction = new Transaction();
      try {
        await getAccount(connection, userATA);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            projectKeypair.publicKey, userATA, userPublicKey, mintPublicKey,
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          projectATA, userATA, projectKeypair.publicKey,
          BigInt(quantidade) * BigInt(1_000_000),
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = projectKeypair.publicKey;

      const signature = await connection.sendTransaction(transaction, [projectKeypair]);
      await connection.confirmTransaction(signature, 'confirmed');

      await db.collection('resgates_cnb').add({
        uid,
        walletAddress,
        quantidade,
        signature,
        criadoEm: FieldValue.serverTimestamp(),
        status: 'confirmado',
      });

      console.log(`Resgate JUICE: ${uid} → ${walletAddress} | ${quantidade} JUICE | sig: ${signature}`);
      return { signature };

    } catch (e) {
      // Estorna pontos se o envio Solana falhar
      await usuarioRef.update({
        pontos: FieldValue.increment(quantidade),
        saques: FieldValue.increment(-1),
      });
      console.error('[resgatarCNB] Erro Solana:', e);
      throw new HttpsError('internal', 'Erro ao enviar tokens. Pontos estornados. Tente novamente.');
    }
  }
);

// ─── Resgate privado de pontos via Cloak (SOL shielded) ──────────────────────
// Fluxo: Firestore debit → Cloak deposit → relay private withdrawal → usuário recebe SOL
// Sem link on-chain entre carteira do projeto e carteira do usuário.
// Taxa de câmbio: 100.000 pontos = 0.01 SOL (depósito mínimo Cloak).
// Fee relay: ~0.005 SOL. Usuário recebe ~0.005 SOL líquido por 100.000 pontos.
const MINIMO_RESGATE_PRIVADO = PONTOS_POR_BLOCO; // 100.000

exports.resgatarPrivado = onCall(
  { secrets: [solanaPrivateKey], region: 'us-central1', invoker: 'public' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');

    const uid = request.auth.uid;
    const { walletAddress, quantidade } = request.data;

    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new HttpsError('invalid-argument', 'Endereço de carteira inválido.');
    }
    if (!quantidade || typeof quantidade !== 'number' || quantidade < MINIMO_RESGATE_PRIVADO) {
      throw new HttpsError('invalid-argument', `Mínimo de ${MINIMO_RESGATE_PRIVADO.toLocaleString()} pontos.`);
    }
    // Deve ser múltiplo do bloco mínimo (100.000)
    if (quantidade % PONTOS_POR_BLOCO !== 0) {
      throw new HttpsError('invalid-argument', `Quantidade deve ser múltiplo de ${PONTOS_POR_BLOCO.toLocaleString()}.`);
    }

    const { PublicKey } = require('@solana/web3.js');
    try { new PublicKey(walletAddress); } catch {
      throw new HttpsError('invalid-argument', 'Endereço Solana inválido.');
    }

    const db = getFirestore();
    const usuarioRef = db.collection('usuarios').doc(uid);

    // ── 1. Débito atômico no Firestore ────────────────────────────────────────
    await db.runTransaction(async (t) => {
      const snap = await t.get(usuarioRef);
      if (!snap.exists) throw new HttpsError('not-found', 'Usuário não encontrado.');
      const pontos = snap.data().pontos ?? 0;
      if (pontos < quantidade) throw new HttpsError('failed-precondition', 'Pontos insuficientes.');
      t.update(usuarioRef, {
        pontos: FieldValue.increment(-quantidade),
        saques: FieldValue.increment(1),
      });
    });

    // ── 2. Resgate privado via Cloak ─────────────────────────────────────────
    try {
      const projectKeypair = carregarKeypair(solanaPrivateKey.value());
      const result = await resgatarPontosPrivado(projectKeypair, quantidade, walletAddress);

      await db.collection('resgates_privados').add({
        uid,
        walletAddress: 'PRIVADO', // não salvar endereço real — resgate é privado
        quantidade,
        amountLamports: result.amountLamports,
        netLamports: result.netLamports,
        depositSignature: result.depositSignature,
        transferSignature: result.transferSignature,

        criadoEm: FieldValue.serverTimestamp(),
        status: 'confirmado',
      });

      console.log(`[resgatarPrivado] ${uid} | ${quantidade} pontos | ${result.amountLamports} lamports | sig: ${result.transferSignature}`);
      return {
        signature: result.transferSignature,
        amountLamports: result.amountLamports,
        netLamports: result.netLamports,
      };

    } catch (e) {
      // Estorna pontos se o Cloak falhar
      await usuarioRef.update({
        pontos: FieldValue.increment(quantidade),
        saques: FieldValue.increment(-1),
      });
      console.error('[resgatarPrivado] Erro Cloak:', e);
      throw new HttpsError('internal', 'Erro no resgate privado. Pontos estornados.');
    }
  }
);

// ─── Relatório de dados pessoais (LGPD) ──────────────────────────────────────
// Callable pelo usuário autenticado. Coleta dados do perfil + histórico de
// resgates + consentimentos e envia um e-mail para o endereço cadastrado.
exports.solicitarRelatorio = onCall(
  { secrets: [smtpUser, smtpPass], region: 'us-central1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login necessário.');

    const uid = request.auth.uid;
    const db = getFirestore();

    // Busca dados do perfil
    const usuarioSnap = await db.collection('usuarios').doc(uid).get();
    if (!usuarioSnap.exists) throw new HttpsError('not-found', 'Usuário não encontrado.');
    const perfil = usuarioSnap.data();

    const email = request.auth.token?.email;
    if (!email) throw new HttpsError('failed-precondition', 'E-mail não encontrado na conta.');

    // Busca histórico de resgates CNB
    const resgatesSnap = await db.collection('resgates_cnb')
      .where('uid', '==', uid)
      .orderBy('criadoEm', 'desc')
      .limit(50)
      .get();

    let linhasResgates = '';
    resgatesSnap.forEach(d => {
      const r = d.data();
      const data = r.criadoEm?.toDate
        ? r.criadoEm.toDate().toLocaleDateString('pt-BR')
        : '—';
      linhasResgates += `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #1a2a1a;">${data}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1a2a1a;">${(r.quantidade ?? 0).toLocaleString('pt-BR')} JUICE</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1a2a1a;font-size:11px;">${r.walletAddress ?? '—'}</td>
      </tr>`;
    });

    // Formata consentimentos
    const consentimentos = perfil.consentimentos ?? {};
    const linhasConsent = Object.entries(consentimentos).map(([id, ativo]) =>
      `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #1a2a1a;">${id}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1a2a1a;color:${ativo ? '#00FF88' : '#ff6464'};">
          ${ativo ? 'Ativo' : 'Revogado'}
        </td>
      </tr>`
    ).join('');

    const criadoEm = perfil.criadoEm?.toDate
      ? perfil.criadoEm.toDate().toLocaleDateString('pt-BR')
      : '—';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0A0F1E;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0d1f0d;padding:24px 28px;border-bottom:2px solid #00FF88;">
          <h1 style="margin:0;color:#00FF88;font-size:20px;">Relatório de Dados — Juice Mobile</h1>
          <p style="margin:6px 0 0;color:#8a9a8a;font-size:13px;">Gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        </div>
        <div style="padding:24px 28px;font-size:13px;line-height:1.6;">

          <h2 style="color:#c6ff4a;font-size:15px;margin-bottom:10px;">Perfil</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:6px 10px;color:#8a9a8a;width:40%;">Nome</td><td style="padding:6px 10px;">${perfil.nome ?? '—'}</td></tr>
            <tr style="background:rgba(255,255,255,0.03)"><td style="padding:6px 10px;color:#8a9a8a;">E-mail</td><td style="padding:6px 10px;">${email}</td></tr>
            <tr><td style="padding:6px 10px;color:#8a9a8a;">Membro desde</td><td style="padding:6px 10px;">${criadoEm}</td></tr>
            <tr style="background:rgba(255,255,255,0.03)"><td style="padding:6px 10px;color:#8a9a8a;">Pontos atuais</td><td style="padding:6px 10px;">${(perfil.pontos ?? 0).toLocaleString('pt-BR')}</td></tr>
            <tr><td style="padding:6px 10px;color:#8a9a8a;">Minutos carregados</td><td style="padding:6px 10px;">${(perfil.minutos ?? 0).toLocaleString('pt-BR')}</td></tr>
            <tr style="background:rgba(255,255,255,0.03)"><td style="padding:6px 10px;color:#8a9a8a;">Código de indicação</td><td style="padding:6px 10px;">${perfil.codigo ?? '—'}</td></tr>
          </table>

          <h2 style="color:#c6ff4a;font-size:15px;margin-bottom:10px;">Preferências de Privacidade</h2>
          ${linhasConsent ? `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead><tr style="background:rgba(255,255,255,0.05);color:#8a9a8a;">
              <th style="padding:6px 10px;text-align:left;">Consentimento</th>
              <th style="padding:6px 10px;text-align:left;">Status</th>
            </tr></thead>
            <tbody>${linhasConsent}</tbody>
          </table>` : '<p style="color:#8a9a8a;margin-bottom:24px;">Nenhuma preferência registrada.</p>'}

          <h2 style="color:#c6ff4a;font-size:15px;margin-bottom:10px;">Histórico de Resgates JUICE</h2>
          ${linhasResgates ? `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead><tr style="background:rgba(255,255,255,0.05);color:#8a9a8a;">
              <th style="padding:6px 10px;text-align:left;">Data</th>
              <th style="padding:6px 10px;text-align:left;">Valor</th>
              <th style="padding:6px 10px;text-align:left;">Carteira</th>
            </tr></thead>
            <tbody>${linhasResgates}</tbody>
          </table>` : '<p style="color:#8a9a8a;margin-bottom:24px;">Nenhum resgate realizado.</p>'}

          <p style="font-size:11px;color:#555;margin-top:20px;">
            Este relatório foi gerado a pedido do titular dos dados, conforme a Lei Geral de Proteção de Dados (LGPD).
            Para solicitações adicionais, entre em contato: contato@rafaelmariano.com.br
          </p>
        </div>
      </div>`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: smtpUser.value(), pass: smtpPass.value() },
    });

    await transporter.sendMail({
      from: `"Juice Mobile" <${smtpUser.value()}>`,
      to: email,
      subject: 'Seus dados no Juice Mobile — Relatório completo',
      html,
    });

    console.log(`[RelatorioLGPD] Relatório enviado para ${email} (uid: ${uid})`);
    return { enviado: true };
  }
);

// ─── Envio de push notification para todos os usuários ───────────────────────
// Só admins podem chamar. Tokens ficam em /push_tokens/{uid}.
// UIDs de admin lidos do Firebase config (firebase functions:config:set ou env ADMIN_UIDS).
// Formato: string com UIDs separados por vírgula.
// Para adicionar um admin: firebase functions:config:set admin.uids="uid1,uid2"
const getAdminUids = () => adminUids.value().split(',').map(s => s.trim()).filter(Boolean);

exports.enviarNotificacaoGlobal = onCall(
  { region: 'us-central1', invoker: 'public' },
  async (request) => {
    if (!request.auth || !getAdminUids().includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', 'Não autorizado.');
    }

    const { titulo, corpo } = request.data;
    if (!titulo || !corpo) throw new HttpsError('invalid-argument', 'titulo e corpo são obrigatórios.');

    const db = getFirestore();
    const snap = await db.collection('push_tokens').get();
    const tokens = snap.docs.map(d => d.data().token).filter(Boolean);

    if (tokens.length === 0) return { enviado: 0 };

    // Envia em lotes de 100 (limite da API do Expo)
    const LOTE = 100;
    let total = 0;
    for (let i = 0; i < tokens.length; i += LOTE) {
      const messages = tokens.slice(i, i + LOTE).map(to => ({
        to,
        title: titulo,
        body: corpo,
        sound: 'default',
        channelId: 'default',
      }));
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      });
      total += messages.length;
    }

    console.log(`[Push] Notificação enviada para ${total} dispositivos`);
    return { enviado: total };
  }
);

// ─── Snapshot semanal: pontosInicioSemana = pontos atuais ──────────────────
// Roda todo domingo 00:30 (America/Sao_Paulo). Para cada usuário, salva
// o `pontos` atual em `pontosInicioSemana`. O cliente calcula o ranking
// semanal como `Math.max(0, pontos - pontosInicioSemana)` — captura todas
// as fontes de crédito automaticamente (carregamento, login, indicação,
// milestones, comissão de saque) sem precisar modificar cada caminho.
// Limitação: saques mid-semana podem reduzir o delta — o Math.max no
// cliente evita números negativos.
async function executarSnapshotSemanal(db) {
  const snap = await db.collection('usuarios').get();
  const BATCH_LIMIT = 400;
  let batch = db.batch();
  let writes = 0;
  let total = 0;

  for (const doc of snap.docs) {
    const pontos = doc.data().pontos ?? 0;
    batch.update(doc.ref, {
      pontosInicioSemana: pontos,
      inicioSemana: FieldValue.serverTimestamp(),
    });
    writes++;
    total++;

    if (writes >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }
  if (writes > 0) await batch.commit();
  return total;
}

exports.snapshotInicioSemana = onSchedule(
  {
    schedule: '30 0 * * 0',
    timeZone: 'America/Sao_Paulo',
    region: 'us-central1',
  },
  async () => {
    const total = await executarSnapshotSemanal(getFirestore());
    console.log(`[Snapshot] ${total} usuários atualizados`);
  }
);

// Backfill manual: admin chama uma vez após o deploy para inicializar o
// campo pontosInicioSemana em todos os perfis. Idempotente — pode rodar
// quantas vezes quiser (sempre redefine para o pontos atual).
exports.runSnapshotInicioSemana = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth || !getAdminUids().includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', 'Não autorizado.');
    }
    const total = await executarSnapshotSemanal(getFirestore());
    return { atualizados: total };
  }
);

// ─── Crédito automático de 20k pts pra testers cadastrados via Forms ─────────
// Disparada por Apps Script quando uma nova resposta do Forms entra.
// Idempotente: doc do usuário ganha flag `bonusTesterCreditado: true` na 1ª chamada,
// chamadas subsequentes pra mesmo email retornam `already_credited` sem efeito.
// Auth: header `X-CNB-Secret` deve bater com TESTER_SECRET do Secret Manager.
// Para criar/rotacionar: firebase functions:secrets:set TESTER_SECRET
const TESTER_BONUS = 20000;

exports.creditarBonusTester = onRequest(
  { region: 'us-central1', cors: true, invoker: 'public', secrets: [testerSecret] },
  async (req, res) => {
    if (req.headers['x-cnb-secret'] !== testerSecret.value()) {
      res.status(401).json({ ok: false, reason: 'unauthorized' });
      return;
    }

    const emailRaw = req.body?.email || req.query?.email || '';
    const email = String(emailRaw).toLowerCase().trim();
    if (!email || !email.includes('@')) {
      res.status(400).json({ ok: false, reason: 'missing_email' });
      return;
    }

    const db = getFirestore();

    // Busca por email exato (lowercase) e variantes (capitalizado),
    // já que perfis podem ter sido criados com casing diferente.
    const variantes = [email, email[0].toUpperCase() + email.slice(1)];
    let userDoc = null;
    for (const v of variantes) {
      const snap = await db.collection('usuarios').where('email', '==', v).limit(1).get();
      if (!snap.empty) {
        userDoc = snap.docs[0];
        break;
      }
    }

    if (!userDoc) {
      res.json({ ok: false, reason: 'no_account', email });
      return;
    }

    const data = userDoc.data();
    if (data.bonusTesterCreditado === true) {
      res.json({ ok: false, reason: 'already_credited', uid: userDoc.id });
      return;
    }

    const update = {
      pontos: FieldValue.increment(TESTER_BONUS),
      bonusTesterCreditado: true,
    };
    // Mantém o ranking semanal neutro (bônus não é atividade).
    if (data.pontosInicioSemana !== undefined) {
      update.pontosInicioSemana = FieldValue.increment(TESTER_BONUS);
    }

    await userDoc.ref.update(update);

    console.log(`[BonusTester] +${TESTER_BONUS}pts → ${email} (uid: ${userDoc.id})`);
    res.json({
      ok: true,
      uid: userDoc.id,
      pontosAntes: data.pontos ?? 0,
      pontosDepois: (data.pontos ?? 0) + TESTER_BONUS,
    });
  }
);

// ─── Backfill: credita pontos de indicação perdidos por bug do onReferralCreated ─
// Só admin pode chamar. Roda UMA vez. Compara o campo `referidos` com a contagem
// real de usuários que têm `referidoPor` apontando para o referrer.
// Crédito = (diferença) × 100 pts por referral perdida.
exports.backfillReferralPoints = onCall(
  { region: 'us-central1', invoker: 'public' },
  async (request) => {
    if (!request.auth || !getAdminUids().includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', 'Não autorizado.');
    }

    const db = getFirestore();

    // 1. Busca todos os usuários que foram indicados por alguém
    const referredSnap = await db.collection('usuarios')
      .where('referidoPor', '!=', null)
      .get();

    // 2. Conta quantas indicações reais cada referrer tem
    const contagemReal = {}; // referrerUid -> número real de indicados
    referredSnap.forEach(doc => {
      const ref = doc.data().referidoPor;
      if (ref && ref !== doc.id) {
        contagemReal[ref] = (contagemReal[ref] ?? 0) + 1;
      }
    });

    const referrerUids = Object.keys(contagemReal);
    if (referrerUids.length === 0) {
      return { creditados: 0, pontosTotais: 0, detalhes: [] };
    }

    // 3. Busca os perfis dos referrers e calcula a diferença
    const resultados = [];
    let totalCreditados = 0;
    let totalPontos = 0;

    // Processa em lotes de 20 (limite de reads paralelos razoável)
    const LOTE = 20;
    for (let i = 0; i < referrerUids.length; i += LOTE) {
      const lote = referrerUids.slice(i, i + LOTE);
      const snaps = await Promise.all(lote.map(uid => db.doc(`usuarios/${uid}`).get()));

      const batch = db.batch();
      let temEscrita = false;

      snaps.forEach((snap, idx) => {
        if (!snap.exists) return;
        const uid = lote[idx];
        const dados = snap.data();
        const referidosRegistrado = dados.referidos ?? 0;
        const referidosReal = contagemReal[uid];
        const diferenca = referidosReal - referidosRegistrado;

        if (diferenca > 0) {
          const pontosDevidos = diferenca * 100;
          batch.update(db.doc(`usuarios/${uid}`), {
            pontos: FieldValue.increment(pontosDevidos),
            referidos: referidosReal, // corrige para o valor real
          });
          resultados.push({
            uid,
            nome: dados.nome ?? '—',
            referidosRegistrado,
            referidosReal,
            diferenca,
            pontosDevidos,
          });
          totalCreditados++;
          totalPontos += pontosDevidos;
          temEscrita = true;
        }
      });

      if (temEscrita) await batch.commit();
    }

    console.log(`[BackfillReferral] ${totalCreditados} referrers creditados | ${totalPontos} pts totais`);
    return { creditados: totalCreditados, pontosTotais: totalPontos, detalhes: resultados };
  }
);

// ─── Confirmar solicitação de compra de pontos (admin via dashboard) ────────
// Atomiza: status='confirmado' + crédito de pontos no user. Idempotente.
exports.confirmarCompra = onCall({ region: 'us-central1' }, async (req) => {
  const adminUid = req.auth?.uid;
  const admins = adminUids.value().split(',').map(s => s.trim()).filter(Boolean);
  if (!adminUid || !admins.includes(adminUid)) {
    throw new HttpsError('permission-denied', 'Acesso restrito a admins.');
  }

  const { id, motivoOpcional } = req.data ?? {};
  if (!id || typeof id !== 'string') {
    throw new HttpsError('invalid-argument', 'id obrigatório.');
  }

  const db = getFirestore();
  return await db.runTransaction(async (tx) => {
    const ref = db.doc(`solicitacoes_compra/${id}`);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Solicitação não encontrada.');

    const data = snap.data();
    if (data.status === 'confirmado') {
      return { ok: true, jaConfirmado: true, creditados: 0 };
    }
    if (data.status === 'rejeitado') {
      throw new HttpsError('failed-precondition', 'Solicitação já foi rejeitada. Não dá pra confirmar.');
    }

    const { uid, cnbCalculado } = data;
    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'Solicitação sem uid válido.');
    }
    const credito = Number(cnbCalculado);
    if (!Number.isFinite(credito) || credito < 1) {
      throw new HttpsError('invalid-argument', 'cnbCalculado inválido.');
    }

    const userRef = db.doc(`usuarios/${uid}`);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', `Usuário ${uid} não existe.`);
    }

    tx.update(userRef, { pontos: FieldValue.increment(credito) });
    tx.update(ref, {
      status: 'confirmado',
      confirmadoEm: new Date(),
      confirmadoPor: adminUid,
      motivoConfirmacao: motivoOpcional ?? null,
    });

    return { ok: true, creditados: credito };
  });
});

// ─── Conta usuários do Firebase Auth (dashboard) ─────────────────────────────
// Itera via Admin SDK em pages de 1000. ~3985 users = 4 chamadas, ~2-3s total.
// Retorna também a contagem do Firestore pra dashboard comparar lado a lado.
exports.contarAuthUsers = onCall({ region: 'us-central1', timeoutSeconds: 60 }, async (req) => {
  const adminUid = req.auth?.uid;
  const admins = adminUids.value().split(',').map(s => s.trim()).filter(Boolean);
  if (!adminUid || !admins.includes(adminUid)) {
    throw new HttpsError('permission-denied', 'Acesso restrito a admins.');
  }

  const { getAuth } = require('firebase-admin/auth');
  const auth = getAuth();
  const db = getFirestore();

  let total = 0;
  let pageToken;
  const provs = {};
  let semProvider = 0;
  do {
    const result = await auth.listUsers(1000, pageToken);
    total += result.users.length;
    for (const u of result.users) {
      const pis = u.providerData ?? [];
      if (pis.length === 0) semProvider++;
      for (const p of pis) provs[p.providerId] = (provs[p.providerId] ?? 0) + 1;
    }
    pageToken = result.pageToken;
  } while (pageToken);

  // Conta Firestore usuarios em paralelo
  const fsCount = await db.collection('usuarios').count().get();
  const totalFs = fsCount.data().count;

  return {
    totalAuth: total,
    totalFirestore: totalFs,
    semPerfil: Math.max(0, total - totalFs),
    porProvider: provs,
    semProvider,
  };
});

// ─── Envio de push via Expo Push API (dashboard) ────────────────────────────
// Audiência: { tipo: 'todos' | 'pts_gte' | 'waitlist' | 'uid', valor? }
// Cria audit log em push_jobs/{id} e retorna { ok, total, sucesso, falha }.
exports.enviarPushJob = onCall({ region: 'us-central1', timeoutSeconds: 540, memory: '512MiB' }, async (req) => {
  const adminUid = req.auth?.uid;
  const admins = adminUids.value().split(',').map(s => s.trim()).filter(Boolean);
  if (!adminUid || !admins.includes(adminUid)) {
    throw new HttpsError('permission-denied', 'Acesso restrito a admins.');
  }

  const { titulo, corpo, audiencia, data, campaignId, sponsorId } = req.data ?? {};
  if (!titulo || typeof titulo !== 'string' || titulo.length > 120) {
    throw new HttpsError('invalid-argument', 'titulo obrigatório (≤120 chars).');
  }
  if (!corpo || typeof corpo !== 'string' || corpo.length > 500) {
    throw new HttpsError('invalid-argument', 'corpo obrigatório (≤500 chars).');
  }
  if (!audiencia?.tipo) {
    throw new HttpsError('invalid-argument', 'audiencia.tipo obrigatório.');
  }

  const db = getFirestore();

  // 1. Determinar lista de UIDs alvo
  let uidsAlvo = [];
  const TIPO = audiencia.tipo;

  if (TIPO === 'uid') {
    if (typeof audiencia.valor !== 'string') throw new HttpsError('invalid-argument', 'uid inválido.');
    uidsAlvo = [audiencia.valor];
  } else if (TIPO === 'todos') {
    // Pega todos os push_tokens diretamente
    const snap = await db.collection('push_tokens').limit(10000).get();
    uidsAlvo = snap.docs.map(d => d.id);
  } else if (TIPO === 'pts_gte') {
    const min = Number(audiencia.valor);
    if (!Number.isFinite(min) || min < 0) throw new HttpsError('invalid-argument', 'pts_gte exige valor numérico.');
    const snap = await db.collection('usuarios').where('pontos', '>=', min).limit(10000).get();
    uidsAlvo = snap.docs.map(d => d.id);
  } else if (TIPO === 'waitlist') {
    const snap = await db.collection('juice_waitlist').limit(10000).get();
    uidsAlvo = snap.docs.map(d => d.data().uid).filter(Boolean);
  } else {
    throw new HttpsError('invalid-argument', `audiencia.tipo desconhecido: ${TIPO}`);
  }

  if (!uidsAlvo.length) {
    return { ok: true, total: 0, sucesso: 0, falha: 0, mensagem: 'Nenhum UID na audiência.' };
  }

  // 2. Buscar tokens pra cada uid (em paralelo, chunks de 30)
  const tokens = [];
  const CHUNK = 30;
  for (let i = 0; i < uidsAlvo.length; i += CHUNK) {
    const slice = uidsAlvo.slice(i, i + CHUNK);
    const fetches = slice.map(uid =>
      db.doc(`push_tokens/${uid}`).get()
        .then(s => s.exists ? { uid, token: s.data().token } : null)
        .catch(() => null)
    );
    const got = await Promise.all(fetches);
    for (const x of got) if (x?.token) tokens.push(x);
  }

  if (!tokens.length) {
    return { ok: true, total: uidsAlvo.length, sucesso: 0, falha: 0, mensagem: 'Nenhum push_token encontrado pra audiência.' };
  }

  // 3. Audit log (cria primeiro pra ter o id e poder atualizar depois)
  const jobRef = db.collection('push_jobs').doc();
  await jobRef.set({
    titulo, corpo, audiencia,
    data: data ?? null,
    campaignId: campaignId ?? null,
    sponsorId: sponsorId ?? null,
    criadoEm: new Date(),
    criadoPor: adminUid,
    totalUids: uidsAlvo.length,
    totalTokens: tokens.length,
    status: 'enviando',
  });

  // 4. Send batches via Expo Push API (≤100 por request)
  let sucesso = 0, falha = 0;
  const erros = [];
  const BATCH = 100;
  for (let i = 0; i < tokens.length; i += BATCH) {
    const slice = tokens.slice(i, i + BATCH);
    const messages = slice.map(t => ({
      to: t.token,
      title: titulo,
      body: corpo,
      data: { ...(data ?? {}), jobId: jobRef.id, campaignId: campaignId ?? null },
      sound: 'default',
    }));
    try {
      const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      });
      if (!resp.ok) {
        falha += slice.length;
        erros.push(`HTTP ${resp.status} no batch ${i / BATCH}`);
        continue;
      }
      const j = await resp.json();
      const tickets = j.data ?? [];
      for (const t of tickets) {
        if (t.status === 'ok') sucesso++;
        else { falha++; if (erros.length < 10) erros.push(t.message ?? 'erro desconhecido'); }
      }
    } catch (e) {
      falha += slice.length;
      erros.push(e.message ?? String(e));
    }
  }

  // 5. Atualiza audit log
  await jobRef.update({
    status: 'enviado',
    finalizadoEm: new Date(),
    sucesso, falha,
    erros: erros.slice(0, 10),
  });

  return { ok: true, jobId: jobRef.id, total: uidsAlvo.length, totalTokens: tokens.length, sucesso, falha, erros: erros.slice(0, 5) };
});

// ─── Investigação de fraude (temporário) ────────────────────────────────────
// TEMP DESABILITADO no Windows: investigarFraude.js só existe no Mac, não commitado.
// const { investigarFraude } = require('./investigarFraude');
// exports.investigarFraude = investigarFraude;
