// Read-only: lista TODOS os saques + estado da conta de cada solicitante.
// Uso: `node scripts/relatorioSaques.js` (precisa firebase login --reauth feito antes).
// Não escreve nada no Firestore.

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT = 'cnbmobile-2053c';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const cfgPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const TOKEN = config.tokens.access_token;
const EXPIRES_AT = config.tokens.expires_at;
if (Date.now() > EXPIRES_AT) {
  console.error('❌ Token Firebase expirado. Rode `firebase login --reauth` e tente de novo.');
  process.exit(1);
}

function reqJson(method, fullUrl, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(fullUrl);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error('JSON parse: ' + buf.slice(0, 200))); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${buf.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Firestore REST: campo escalar -> JS
function unwrap(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) {
    const out = {};
    for (const [k, vv] of Object.entries(v.mapValue.fields ?? {})) out[k] = unwrap(vv);
    return out;
  }
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(unwrap);
  return v;
}
function docFields(d) {
  const out = {};
  for (const [k, v] of Object.entries(d.fields ?? {})) out[k] = unwrap(v);
  return out;
}

async function listAllSaques() {
  const all = [];
  let pageToken;
  do {
    const url = `${BASE}/saques?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await reqJson('GET', url);
    for (const d of res.documents ?? []) {
      all.push({ id: d.name.split('/').pop(), ...docFields(d) });
    }
    pageToken = res.nextPageToken;
  } while (pageToken);
  return all;
}

async function getUsuario(uid) {
  try {
    const res = await reqJson('GET', `${BASE}/usuarios/${uid}`);
    return docFields(res);
  } catch (e) {
    return null;
  }
}

function fmtPts(n) { return Number(n ?? 0).toLocaleString('pt-BR'); }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'; }

(async () => {
  console.log('📥 Lendo coleção saques...');
  const saques = await listAllSaques();
  console.log(`   ${saques.length} saques no total\n`);

  // Agrupa por uid pra evitar N lookups duplicados
  const porUid = new Map();
  for (const s of saques) {
    if (!porUid.has(s.uid)) porUid.set(s.uid, []);
    porUid.get(s.uid).push(s);
  }
  console.log(`👥 ${porUid.size} usuários distintos. Buscando flags de conta...\n`);

  const userInfo = new Map();
  let i = 0;
  for (const uid of porUid.keys()) {
    i++;
    process.stdout.write(`\r   ${i}/${porUid.size}`);
    userInfo.set(uid, await getUsuario(uid));
  }
  console.log('\n');

  // Categoriza
  const processados = [];
  const bloqueados = [];   // status pendente + saquesBloqueados=true OU contaBanida
  const aPagar = [];       // status pendente + conta sem flag
  const outros = [];

  for (const s of saques) {
    const u = userInfo.get(s.uid);
    const bloq = u?.saquesBloqueados === true || u?.contaBanida === true || u?.contaSuspeita === true;
    if (s.status === 'processado') processados.push({ s, u });
    else if (s.status === 'pendente' && bloq) bloqueados.push({ s, u });
    else if (s.status === 'pendente' && !bloq) aPagar.push({ s, u });
    else outros.push({ s, u });
  }

  // ordena por data desc
  const byDate = (a, b) => String(b.s.criadoEm ?? '').localeCompare(String(a.s.criadoEm ?? ''));
  processados.sort(byDate); bloqueados.sort(byDate); aPagar.sort(byDate); outros.sort(byDate);

  const totalPts = arr => arr.reduce((acc, { s }) => acc + Number(s.pontos ?? 0), 0);

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  RELATÓRIO DE SAQUES — ${new Date().toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(`✅ JÁ PROCESSADOS (status='processado'): ${processados.length}  (${fmtPts(totalPts(processados))} pts)`);
  console.log(`🚫 BLOQUEADOS POR ANTIFRAUDE: ${bloqueados.length}  (${fmtPts(totalPts(bloqueados))} pts)`);
  console.log(`💰 A PAGAR (pendente, conta limpa): ${aPagar.length}  (${fmtPts(totalPts(aPagar))} pts)`);
  console.log(`❓ OUTROS (status inesperado): ${outros.length}\n`);

  function dump(titulo, arr, mostrarMotivo = false) {
    console.log('\n' + '─'.repeat(70));
    console.log(' ' + titulo);
    console.log('─'.repeat(70));
    if (!arr.length) { console.log(' (vazio)'); return; }
    for (const { s, u } of arr) {
      const linha = [
        fmtDate(s.criadoEm).padEnd(20),
        String(s.nome ?? '—').padEnd(35).slice(0, 35),
        fmtPts(s.pontos).padStart(11) + ' pts',
        (s.chavePix ?? '—').padEnd(25).slice(0, 25),
        s.id,
      ].join('  ');
      console.log(' ' + linha);
      if (mostrarMotivo && u?.motivoBloqueio) {
        console.log('     ↳ ' + String(u.motivoBloqueio).slice(0, 100));
      }
    }
  }

  dump('💰 PRECISAM SER PAGOS (status=pendente, conta sem flag)', aPagar);
  dump('🚫 BLOQUEADOS POR ANTIFRAUDE (não pagar, marcar como rejeitado)', bloqueados, true);
  dump('✅ JÁ MARCADOS COMO PROCESSADOS', processados);
  if (outros.length) dump('❓ STATUS INESPERADO (revisar manual)', outros);

  // Salva CSV pra abrir no Excel/Sheets
  const csvPath = path.join(__dirname, '..', 'relatorio-saques.csv');
  const csv = ['categoria,data,nome,pontos,chavePix,uid,saqueId,status,saquesBloqueados,motivoBloqueio'];
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const dumpCsv = (cat, arr) => arr.forEach(({ s, u }) => csv.push([
    cat, fmtDate(s.criadoEm), s.nome, s.pontos, s.chavePix, s.uid, s.id,
    s.status, u?.saquesBloqueados ?? false, u?.motivoBloqueio ?? '',
  ].map(escape).join(',')));
  dumpCsv('a_pagar', aPagar);
  dumpCsv('bloqueado', bloqueados);
  dumpCsv('processado', processados);
  dumpCsv('outro', outros);
  fs.writeFileSync(csvPath, csv.join('\n'), 'utf8');
  console.log(`\n📄 CSV salvo em: ${csvPath}\n`);
})().catch(e => { console.error('\n❌ Falha:', e.message); process.exit(1); });
