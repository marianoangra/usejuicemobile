// Estorna pontos de um resgate JUICE manualmente. Uso:
//   node scripts/estornarResgateJuice.js <email> <quantidade>
//
// Exemplo: node scripts/estornarResgateJuice.js contato@criptonobolso.com.br 100000
//
// IMPORTANTE: este script NÃO é idempotente. Rodar 2× credita o dobro.
// Antes de rodar, verifique em /admin (dashboard) ou em
//   `resgates_cnb` no Firestore admin se o resgate em questão:
//     (a) tem `signature` registrada → tokens FORAM enviados on-chain →
//         não estorne, vá em Solscan e verifique. Se Rafael quer
//         desfazer mesmo assim, isso é uma decisão de negócio.
//     (b) NÃO tem `signature` ou tem `status: 'falhou'` → a Cloud Function
//         já estornou automaticamente (ver functions/index.js linhas
//         1148-1156). Confira o `pontos` do usuário antes de rodar
//         este script — se já voltaram, não rode de novo.
//
// Este script foi criado em 2026-05-12 após um teste interno detectar
// que o tab "JUICE" no app fazia transferência on-chain do mint CNB
// legacy (Ew92cAS3...), confundindo usuários sobre o estado do token.
// A partir de então, o resgate JUICE foi bloqueado em UI + função.

const https = require('https');
const fs = require('fs');
const os = require('os');

const [, , emailArg, qtdArg] = process.argv;

if (!emailArg || !qtdArg) {
  console.error('Uso: node scripts/estornarResgateJuice.js <email> <quantidade>');
  process.exit(1);
}

const quantidade = parseInt(qtdArg, 10);
if (isNaN(quantidade) || quantidade <= 0) {
  console.error(`Quantidade inválida: ${qtdArg}`);
  process.exit(1);
}

const PROJECT = 'cnbmobile-2053c';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const config = JSON.parse(
  fs.readFileSync(os.homedir() + '/.config/configstore/firebase-tools.json', 'utf8')
);
const TOKEN = config.tokens.access_token;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function buscarUidPorEmail(email) {
  const target = email.toLowerCase().trim();
  let pageToken = '';
  do {
    const url = `/usuarios?pageSize=300&mask.fieldPaths=email&mask.fieldPaths=pontos&mask.fieldPaths=saques${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`;
    const r = await req('GET', url);
    if (r.status !== 200) {
      throw new Error('Falha listagem: ' + JSON.stringify(r.body));
    }
    for (const d of (r.body.documents || [])) {
      const emailDoc = d.fields?.email?.stringValue ?? null;
      if (emailDoc && emailDoc.toLowerCase().trim() === target) {
        return {
          uid: d.name.split('/').pop(),
          email: emailDoc,
          pontos: parseInt(d.fields?.pontos?.integerValue ?? '0', 10),
          saques: parseInt(d.fields?.saques?.integerValue ?? '0', 10),
        };
      }
    }
    pageToken = r.body.nextPageToken || '';
  } while (pageToken);
  return null;
}

async function estornar(uid, pontosAtuais, saquesAtuais) {
  const novosPontos = pontosAtuais + quantidade;
  const novosSaques = Math.max(0, saquesAtuais - 1);
  const fields = {
    pontos: { integerValue: String(novosPontos) },
    saques: { integerValue: String(novosSaques) },
  };
  const mask = 'updateMask.fieldPaths=pontos&updateMask.fieldPaths=saques';
  const r = await req('PATCH', `/usuarios/${uid}?${mask}`, { fields });
  return { ok: r.status === 200, novosPontos, novosSaques };
}

(async () => {
  console.log(`Buscando usuário ${emailArg}...`);
  const u = await buscarUidPorEmail(emailArg);
  if (!u) {
    console.error(`✗ Usuário com email "${emailArg}" não encontrado.`);
    process.exit(1);
  }
  console.log(`Encontrado: uid=${u.uid}`);
  console.log(`  pontos atuais: ${u.pontos.toLocaleString('pt-BR')}`);
  console.log(`  saques atuais: ${u.saques}`);
  console.log('');
  console.log(`Vou estornar ${quantidade.toLocaleString('pt-BR')} pts e decrementar saques em 1.`);
  console.log(`  novos pontos: ${(u.pontos + quantidade).toLocaleString('pt-BR')}`);
  console.log(`  novos saques: ${Math.max(0, u.saques - 1)}`);
  console.log('');
  console.log('Aguardando 5s antes de aplicar (Ctrl+C para cancelar)...');
  await new Promise(r => setTimeout(r, 5000));

  const res = await estornar(u.uid, u.pontos, u.saques);
  if (res.ok) {
    console.log(`✓ Estorno aplicado. Saldo: ${res.novosPontos.toLocaleString('pt-BR')} pts.`);
  } else {
    console.error('✗ Falha no PATCH:', res);
    process.exit(1);
  }
})();
