// Tab Overview — cards consolidados + alertas operacionais + atalhos.
import { db, functions } from './lib/firebase.js';
import {
  doc, onSnapshot, collection, query, orderBy, limit, updateDoc, setDoc,
  where, getCountFromServer, getDocs, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js';
import { fmtNum, fmtDate, fmtShort, esc } from './lib/fmt.js';
import { toast } from './lib/ui.js';

const contarAuthUsersFn = httpsCallable(functions, 'contarAuthUsers');

export async function init({ container, registerCleanup }) {
  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">📊 Overview operacional</div>
        <span class="count-badge" id="overview-refresh">…</span>
      </div>
    </div>

    <!-- Cards top -->
    <div class="grid-2" id="overview-cards"></div>

    <!-- Alertas -->
    <div id="alertas-host" style="margin-bottom:24px"></div>

    <!-- Atalhos rápidos -->
    <div class="section">
      <div class="section-header"><div class="section-title">⚡ Ações rápidas</div></div>
      <div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        <a href="#saques" class="card g" style="text-decoration:none;color:inherit;padding:16px">
          <div style="font-size:24px;margin-bottom:6px">💰</div>
          <div style="font-size:13px;font-weight:600">Controle de Saques</div>
          <div style="font-size:11px;color:#8a9a8a;margin-top:4px">Pagar pendentes, bloquear suspeitos</div>
        </a>
        <a href="#usuarios" class="card p" style="text-decoration:none;color:inherit;padding:16px">
          <div style="font-size:24px;margin-bottom:6px">👥</div>
          <div style="font-size:13px;font-weight:600">Lookup Usuário</div>
          <div style="font-size:11px;color:#8a9a8a;margin-top:4px">Buscar por email, PIX, UID</div>
        </a>
        <a href="#push" class="card y" style="text-decoration:none;color:inherit;padding:16px">
          <div style="font-size:24px;margin-bottom:6px">📨</div>
          <div style="font-size:13px;font-weight:600">Enviar Push</div>
          <div style="font-size:11px;color:#8a9a8a;margin-top:4px">Notificar usuários</div>
        </a>
        <a href="#banners" class="card g" style="text-decoration:none;color:inherit;padding:16px">
          <div style="font-size:24px;margin-bottom:6px">📢</div>
          <div style="font-size:13px;font-weight:600">Banners</div>
          <div style="font-size:11px;color:#8a9a8a;margin-top:4px">Editar sem rebuild</div>
        </a>
      </div>
    </div>

    <!-- Provas on-chain (mantém do antigo) -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">📋 Provas On-Chain recentes</div>
        <span class="count-badge" id="provas-count">…</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Data</th><th>Usuários</th><th>Pontos</th><th>Minutos</th><th>Solana</th></tr></thead>
          <tbody id="provas-body"><tr><td colspan="5" class="empty">Carregando…</td></tr></tbody>
        </table>
      </div>
    </div>

    <div id="lastUpdate"></div>
  `;

  // Stats públicos + downloads manuais
  let statsCache = {};
  let dashCache = {};
  registerCleanup(onSnapshot(doc(db, 'stats', 'public'), snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    statsCache = d;
    if (d.atualizadoEm?.toDate) {
      container.querySelector('#lastUpdate').textContent =
        'Última atualização do stats: ' + d.atualizadoEm.toDate().toLocaleString('pt-BR');
    }
    refreshCards(container, statsCache, dashCache);
  }));
  // Doc config/dashboard guarda métricas manuais (downloads das lojas, etc)
  registerCleanup(onSnapshot(doc(db, 'config', 'dashboard'), snap => {
    dashCache = snap.exists() ? snap.data() : {};
    refreshCards(container, statsCache, dashCache);
  }));

  // Auth count via callable (paga 1x ao abrir; cache em memória)
  contarAuthUsersFn().then(res => {
    const d = res.data;
    const el = container.querySelector('#card-auth');
    if (el) el.textContent = fmtNum(d.totalAuth);
    const elDiff = container.querySelector('#card-auth-diff');
    if (elDiff) elDiff.textContent = d.semPerfil > 0 ? `${fmtNum(d.semPerfil)} sem perfil completo` : '';
  }).catch(e => {
    console.warn('contarAuthUsers falhou:', e.message);
    const el = container.querySelector('#card-auth');
    if (el) el.textContent = '—';
  });

  // Saques pra contar pendentes/bloqueados
  registerCleanup(onSnapshot(
    query(collection(db, 'saques'), orderBy('criadoEm', 'desc'), limit(500)),
    async snap => {
      const saques = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      await refreshAlertas(container, saques);
    }
  ));

  // Provas on-chain (read-only)
  registerCleanup(onSnapshot(
    query(collection(db, 'provas_onchain'), orderBy('date', 'desc'), limit(10)),
    snap => {
      container.querySelector('#provas-count').textContent = snap.size + ' dias';
      const tbody = container.querySelector('#provas-body');
      if (snap.empty) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma prova ainda.</td></tr>'; return; }
      tbody.innerHTML = snap.docs.map(d => {
        const v = d.data();
        return `<tr>
          <td>${esc(v.date ?? d.id)}</td>
          <td>${fmtNum(v.activeUsers)}</td>
          <td>${fmtNum(v.totalPoints)}</td>
          <td>${fmtNum(v.totalMinutes)} min</td>
          <td>${v.solscanUrl ? `<a href="${esc(v.solscanUrl)}" target="_blank" class="proof-link">◎ ver prova</a>` : '—'}</td>
        </tr>`;
      }).join('');
    }
  ));

  // Conta online 30min (refresh 1min)
  async function refreshOnline() {
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000);
      const c = await getCountFromServer(
        query(collection(db, 'usuarios'), where('lastSeen', '>=', cutoff))
      );
      const el = container.querySelector('#card-online');
      if (el) el.textContent = fmtNum(c.data().count);
    } catch (e) { console.warn('refreshOnline:', e.message); }
  }
  refreshOnline();
  const id = setInterval(refreshOnline, 60_000);
  registerCleanup(() => clearInterval(id));

  container.querySelector('#overview-refresh').textContent =
    'live · atualiza automático';
}

function refreshCards(container, stats, dash) {
  const host = container.querySelector('#overview-cards');
  const downloads = dash?.downloadsManual ?? null;
  const downloadsTs = dash?.downloadsAtualizadoEm;
  const downloadsLabel = downloadsTs?.toDate?.()
    ? `atualizado ${downloadsTs.toDate().toLocaleDateString('pt-BR')}`
    : 'clica pra atualizar';
  host.innerHTML = `
    <div class="card g">
      <div class="card-label">Usuários (perfil completo)</div>
      <div class="card-value green">${fmtNum(stats.totalUsuarios)}</div>
      <div style="font-size:11px;color:#8a9a8a;margin-top:4px">Firestore /usuarios</div>
    </div>
    <div class="card p">
      <div class="card-label">Cadastros (Firebase Auth)</div>
      <div class="card-value purple" id="card-auth">…</div>
      <div style="font-size:11px;color:#FFB800;margin-top:4px" id="card-auth-diff"></div>
    </div>
    <div class="card y" id="card-downloads" style="cursor:pointer">
      <div class="card-label">Downloads (manual)</div>
      <div class="card-value yellow">${downloads != null ? fmtNum(downloads) : '—'}</div>
      <div style="font-size:11px;color:#8a9a8a;margin-top:4px">${esc(downloadsLabel)}</div>
    </div>
    <div class="card g">
      <div class="card-label">🟢 Online (30min)</div>
      <div class="card-value green" id="card-online">…</div>
    </div>
    <div class="card p">
      <div class="card-label">JUICE Distribuídos</div>
      <div class="card-value purple">${fmtNum(stats.totalCNBDistribuidos)}</div>
    </div>
    <div class="card g">
      <div class="card-label">Indicações On-Chain</div>
      <div class="card-value green">${fmtNum(stats.totalIndicacoes)}</div>
    </div>
    <div class="card p">
      <div class="card-label">Resgates JUICE</div>
      <div class="card-value purple">${fmtNum(stats.totalResgateCNB)}</div>
    </div>
    <div class="card g">
      <div class="card-label">Minutos Totais</div>
      <div class="card-value">${fmtNum(stats.totalMinutos)}</div>
    </div>
  `;

  const cardDl = container.querySelector('#card-downloads');
  if (cardDl) cardDl.onclick = () => atualizarDownloads(dash?.downloadsManual);
}

async function atualizarDownloads(atual) {
  const v = prompt(
    'Total de downloads das lojas (Play Store + App Store)\n\nVocê pega esses números em:\n• Play Console → Estatísticas → Instalações\n• App Store Connect → Analytics → Total Downloads\n\nDigite o total combinado:',
    String(atual ?? '')
  );
  if (v === null) return;
  const n = parseInt(String(v).replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) {
    toast('Valor inválido. Use um número inteiro.', 'erro');
    return;
  }
  try {
    await setDoc(doc(db, 'config', 'dashboard'), {
      downloadsManual: n,
      downloadsAtualizadoEm: new Date(),
    }, { merge: true });
    toast(`Downloads atualizado pra ${fmtNum(n)}.`, 'ok');
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
  }
}

async function refreshAlertas(container, saques) {
  const host = container.querySelector('#alertas-host');
  const alertas = [];

  // 1. Saques pendentes (precisam de pagamento ou bloqueio)
  const usuariosCache = new Map();
  // Pega flag de cada user via getDocs em paralelo (chunk de 10 pra não estourar)
  const uidsUnicos = [...new Set(saques.filter(s => s.status === 'pendente').map(s => s.uid))];
  if (uidsUnicos.length) {
    const fetches = uidsUnicos.map(async uid => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) usuariosCache.set(uid, snap.data());
      } catch {}
    });
    await Promise.all(fetches);
  }
  let pendentesReais = 0, ptsPendentes = 0;
  for (const s of saques) {
    if (s.status !== 'pendente') continue;
    const u = usuariosCache.get(s.uid);
    if (u?.saquesBloqueados === true || u?.contaBanida === true) continue;
    pendentesReais++;
    ptsPendentes += Number(s.pontos ?? 0);
  }
  if (pendentesReais > 0) {
    alertas.push({
      tipo: 'aviso',
      titulo: `${pendentesReais} saque(s) pendente(s)`,
      corpo: `${fmtNum(ptsPendentes)} pts em ${pendentesReais} saques aguardando pagamento manual.`,
      link: '#saques',
      acao: 'Ver controle de saques',
    });
  }

  // 2. PIX duplicado em múltiplas contas
  const porPix = new Map();
  for (const s of saques) {
    if (!s.chavePix) continue;
    const k = s.chavePix.trim();
    if (!porPix.has(k)) porPix.set(k, []);
    porPix.get(k).push(s);
  }
  let pixSuspeitos = 0;
  for (const [, lista] of porPix) {
    const uidsDistintos = new Set(lista.map(s => s.uid));
    if (uidsDistintos.size >= 2) pixSuspeitos++;
  }
  if (pixSuspeitos > 0) {
    alertas.push({
      tipo: 'erro',
      titulo: `${pixSuspeitos} PIX em 2+ contas`,
      corpo: 'Padrão suspeito de farm — verifique antes de pagar.',
      link: '#saques',
      acao: 'Investigar',
    });
  }

  // 3. Stats pra ações operacionais
  if (!alertas.length) {
    host.innerHTML = `<div style="background:#0d1f0d;border:1px solid #00FF88;border-radius:10px;padding:12px;font-size:13px;color:#00FF88">✓ Sem alertas operacionais no momento.</div>`;
    return;
  }

  host.innerHTML = alertas.map(a => `
    <div style="background:${a.tipo === 'erro' ? '#2a0d0d' : '#2a1500'};border:1px solid ${a.tipo === 'erro' ? '#ff4d4d' : '#FFB800'};border-radius:10px;padding:12px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <div>
        <div style="color:${a.tipo === 'erro' ? '#ff4d4d' : '#FFB800'};font-weight:600;font-size:14px">${esc(a.titulo)}</div>
        <div style="color:#fff;font-size:12px;margin-top:2px">${esc(a.corpo)}</div>
      </div>
      <a href="${esc(a.link)}" class="btn-small btn-ok" style="text-decoration:none;display:inline-block">${esc(a.acao)}</a>
    </div>
  `).join('');
}
