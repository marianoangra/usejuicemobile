// Diagnóstico de indicações (read-only).
// Mostra os indicados de um usuário e por que cada um conta — ou não — como
// "ativo" (regra: minutos >= 60 e processado por onReferreeBecameActive).
//
// Uso: node scripts/verificarIndicacoes.js <email|uid>

const { admin, db } = require('./lib/admin');

const MINUTOS_PARA_ATIVAR = 60;

async function acharUsuario(arg) {
  const byEmail = await db.collection('usuarios').where('email', '==', arg).limit(5).get();
  if (!byEmail.empty) return byEmail.docs;

  const byId = await db.doc(`usuarios/${arg}`).get();
  if (byId.exists) return [byId];

  // email pode existir só no Firebase Auth
  try {
    const u = await admin.auth().getUserByEmail(arg);
    const doc = await db.doc(`usuarios/${u.uid}`).get();
    if (doc.exists) return [doc];
    console.log(`(Auth tem ${arg} → uid ${u.uid}, mas não há doc usuarios/${u.uid})`);
  } catch { /* não existe no Auth */ }

  return [];
}

(async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Uso: node scripts/verificarIndicacoes.js <email|uid>');
    process.exit(1);
  }

  const docs = await acharUsuario(arg);
  if (docs.length === 0) {
    console.log(`\n❌ Nenhum usuário encontrado para "${arg}".`);
    process.exit(0);
  }
  if (docs.length > 1) {
    console.log(`\n⚠️  ${docs.length} contas com esse email — todas abaixo.`);
  }

  for (const doc of docs) {
    const u = doc.data();
    const uid = doc.id;
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`INDICADOR: ${u.nome || '(sem nome)'}  <${u.email || '?'}>`);
    console.log(`UID: ${uid}`);
    console.log(`codigoAfiliado: ${u.codigoAfiliado || '(nenhum)'}`);
    console.log(`campo referidos (total que o app mostra): ${u.referidos ?? 0}`);
    console.log(`campo indicacoesAtivas: ${u.indicacoesAtivas ?? 0}`);
    console.log(`pontos: ${u.pontos ?? 0} | minutos próprios: ${u.minutos ?? 0}`);
    console.log(`bonus5kGranted: ${!!u.bonus5kGranted} | bonus10kGranted: ${!!u.bonus10kGranted}`);
    if (u.contaBanida)   console.log('⛔ INDICADOR BANIDO — não recebe bônus de indicação');
    if (u.contaSuspeita) console.log('⚠️  indicador marcado como suspeito');

    // codigos/{codigo} → uid (lookup usado por processarIndicacao)
    if (u.codigoAfiliado) {
      const codeSnap = await db.doc(`codigos/${u.codigoAfiliado}`).get();
      if (!codeSnap.exists) {
        console.log(`⚠️  codigos/${u.codigoAfiliado} NÃO existe — ninguém consegue aplicar o código dele!`);
      } else if (codeSnap.data().uid !== uid) {
        console.log(`⚠️  codigos/${u.codigoAfiliado} aponta p/ outro uid (${codeSnap.data().uid})`);
      } else {
        console.log(`codigos/${u.codigoAfiliado} OK → aponta p/ este uid`);
      }
    }

    // referral_events: criados quando alguém aplica um código
    const eventos = await db.collection('referral_events').where('referrerUid', '==', uid).get();
    console.log(`referral_events com referrerUid == uid: ${eventos.size}`);

    const indicados = await db.collection('usuarios').where('referidoPor', '==', uid).get();
    console.log(`\nINDICADOS (referidoPor == uid): ${indicados.size}`);
    if (indicados.empty) {
      console.log('  Nenhum. Provável: os indicados não aplicaram o código de indicação,');
      console.log('  ou aplicaram código de outra pessoa.');
      continue;
    }

    let comHora = 0, contadosValidos = 0;
    const linhas = [];
    indicados.forEach((s) => {
      const r = s.data();
      const min = r.minutos ?? 0;
      const temHora = min >= MINUTOS_PARA_ATIVAR;
      const contado = r.contadoComoAtivo === true;
      const valido = contado && !r.contaBanida && !r.contaSuspeita && !r.fraudeDetectada;
      if (temHora) comHora++;
      if (valido) contadosValidos++;

      let motivo;
      if (r.fraudeDetectada)        motivo = `BLOQUEADO antifraude: ${r.fraudeDetectada}`;
      else if (r.contaBanida)       motivo = 'indicado BANIDO';
      else if (r.contaSuspeita)     motivo = 'indicado SUSPEITO';
      else if (!temHora)            motivo = `só ${min}min — faltam ${MINUTOS_PARA_ATIVAR - min}min p/ ativar`;
      else if (!contado)            motivo = 'tem >=60min mas NÃO foi contado (trigger não rodou)';
      else                          motivo = 'OK — ativo e contado';
      if (r.ipCoincide) motivo += ' [ipCoincide]';

      linhas.push({ id: s.id, email: r.email || '(sem email)', min, contado, motivo });
    });

    linhas.sort((a, b) => b.min - a.min);
    for (const l of linhas) {
      console.log(`  • ${l.email.padEnd(36)} ${String(l.min).padStart(5)}min  contado=${l.contado}`);
      console.log(`      uid=${l.id}  → ${l.motivo}`);
    }

    console.log(`\nRESUMO: ${indicados.size} indicados | ${comHora} com >=60min | ` +
      `${contadosValidos} válidos contados | campo indicacoesAtivas=${u.indicacoesAtivas ?? 0}`);
    if (contadosValidos !== (u.indicacoesAtivas ?? 0)) {
      console.log('⚠️  divergência entre contados válidos e o campo indicacoesAtivas — investigar.');
    }
  }
  process.exit(0);
})();
