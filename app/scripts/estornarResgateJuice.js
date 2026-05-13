// Estorna um resgate específico em resgates_cnb. Idempotente:
// marca o doc do resgate com `status: 'estornado'` + `estornadoEm` pra
// impedir refund duplicado. Roda em transação atômica (resgate + pontos).
//
// Uso:
//   cd app && node scripts/estornarResgateJuice.js <resgateId>
//
// O <resgateId> vem da auditoria:
//   node scripts/auditarResgatesJuice.js
//
// O que faz:
//   1. Lê doc resgates_cnb/<resgateId>
//   2. Se já tem status='estornado' → para (idempotente)
//   3. Transação: credita `quantidade` pontos no usuario.pontos
//      + decrementa usuario.saques em 1 (mínimo 0)
//      + marca resgate como status='estornado' + estornadoEm
//
// NÃO desfaz a transferência on-chain Solana. Se o resgate tem signature
// e o token foi enviado, esses tokens permanecem na wallet do usuário —
// é decisão de negócio se você quer pedir devolução ou aceitar como ônus.

const { db, admin } = require('./lib/admin');

const [, , resgateIdArg] = process.argv;

if (!resgateIdArg) {
  console.error('Uso: node scripts/estornarResgateJuice.js <resgateId>');
  console.error('');
  console.error('Liste os resgates primeiro:');
  console.error('  node scripts/auditarResgatesJuice.js');
  process.exit(1);
}

(async () => {
  const resgateRef = db.collection('resgates_cnb').doc(resgateIdArg);

  console.log(`Lendo resgate ${resgateIdArg}...`);
  const resgateSnap = await resgateRef.get();
  if (!resgateSnap.exists) {
    console.error(`✗ Resgate "${resgateIdArg}" não existe.`);
    process.exit(1);
  }
  const resgate = resgateSnap.data();

  if (resgate.status === 'estornado') {
    console.error(`✗ Resgate já foi estornado em ${resgate.estornadoEm?.toDate?.()?.toISOString?.() || '?'}.`);
    console.error('Nada a fazer.');
    process.exit(0);
  }

  const uid = resgate.uid;
  const quantidade = resgate.quantidade;
  if (!uid || !quantidade || quantidade <= 0) {
    console.error('✗ Resgate sem uid ou quantidade válida:', resgate);
    process.exit(1);
  }

  const usuarioRef = db.collection('usuarios').doc(uid);
  const usuarioSnap = await usuarioRef.get();
  if (!usuarioSnap.exists) {
    console.error(`✗ Usuário ${uid} não existe mais.`);
    process.exit(1);
  }
  const usuario = usuarioSnap.data();

  console.log('');
  console.log(`Resgate:`);
  console.log(`  id: ${resgateIdArg}`);
  console.log(`  uid: ${uid}`);
  console.log(`  email: ${usuario.email || '(sem email)'}`);
  console.log(`  quantidade: ${quantidade.toLocaleString('pt-BR')} pts`);
  console.log(`  signature: ${resgate.signature || '(NENHUMA)'}`);
  console.log(`  walletAddress: ${resgate.walletAddress || '?'}`);
  console.log(`  criadoEm: ${resgate.criadoEm?.toDate?.()?.toLocaleString?.('pt-BR') || '?'}`);
  console.log('');
  console.log(`Usuário antes:`);
  console.log(`  pontos: ${(usuario.pontos || 0).toLocaleString('pt-BR')}`);
  console.log(`  saques: ${usuario.saques || 0}`);
  console.log('');
  console.log(`Após estorno:`);
  console.log(`  pontos: ${((usuario.pontos || 0) + quantidade).toLocaleString('pt-BR')} (+${quantidade.toLocaleString('pt-BR')})`);
  console.log(`  saques: ${Math.max(0, (usuario.saques || 0) - 1)}`);
  console.log('');

  if (resgate.signature) {
    console.log('⚠ AVISO: este resgate tem signature on-chain. Os tokens CNB');
    console.log('  foram enviados pra Solana. Estornar pontos NÃO recolhe');
    console.log('  os tokens — o usuário ficaria com pontos + tokens.');
    console.log('');
  }

  console.log('Aplicando em 5s (Ctrl+C cancela)...');
  await new Promise(r => setTimeout(r, 5000));

  await db.runTransaction(async (t) => {
    // Re-lê dentro da transação pra evitar race
    const fresh = await t.get(resgateRef);
    if (fresh.data().status === 'estornado') {
      throw new Error('Resgate foi estornado por outra operação enquanto este script rodava.');
    }
    t.update(usuarioRef, {
      pontos: admin.firestore.FieldValue.increment(quantidade),
      saques: admin.firestore.FieldValue.increment(-1),
    });
    t.update(resgateRef, {
      status: 'estornado',
      estornadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  console.log('✓ Estorno aplicado e resgate marcado como estornado.');
})().then(() => process.exit(0)).catch(e => { console.error('✗ Erro:', e.message); process.exit(1); });
