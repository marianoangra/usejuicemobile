// Lista todos os resgates JUICE (collection resgates_cnb) com email do usuário.
// Útil para auditar escopo do incidente de 2026-05-12 (tab "JUICE" no app
// estava chamando resgatarCNB e enviando tokens CNB legacy on-chain antes do TGE).
//
// Uso:
//   cd app && node scripts/auditarResgatesJuice.js
//   cd app && node scripts/auditarResgatesJuice.js --csv > resgates.csv
//
// Saída padrão: resumo por usuário + lista completa.
// Com --csv: linhas separadas por vírgula prontas pra spreadsheet.

const { db } = require('./lib/admin');

const csvMode = process.argv.includes('--csv');

(async () => {
  const snap = await db.collection('resgates_cnb').orderBy('criadoEm', 'desc').get();

  if (snap.empty) {
    console.log('Nenhum resgate em resgates_cnb.');
    return;
  }

  const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Coleta uids únicos pra buscar emails em batch
  const uids = [...new Set(todos.map(r => r.uid).filter(Boolean))];
  const uidToInfo = new Map();
  for (const uid of uids) {
    try {
      const u = await db.collection('usuarios').doc(uid).get();
      if (u.exists) {
        const d = u.data();
        uidToInfo.set(uid, {
          email: d.email || '(sem email)',
          pontos: d.pontos || 0,
          contaBanida: d.contaBanida === true,
          saquesBloqueados: d.saquesBloqueados === true,
        });
      } else {
        uidToInfo.set(uid, { email: '(usuário deletado)', pontos: 0 });
      }
    } catch (e) {
      uidToInfo.set(uid, { email: '(erro ao buscar)', pontos: 0 });
    }
  }

  if (csvMode) {
    console.log('resgateId,uid,email,quantidade,walletAddress,signature,status,criadoEm,estornado');
    for (const r of todos) {
      const info = uidToInfo.get(r.uid) || { email: '?' };
      const dt = r.criadoEm?.toDate?.()?.toISOString?.() || '';
      const cells = [
        r.id,
        r.uid || '',
        info.email,
        r.quantidade || 0,
        r.walletAddress || '',
        r.signature || '',
        r.status || '',
        dt,
        r.status === 'estornado' ? 'SIM' : 'NAO',
      ];
      console.log(cells.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    return;
  }

  console.log(`=== Auditoria resgates_cnb ===\n`);
  console.log(`Total: ${todos.length} resgates de ${uids.length} usuários\n`);

  // Agrupa por uid
  const porUid = new Map();
  for (const r of todos) {
    if (!porUid.has(r.uid)) porUid.set(r.uid, []);
    porUid.get(r.uid).push(r);
  }

  let totalPts = 0;
  let totalSemEstorno = 0;
  let totalEstornados = 0;
  let totalSemSig = 0;

  const linhas = [];
  for (const [uid, resgates] of porUid) {
    const info = uidToInfo.get(uid) || { email: '?', pontos: 0 };
    const subtotal = resgates.reduce((s, r) => s + (r.quantidade || 0), 0);
    const naoEstornados = resgates.filter(r => r.status !== 'estornado');
    const subtotalAtivo = naoEstornados.reduce((s, r) => s + (r.quantidade || 0), 0);
    totalPts += subtotal;

    linhas.push({ info, uid, resgates, subtotal, subtotalAtivo, naoEstornados: naoEstornados.length });
  }

  // Ordena por subtotalAtivo (mais "expostos" primeiro)
  linhas.sort((a, b) => b.subtotalAtivo - a.subtotalAtivo);

  for (const l of linhas) {
    const flag = [];
    if (l.info.contaBanida) flag.push('BANIDO');
    if (l.info.saquesBloqueados) flag.push('SAQUE-BLOQUEADO');
    const flagStr = flag.length ? ` [${flag.join(', ')}]` : '';

    console.log(`${l.info.email}${flagStr}`);
    console.log(`  uid: ${l.uid}`);
    console.log(`  pontos atuais: ${l.info.pontos.toLocaleString('pt-BR')}`);
    console.log(`  resgates: ${l.resgates.length} (${l.naoEstornados} sem estorno)`);
    console.log(`  total resgatado: ${l.subtotal.toLocaleString('pt-BR')} pts`);
    console.log(`  ainda em aberto: ${l.subtotalAtivo.toLocaleString('pt-BR')} pts`);

    for (const r of l.resgates) {
      const dt = r.criadoEm?.toDate?.()?.toLocaleString?.('pt-BR') || '?';
      const sig = r.signature ? `sig=${r.signature.slice(0, 14)}...` : '⚠ SEM SIGNATURE';
      const estado = r.status === 'estornado' ? '✓ ESTORNADO' : (r.signature ? 'on-chain enviado' : '⚠ falha?');
      console.log(`    [${r.id}] ${dt}  ${(r.quantidade || 0).toLocaleString('pt-BR')} pts`);
      console.log(`        wallet: ${r.walletAddress || '?'}`);
      console.log(`        ${sig} · ${estado}`);
      if (r.status === 'estornado') totalEstornados++;
      else totalSemEstorno++;
      if (!r.signature) totalSemSig++;
    }
    console.log('');
  }

  console.log(`=== Totais ===`);
  console.log(`  Total resgatado: ${totalPts.toLocaleString('pt-BR')} pts`);
  console.log(`  Estornados: ${totalEstornados}`);
  console.log(`  Em aberto (NÃO estornados): ${totalSemEstorno}`);
  console.log(`  Sem signature on-chain (falha possível): ${totalSemSig}`);
  console.log('');
  console.log('Pra estornar um resgate específico:');
  console.log('  node scripts/estornarResgateJuice.js <resgateId>');
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
