// Estorna TODOS os resgates pendentes em resgates_cnb (status != 'estornado').
// Cada estorno roda em transação atômica, marca o resgate como estornado,
// credita pontos no usuário, decrementa saques.
//
// Uso:
//   cd app && node scripts/estornarTodosResgatesJuice.js
//   cd app && node scripts/estornarTodosResgatesJuice.js --dry-run    (só mostra, não aplica)
//
// Idempotente: rodar 2x não credita dobrado (skip pelo status).
// Continua processando mesmo se um resgate falhar (logs no fim).

const { db, admin } = require('./lib/admin');

const dryRun = process.argv.includes('--dry-run');

(async () => {
  console.log(`Buscando resgates_cnb não estornados...\n`);
  const snap = await db.collection('resgates_cnb').get();

  const pendentes = snap.docs.filter(d => d.data().status !== 'estornado');
  if (pendentes.length === 0) {
    console.log('Nenhum resgate pendente. Nada a fazer.');
    return;
  }

  // Coleta info de cada
  const items = [];
  for (const d of pendentes) {
    const data = d.data();
    let email = '(?)';
    try {
      const u = await db.collection('usuarios').doc(data.uid).get();
      if (u.exists) email = u.data().email || '(sem email)';
    } catch {}
    items.push({
      id: d.id,
      uid: data.uid,
      quantidade: data.quantidade,
      email,
      signature: data.signature,
      criadoEm: data.criadoEm,
    });
  }

  const total = items.reduce((s, r) => s + (r.quantidade || 0), 0);

  console.log(`Encontrados ${items.length} resgates pendentes:`);
  items.forEach(r => {
    const dt = r.criadoEm?.toDate?.()?.toLocaleString?.('pt-BR') || '?';
    console.log(`  [${r.id}]  ${dt}  ${(r.quantidade || 0).toLocaleString('pt-BR')} pts  ${r.email}`);
  });
  console.log('');
  console.log(`TOTAL: ${total.toLocaleString('pt-BR')} pts a estornar`);
  console.log('');

  if (dryRun) {
    console.log('--dry-run ativo: nada será modificado.');
    return;
  }

  console.log('Aplicando estorno em 5s (Ctrl+C cancela)...');
  await new Promise(r => setTimeout(r, 5000));

  const sucessos = [];
  const falhas = [];

  for (const r of items) {
    try {
      const resgateRef = db.collection('resgates_cnb').doc(r.id);
      const usuarioRef = db.collection('usuarios').doc(r.uid);

      await db.runTransaction(async (t) => {
        const fresh = await t.get(resgateRef);
        if (!fresh.exists) throw new Error('resgate não existe mais');
        if (fresh.data().status === 'estornado') {
          throw new Error('já estornado em paralelo');
        }
        const usuarioSnap = await t.get(usuarioRef);
        if (!usuarioSnap.exists) throw new Error('usuário não existe mais');

        t.update(usuarioRef, {
          pontos: admin.firestore.FieldValue.increment(r.quantidade),
          saques: admin.firestore.FieldValue.increment(-1),
        });
        t.update(resgateRef, {
          status: 'estornado',
          estornadoEm: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`✓ ${r.email}  +${(r.quantidade || 0).toLocaleString('pt-BR')} pts  [${r.id}]`);
      sucessos.push(r);
    } catch (e) {
      console.log(`✗ ${r.email}  ${r.id}  — ${e.message}`);
      falhas.push({ ...r, erro: e.message });
    }
  }

  console.log('');
  console.log(`=== Resumo ===`);
  console.log(`  Sucesso: ${sucessos.length} resgates / ${sucessos.reduce((s, r) => s + (r.quantidade || 0), 0).toLocaleString('pt-BR')} pts estornados`);
  console.log(`  Falha: ${falhas.length}`);
  if (falhas.length > 0) {
    console.log('  Falhas:');
    falhas.forEach(f => console.log(`    - ${f.email} (${f.id}): ${f.erro}`));
  }
})().then(() => process.exit(0)).catch(e => { console.error('✗ Erro fatal:', e); process.exit(1); });
