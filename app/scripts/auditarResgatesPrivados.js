// Lista todos os resgates privados (Cloak shielded SOL) feitos via resgatarPrivado.
// Útil para auditar quanto SOL real saiu da carteira do projeto.
//
// Uso:
//   cd app && node scripts/auditarResgatesPrivados.js

const { db } = require('./lib/admin');

(async () => {
  const snap = await db.collection('resgates_privados').orderBy('criadoEm', 'desc').get();

  if (snap.empty) {
    console.log('Nenhum resgate privado em resgates_privados.');
    return;
  }

  const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Coleta uids únicos pra emails
  const uids = [...new Set(todos.map(r => r.uid).filter(Boolean))];
  const uidToEmail = new Map();
  for (const uid of uids) {
    try {
      const u = await db.collection('usuarios').doc(uid).get();
      uidToEmail.set(uid, u.exists ? (u.data().email || '(sem email)') : '(usuário deletado)');
    } catch { uidToEmail.set(uid, '(erro)'); }
  }

  console.log(`=== Auditoria resgates_privados ===\n`);
  console.log(`Total: ${todos.length} resgates de ${uids.length} usuários\n`);

  // Agrupa por uid
  const porUid = new Map();
  for (const r of todos) {
    if (!porUid.has(r.uid)) porUid.set(r.uid, []);
    porUid.get(r.uid).push(r);
  }

  let totalPts = 0;
  let totalLamports = 0n;
  let totalNetLamports = 0n;
  let totalEstornados = 0;

  for (const [uid, resgates] of porUid) {
    const email = uidToEmail.get(uid) || '?';
    const subtotal = resgates.reduce((s, r) => s + (r.quantidade || 0), 0);
    totalPts += subtotal;

    console.log(`${email}`);
    console.log(`  uid: ${uid}`);
    console.log(`  resgates: ${resgates.length}`);
    console.log(`  total resgatado: ${subtotal.toLocaleString('pt-BR')} pts`);

    for (const r of resgates) {
      const dt = r.criadoEm?.toDate?.()?.toLocaleString?.('pt-BR') || '?';
      const lamports = BigInt(r.amountLamports ?? 0);
      const net = BigInt(r.netLamports ?? 0);
      totalLamports += lamports;
      totalNetLamports += net;
      const sol = Number(lamports) / 1e9;
      const solNet = Number(net) / 1e9;
      const sig = r.transferSignature ? r.transferSignature.slice(0, 14) + '...' : '(SEM SIG)';
      const estado = r.status === 'estornado' ? '✓ ESTORNADO' : (r.transferSignature ? 'enviado' : '⚠ falha?');
      console.log(`    [${r.id}] ${dt}  ${(r.quantidade || 0).toLocaleString('pt-BR')} pts → ${sol.toFixed(4)} SOL (net ${solNet.toFixed(4)})`);
      console.log(`        sig=${sig} · ${estado}`);
      if (r.status === 'estornado') totalEstornados++;
    }
    console.log('');
  }

  const totalSOL = Number(totalLamports) / 1e9;
  const totalSOLNet = Number(totalNetLamports) / 1e9;

  console.log(`=== Totais ===`);
  console.log(`  Total resgatado: ${totalPts.toLocaleString('pt-BR')} pts`);
  console.log(`  SOL depositado no Cloak: ${totalSOL.toFixed(4)} SOL`);
  console.log(`  SOL líquido aos usuários: ${totalSOLNet.toFixed(4)} SOL`);
  console.log(`  Estornados: ${totalEstornados}`);
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
