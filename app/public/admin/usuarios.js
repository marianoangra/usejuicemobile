// Lookup de usuário — busca por email/uid/PIX/CPF + perfil completo + ações inline.
import { db } from './lib/firebase.js';
import {
  doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { fmtNum, fmtDateTime, fmtRelative, fmtShort, esc } from './lib/fmt.js';
import { toast, confirmar } from './lib/ui.js';

export async function init({ container, registerCleanup }) {
  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">👥 Lookup de usuário</div>
      </div>
      <div class="card" style="padding:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="busca" placeholder="Email, UID, chave PIX, CPF ou wallet…" class="filter-input" style="flex:1;min-width:260px">
        <button id="btn-buscar" class="btn-small btn-ok">🔍 Buscar</button>
      </div>
      <p style="font-size:11px;color:#8a9a8a;margin-top:8px">
        Detecção automática: <strong>email</strong> (contém @) · <strong>uid</strong> (≥20 chars) · <strong>PIX/CPF/wallet</strong> (cruza com saques)
      </p>
    </div>

    <div id="resultado-host"></div>
  `;

  const inp = container.querySelector('#busca');
  const btn = container.querySelector('#btn-buscar');
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
  btn.onclick = buscar;

  // Suporta deep-link via #usuarios?q=...&uid=...
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const seedUid = params.get('uid');
  const seedQ   = params.get('q');
  if (seedUid) { inp.value = seedUid; buscar(); }
  else if (seedQ) { inp.value = seedQ; buscar(); }

  async function buscar() {
    const v = inp.value.trim();
    if (!v) return;
    const host = container.querySelector('#resultado-host');
    host.innerHTML = `<div class="empty">🔍 Procurando…</div>`;
    try {
      const matches = await procurar(v);
      if (!matches.length) {
        host.innerHTML = `<div class="empty">Nenhum usuário encontrado pra "<strong>${esc(v)}</strong>". Tente outro critério.</div>`;
        return;
      }
      if (matches.length > 1) {
        host.innerHTML = renderMultiplos(matches);
        host.querySelectorAll('button[data-uid]').forEach(b => {
          b.onclick = () => { inp.value = b.dataset.uid; buscar(); };
        });
        return;
      }
      // 1 match → carrega tudo
      await renderPerfilCompleto(matches[0], host);
    } catch (e) {
      console.error(e);
      host.innerHTML = `<div class="empty">❌ Erro: ${esc(e.message)}</div>`;
    }
  }
}

// ─── Lógica de busca ────────────────────────────────────────────────────────

async function procurar(v) {
  // 1. Email
  if (v.includes('@')) {
    const q = query(collection(db, 'usuarios'), where('email', '==', v.toLowerCase()), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  // 2. UID direto (firebase UID típico tem 28 chars alfanuméricos)
  if (v.length >= 20 && /^[A-Za-z0-9]+$/.test(v)) {
    const d = await getDoc(doc(db, 'usuarios', v));
    if (d.exists()) return [{ uid: d.id, ...d.data() }];
    // Pode ser código de afiliado se for curto. Caso não exista uid, segue pra busca em saques.
  }

  // 3. Código de afiliado (6-8 chars)
  if (/^[A-Z0-9]{4,10}$/.test(v.toUpperCase())) {
    const codDoc = await getDoc(doc(db, 'codigos', v.toUpperCase()));
    if (codDoc.exists()) {
      const uid = codDoc.data().uid;
      const u = await getDoc(doc(db, 'usuarios', uid));
      if (u.exists()) return [{ uid: u.id, ...u.data() }];
    }
  }

  // 4. PIX/CPF/wallet → busca em saques pela chavePix exata
  const sq = query(collection(db, 'saques'), where('chavePix', '==', v), limit(10));
  const sSnap = await getDocs(sq);
  const uidsUnicos = [...new Set(sSnap.docs.map(d => d.data().uid).filter(Boolean))];
  if (uidsUnicos.length > 0) {
    const users = await Promise.all(uidsUnicos.map(async u => {
      const ud = await getDoc(doc(db, 'usuarios', u));
      return ud.exists() ? { uid: u, ...ud.data() } : null;
    }));
    return users.filter(Boolean);
  }

  return [];
}

function renderMultiplos(matches) {
  return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">⚠️ ${matches.length} usuários encontrados</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Email</th><th>Pontos</th><th>Saques</th><th>UID</th><th></th></tr></thead>
          <tbody>
            ${matches.map(u => `
              <tr>
                <td>${esc(u.nome)}</td>
                <td style="font-size:12px">${esc(u.email)}</td>
                <td>${fmtNum(u.pontos)}</td>
                <td>${fmtNum(u.saques)}</td>
                <td class="wallet-addr">${esc(fmtShort(u.uid, 8, 6))}</td>
                <td><button class="btn-small btn-ok" data-uid="${esc(u.uid)}">→ abrir</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── Perfil completo ─────────────────────────────────────────────────────────

async function renderPerfilCompleto(u, host) {
  // Busca saques + push token em paralelo
  const [saquesSnap, tokenSnap] = await Promise.all([
    getDocs(query(collection(db, 'saques'), where('uid', '==', u.uid), orderBy('criadoEm', 'desc'), limit(50))),
    getDoc(doc(db, 'push_tokens', u.uid)).catch(() => null),
  ]);
  const saques = saquesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const token = tokenSnap?.exists?.() ? tokenSnap.data() : null;

  const bloqueado = u.saquesBloqueados === true || u.contaBanida === true || u.contaSuspeita === true;

  host.innerHTML = `
    <div class="section">
      <div class="card" style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:16px">
          <div>
            <h2 style="font-size:20px;margin-bottom:4px">${esc(u.nome)}${bloqueado ? ' 🚫' : ''}</h2>
            <p style="font-size:13px;color:#8a9a8a">${esc(u.email)}</p>
            <p style="font-size:11px;color:#555;font-family:monospace;margin-top:4px">uid: ${esc(u.uid)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${bloqueado
              ? `<button class="btn-small btn-ok" id="btn-desbloquear">✓ Desbloquear</button>`
              : `<button class="btn-small btn-danger" id="btn-bloquear">🚫 Bloquear saques</button>`}
          </div>
        </div>

        ${bloqueado && u.motivoBloqueio ? `
          <div style="background:#2a0d0d;border:1px solid #ff4d4d;border-radius:8px;padding:10px;margin-bottom:14px">
            <div style="font-size:11px;color:#ff4d4d;font-weight:600;margin-bottom:4px">MOTIVO DO BLOQUEIO</div>
            <div style="font-size:13px">${esc(u.motivoBloqueio)}</div>
            ${u.bloqueadoEm ? `<div style="font-size:10px;color:#8a9a8a;margin-top:4px">em ${fmtDateTime(u.bloqueadoEm)}${u.bloqueadoPor ? ' · por ' + esc(u.bloqueadoPor) : ''}</div>` : ''}
          </div>
        ` : ''}

        <div class="grid-2" style="margin-bottom:0">
          <div class="card g"><div class="card-label">Pontos</div><div class="card-value green">${fmtNum(u.pontos)}</div></div>
          <div class="card p"><div class="card-label">Saques feitos</div><div class="card-value purple">${fmtNum(u.saques)}</div></div>
          <div class="card y"><div class="card-label">Minutos</div><div class="card-value yellow">${fmtNum(u.minutos)}</div></div>
          <div class="card g"><div class="card-label">Indicações ativas</div><div class="card-value green">${fmtNum(u.indicacoesAtivas)}</div></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-top:14px;font-size:13px">
          <div><span style="color:#8a9a8a;font-size:11px;display:block">Código afiliado</span> ${esc(u.codigoAfiliado)}</div>
          <div><span style="color:#8a9a8a;font-size:11px;display:block">Referido por</span> ${u.referidoPor ? esc(fmtShort(u.referidoPor, 8, 4)) : '—'}</div>
          <div><span style="color:#8a9a8a;font-size:11px;display:block">Modo</span> ${esc(u.modo ?? '—')}</div>
          <div><span style="color:#8a9a8a;font-size:11px;display:block">Criado</span> ${fmtRelative(u.criadoEm)}</div>
          <div><span style="color:#8a9a8a;font-size:11px;display:block">Último login</span> ${fmtRelative(u.ultimoLogin)}</div>
          <div><span style="color:#8a9a8a;font-size:11px;display:block">Push token</span> ${token ? '✓ ' + esc(fmtShort(token.token ?? '', 10, 4)) : '✗ não tem'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-title">💰 Saques desse usuário</div>
        <span class="count-badge">${saques.length} registros</span>
      </div>
      ${saques.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Chave PIX</th><th>Pontos</th><th>Status</th><th>Data</th><th>ID</th></tr></thead>
          <tbody>
            ${saques.map(s => `
              <tr>
                <td style="font-family:monospace;font-size:12px">${esc(s.chavePix)}</td>
                <td>${fmtNum(s.pontos)}</td>
                <td><span class="status-badge status-${esc(s.status ?? 'pendente')}">${esc(s.status ?? 'pendente')}</span></td>
                <td>${fmtDateTime(s.criadoEm)}</td>
                <td style="font-family:monospace;font-size:11px;color:#8a9a8a">${esc(fmtShort(s.id, 8, 4))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      ` : `<div class="empty">Nenhum saque ainda.</div>`}
    </div>
  `;

  // Wire ações
  const btnBloquear = host.querySelector('#btn-bloquear');
  const btnDesbloquear = host.querySelector('#btn-desbloquear');
  if (btnBloquear) btnBloquear.onclick = () => bloquear(u, host);
  if (btnDesbloquear) btnDesbloquear.onclick = () => desbloquear(u, host);
}

async function bloquear(u, host) {
  const motivo = prompt(`Bloquear saques de "${u.nome}"?\n\nMotivo (será mostrado ao user):`,
    'Saque bloqueado preventivamente para análise de segurança. Entre em contato: contato@rafaelmariano.com.br');
  if (!motivo) return;
  try {
    await updateDoc(doc(db, 'usuarios', u.uid), {
      saquesBloqueados: true,
      motivoBloqueio: motivo,
      bloqueadoEm: new Date(),
      bloqueadoPor: 'admin',
    });
    toast(`${u.nome} bloqueado.`, 'ok');
    // re-render
    Object.assign(u, { saquesBloqueados: true, motivoBloqueio: motivo, bloqueadoEm: new Date(), bloqueadoPor: 'admin' });
    await renderPerfilCompleto(u, host);
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
  }
}

async function desbloquear(u, host) {
  const ok = await confirmar(
    'Desbloquear saques',
    `Vai permitir que "${u.nome}" volte a solicitar saques. Tem certeza?`,
    { confirmar: 'Desbloquear' }
  );
  if (!ok) return;
  try {
    await updateDoc(doc(db, 'usuarios', u.uid), {
      saquesBloqueados: false,
      contaSuspeita: false,
      // não toca contaBanida — banimento é mais severo, decisão separada
      motivoBloqueio: null,
      desbloqueadoEm: new Date(),
      desbloqueadoPor: 'admin',
    });
    toast(`${u.nome} desbloqueado.`, 'ok');
    Object.assign(u, { saquesBloqueados: false, contaSuspeita: false, motivoBloqueio: null });
    await renderPerfilCompleto(u, host);
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
  }
}
