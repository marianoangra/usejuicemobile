// Saques avançado — filtros, bulk, ações inline, dup PIX, export CSV.
import { db } from './lib/firebase.js';
import {
  collection, query, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { fmtNum, fmtDateTime, fmtShort, esc } from './lib/fmt.js';
import { toast, confirmar } from './lib/ui.js';

// Estado do módulo (não global — escopo do init)
function novoEstado() {
  return {
    saques: [],                 // array de { id, ...data }
    usuarios: new Map(),        // uid -> data (snapshot leve)
    filtro: {
      status: 'todos',          // todos | pendente | processado | bloqueado
      janela: '30d',            // 7d | 30d | 90d | todos
      busca: '',                // matches nome/chavePix/uid
    },
    selecionados: new Set(),    // saque ids
  };
}

export async function init({ container, registerCleanup }) {
  const state = novoEstado();

  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">💰 Controle de Saques</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="count-badge" id="saques-resumo">…</span>
          <button id="btn-csv" class="btn-small btn-ok" style="border-color:#1a2535;color:#8a9a8a">⬇ Exportar CSV</button>
        </div>
      </div>

      <div class="card" style="padding:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <select id="f-status" class="filter-select">
          <option value="todos">Todos status</option>
          <option value="pendente">⏳ Pendentes</option>
          <option value="processado">✅ Processados</option>
          <option value="bloqueado">🚫 Bloqueados (user)</option>
        </select>
        <select id="f-janela" class="filter-select">
          <option value="7d">Últimos 7 dias</option>
          <option value="30d" selected>Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="todos">Toda história</option>
        </select>
        <input id="f-busca" placeholder="Buscar nome, PIX ou uid…" class="filter-input">
      </div>
    </div>

    <div class="grid-2" id="cards-resumo"></div>

    <div id="alert-pix" style="margin-bottom:16px"></div>

    <div id="bulk-bar" style="display:none;background:#2a1500;border:1px solid #FFB800;border-radius:10px;padding:10px 14px;margin-bottom:14px;align-items:center;justify-content:space-between;gap:10px">
      <span style="font-size:13px;color:#FFB800"><strong id="bulk-count">0</strong> saque(s) selecionado(s)</span>
      <div style="display:flex;gap:8px">
        <button id="bulk-marcar" class="btn-small btn-ok">✓ Marcar como Processados</button>
        <button id="bulk-limpar" class="btn-small" style="background:transparent;border:1px solid #1a2535;color:#8a9a8a">Limpar</button>
      </div>
    </div>

    <div class="section">
      <div id="tabela-host" class="table-wrap"></div>
    </div>
  `;

  // CSS extra inline pros filtros (não vale criar arquivo só pra isso)
  const styleId = 'saques-style';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      .filter-select,.filter-input{background:#0A0F1E;border:1px solid #1a2535;color:#fff;padding:8px 10px;border-radius:8px;font-size:13px}
      .filter-input{flex:1;min-width:200px}
      .filter-select:focus,.filter-input:focus{outline:none;border-color:#00FF88}
      .saques-table tr.selecionado{background:#1a2535}
      .saques-table .pix-dup{color:#FFB800;font-weight:600}
      .dup-card{background:#2a1500;border:1px solid #FFB800;border-radius:10px;padding:12px 14px;margin-bottom:10px}
      .dup-card-titulo{color:#FFB800;font-size:13px;font-weight:600;margin-bottom:6px}
      .dup-card-linha{font-size:12px;color:#fff;margin:2px 0;font-family:monospace}
      .dup-link{color:#9945FF;cursor:pointer;text-decoration:underline;background:none;border:none;padding:0;font:inherit}
      #bulk-bar{display:none}
      #bulk-bar.ativo{display:flex !important}
    `;
    document.head.appendChild(s);
  }

  // Filtros: handlers
  const fStatus = container.querySelector('#f-status');
  const fJanela = container.querySelector('#f-janela');
  const fBusca  = container.querySelector('#f-busca');
  fStatus.addEventListener('change', () => { state.filtro.status = fStatus.value; redesenha(); });
  fJanela.addEventListener('change', () => { state.filtro.janela = fJanela.value; redesenha(); });
  fBusca.addEventListener('input',   () => { state.filtro.busca  = fBusca.value;  redesenha(); });

  container.querySelector('#btn-csv').onclick = () => exportarCsv(state);
  container.querySelector('#bulk-limpar').onclick = () => { state.selecionados.clear(); redesenha(); };
  container.querySelector('#bulk-marcar').onclick = () => bulkMarcarProcessado(state, redesenha);

  // Subscribe saques (todos, ordenados por data desc — 74 docs hoje, dá pra carregar tudo)
  registerCleanup(onSnapshot(
    query(collection(db, 'saques'), orderBy('criadoEm', 'desc'), limit(500)),
    async snap => {
      state.saques = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Lazy-load users distintos pra ter flag saquesBloqueados / contaSuspeita / contaBanida
      const uidsNovos = new Set(state.saques.map(s => s.uid).filter(uid => uid && !state.usuarios.has(uid)));
      if (uidsNovos.size > 0) {
        const fetches = [...uidsNovos].map(uid =>
          getDoc(doc(db, 'usuarios', uid))
            .then(s => s.exists() ? [uid, s.data()] : [uid, null])
            .catch(() => [uid, null])
        );
        const resultados = await Promise.all(fetches);
        for (const [uid, data] of resultados) state.usuarios.set(uid, data);
      }
      redesenha();
    }
  ));

  function redesenha() {
    renderResumo(state, container);
    renderAlertPix(state, container);
    renderTabela(state, container, redesenha);
    renderBulkBar(state, container);
  }
}

// ─── Lógica de filtros ───────────────────────────────────────────────────────

function aplicarFiltros(state) {
  const { filtro } = state;
  const agora = Date.now();
  const janelaMs = filtro.janela === '7d'  ? 7  * 86400000
                : filtro.janela === '30d' ? 30 * 86400000
                : filtro.janela === '90d' ? 90 * 86400000
                : Infinity;
  const buscaLower = filtro.busca.trim().toLowerCase();

  return state.saques.filter(s => {
    const u = state.usuarios.get(s.uid);
    const bloq = u?.saquesBloqueados === true || u?.contaBanida === true || u?.contaSuspeita === true;

    // Status: pendente real = pendente E user limpo. bloqueado = pendente E user bloqueado.
    if (filtro.status === 'pendente'    && !(s.status === 'pendente' && !bloq)) return false;
    if (filtro.status === 'processado'  && s.status !== 'processado') return false;
    if (filtro.status === 'bloqueado'   && !(s.status === 'pendente' && bloq)) return false;

    // Janela de data
    if (janelaMs !== Infinity) {
      const t = s.criadoEm?.toDate?.()?.getTime?.() ?? (s.criadoEm?.seconds ? s.criadoEm.seconds * 1000 : 0);
      if (t && (agora - t) > janelaMs) return false;
    }

    // Busca textual
    if (buscaLower) {
      const blob = `${s.nome ?? ''} ${s.chavePix ?? ''} ${s.uid ?? ''} ${s.id}`.toLowerCase();
      if (!blob.includes(buscaLower)) return false;
    }
    return true;
  });
}

// ─── Renderizadores ──────────────────────────────────────────────────────────

// SLA público de saque: 72h. Pendentes acima disso aparecem destacados.
const PRAZO_SAQUE_HORAS = 72;
function horasDesde(ts) {
  if (!ts) return null;
  const ms = ts?.toDate?.()?.getTime?.()
    ?? (ts?.seconds ? ts.seconds * 1000 : null)
    ?? (typeof ts === 'string' ? new Date(ts).getTime() : null);
  if (!ms) return null;
  return Math.floor((Date.now() - ms) / 3600000);
}

function renderResumo(state, container) {
  // Totais globais (ignora filtro), mostra estado da operação
  let pend = 0, proc = 0, bloq = 0, ptsPend = 0, atrasados = 0, ptsAtrasados = 0;
  for (const s of state.saques) {
    const u = state.usuarios.get(s.uid);
    const userBloq = u?.saquesBloqueados === true || u?.contaBanida === true || u?.contaSuspeita === true;
    if (s.status === 'processado') proc++;
    else if (s.status === 'pendente' && userBloq) bloq++;
    else if (s.status === 'pendente') {
      pend++; ptsPend += Number(s.pontos ?? 0);
      const h = horasDesde(s.criadoEm);
      if (h != null && h >= PRAZO_SAQUE_HORAS) {
        atrasados++; ptsAtrasados += Number(s.pontos ?? 0);
      }
    }
  }
  const filtrados = aplicarFiltros(state).length;
  container.querySelector('#saques-resumo').textContent =
    `${filtrados} de ${state.saques.length} (filtro)`;

  const cards = container.querySelector('#cards-resumo');
  cards.innerHTML = `
    <div class="card y"><div class="card-label">Pendentes a pagar</div><div class="card-value yellow">${fmtNum(pend)}</div><div style="font-size:11px;color:#8a9a8a;margin-top:6px">${fmtNum(ptsPend)} pts</div></div>
    <div class="card r"><div class="card-label">⏰ Atrasados &gt;${PRAZO_SAQUE_HORAS}h</div><div class="card-value red">${fmtNum(atrasados)}</div><div style="font-size:11px;color:#8a9a8a;margin-top:6px">${fmtNum(ptsAtrasados)} pts · SLA estourado</div></div>
    <div class="card r"><div class="card-label">Bloqueados (antifraude)</div><div class="card-value red">${fmtNum(bloq)}</div></div>
    <div class="card g"><div class="card-label">Processados</div><div class="card-value green">${fmtNum(proc)}</div></div>
    <div class="card p"><div class="card-label">Total no DB</div><div class="card-value purple">${fmtNum(state.saques.length)}</div></div>
  `;
}

function renderAlertPix(state, container) {
  // Agrupa por chavePix e detecta múltiplos UIDs no mesmo PIX (sinal de farm)
  const porPix = new Map();
  for (const s of state.saques) {
    if (!s.chavePix) continue;
    const k = s.chavePix.trim();
    if (!porPix.has(k)) porPix.set(k, []);
    porPix.get(k).push(s);
  }
  const suspeitos = [];
  for (const [pix, lista] of porPix) {
    const uids = new Set(lista.map(s => s.uid));
    if (uids.size >= 2) {
      // Mesmo PIX em 2+ contas distintas — bandeira
      suspeitos.push({ pix, total: lista.length, uids: uids.size, lista });
    }
  }
  suspeitos.sort((a,b) => b.total - a.total);

  const host = container.querySelector('#alert-pix');
  if (!suspeitos.length) { host.innerHTML = ''; return; }

  host.innerHTML = suspeitos.map(g => `
    <div class="dup-card">
      <div class="dup-card-titulo">⚠️ PIX duplicado: <span style="font-family:monospace">${esc(g.pix)}</span> — ${g.total} saques em ${g.uids} contas</div>
      ${g.lista.map(s => `<div class="dup-card-linha">• ${esc(s.nome)} · ${fmtNum(s.pontos)} pts · ${fmtDateTime(s.criadoEm)} · uid ${esc(fmtShort(s.uid, 6, 4))}</div>`).join('')}
      <div style="margin-top:6px"><button class="dup-link" data-pix="${esc(g.pix)}">→ filtrar essa chave PIX</button></div>
    </div>
  `).join('');

  host.querySelectorAll('button.dup-link').forEach(btn => {
    btn.onclick = () => {
      const f = container.querySelector('#f-busca');
      f.value = btn.dataset.pix;
      state.filtro.busca = btn.dataset.pix;
      // re-render
      container.querySelector('#f-janela').value = 'todos';
      state.filtro.janela = 'todos';
      const evento = new Event('redesenha');
      f.dispatchEvent(evento);
      // chama redesenha via dispatch manual: mais simples chamar diretamente
      // (já que init criou o closure)
      // Solução: dispara input event que já é escutado
      f.dispatchEvent(new Event('input'));
    };
  });
}

function renderTabela(state, container, redesenha) {
  const rows = aplicarFiltros(state);
  const host = container.querySelector('#tabela-host');

  if (!rows.length) {
    host.innerHTML = `<div class="empty">Nenhum saque com esses filtros.</div>`;
    return;
  }

  // Conta quantas vezes cada PIX aparece pra destacar duplicados
  const pixCount = new Map();
  for (const s of state.saques) {
    const k = (s.chavePix ?? '').trim();
    if (k) pixCount.set(k, (pixCount.get(k) ?? 0) + 1);
  }

  const head = `
    <thead><tr>
      <th style="width:30px"><input type="checkbox" id="check-all"></th>
      <th>Nome</th>
      <th>Chave PIX</th>
      <th>Pontos</th>
      <th>Status</th>
      <th>Conta</th>
      <th>Data</th>
      <th>Ações</th>
    </tr></thead>
  `;
  const body = rows.map(s => {
    const u = state.usuarios.get(s.uid);
    const userBloq = u?.saquesBloqueados === true || u?.contaBanida === true || u?.contaSuspeita === true;
    const isPend = s.status === 'pendente' && !userBloq;
    const dup = pixCount.get((s.chavePix ?? '').trim()) > 1;
    const checked = state.selecionados.has(s.id);
    const statusTexto = s.status === 'processado' ? 'processado'
                      : userBloq && s.status === 'pendente' ? 'bloqueado'
                      : s.status ?? 'pendente';
    const statusBadge = s.status === 'processado' ? 'status-processado'
                      : userBloq && s.status === 'pendente' ? 'status-bloqueado'
                      : 'status-pendente';
    const contaInfo = userBloq
      ? `<span style="color:#ff4d4d;font-size:11px">🚫 ${esc(u?.motivoBloqueio?.slice?.(0, 40) ?? 'bloqueado')}…</span>`
      : `<span style="color:#8a9a8a;font-size:11px">ok</span>`;
    const horasPend = isPend ? horasDesde(s.criadoEm) : null;
    const atrasado = horasPend != null && horasPend >= PRAZO_SAQUE_HORAS;
    const badgeAtraso = atrasado
      ? `<div style="margin-top:3px"><span style="background:#3a0e0e;color:#ff7a7a;font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;letter-spacing:.3px">⏰ atrasado ${horasPend}h</span></div>`
      : '';
    return `
      <tr class="${checked ? 'selecionado' : ''}" data-id="${esc(s.id)}">
        <td><input type="checkbox" class="row-check" data-id="${esc(s.id)}" ${checked ? 'checked' : ''} ${isPend ? '' : 'disabled'}></td>
        <td><a href="#usuarios?uid=${esc(s.uid)}" style="color:#fff;text-decoration:none;border-bottom:1px dotted #8a9a8a">${esc(s.nome)}</a></td>
        <td style="font-family:monospace;font-size:12px" class="${dup ? 'pix-dup' : ''}">${esc(s.chavePix)}${dup ? ' ⚠️' : ''}</td>
        <td>${fmtNum(s.pontos)}</td>
        <td><span class="status-badge ${statusBadge}">${esc(statusTexto)}</span></td>
        <td>${contaInfo}</td>
        <td>${fmtDateTime(s.criadoEm)}${badgeAtraso}</td>
        <td style="white-space:nowrap">
          ${isPend ? `<button class="btn-small btn-ok" data-acao="processar" data-id="${esc(s.id)}">✓ Pago</button>` : ''}
          ${isPend ? `<button class="btn-small btn-danger" data-acao="bloquear" data-uid="${esc(s.uid)}" data-nome="${esc(s.nome)}">🚫 Bloq.</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  host.innerHTML = `<table class="saques-table">${head}<tbody>${body}</tbody></table>`;

  // Handlers
  const checkAll = host.querySelector('#check-all');
  checkAll.onchange = () => {
    if (checkAll.checked) {
      rows.forEach(s => {
        const u = state.usuarios.get(s.uid);
        const userBloq = u?.saquesBloqueados === true;
        if (s.status === 'pendente' && !userBloq) state.selecionados.add(s.id);
      });
    } else {
      rows.forEach(s => state.selecionados.delete(s.id));
    }
    redesenha();
  };
  host.querySelectorAll('.row-check').forEach(c => {
    c.onchange = () => {
      if (c.checked) state.selecionados.add(c.dataset.id);
      else state.selecionados.delete(c.dataset.id);
      redesenha();
    };
  });
  host.querySelectorAll('button[data-acao="processar"]').forEach(btn => {
    btn.onclick = () => marcarProcessado(btn.dataset.id);
  });
  host.querySelectorAll('button[data-acao="bloquear"]').forEach(btn => {
    btn.onclick = () => bloquearUsuario(btn.dataset.uid, btn.dataset.nome, state, redesenha);
  });
}

function renderBulkBar(state, container) {
  const bar = container.querySelector('#bulk-bar');
  const count = container.querySelector('#bulk-count');
  if (state.selecionados.size > 0) {
    bar.classList.add('ativo');
    count.textContent = state.selecionados.size;
  } else {
    bar.classList.remove('ativo');
  }
}

// ─── Ações ───────────────────────────────────────────────────────────────────

async function marcarProcessado(id) {
  try {
    await updateDoc(doc(db, 'saques', id), { status: 'processado', processadoEm: new Date() });
    toast('Saque marcado como processado.', 'ok');
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
  }
}

async function bulkMarcarProcessado(state, redesenha) {
  const ids = [...state.selecionados];
  if (!ids.length) return;
  const ok = await confirmar(
    'Marcar como processados',
    `Vai marcar ${ids.length} saque(s) como pagos. Os usuários NÃO recebem nada agora — esta ação só atualiza o status no app. Tem certeza?`,
    { confirmar: `Marcar ${ids.length}` }
  );
  if (!ok) return;
  let sucessos = 0, falhas = 0;
  for (const id of ids) {
    try {
      await updateDoc(doc(db, 'saques', id), { status: 'processado', processadoEm: new Date() });
      sucessos++;
    } catch (e) { falhas++; console.error('falha em', id, e); }
  }
  state.selecionados.clear();
  toast(`${sucessos} processado(s)${falhas ? `, ${falhas} falha(s)` : ''}.`, falhas ? 'aviso' : 'ok');
  redesenha?.();
}

async function bloquearUsuario(uid, nome, state, redesenha) {
  const motivo = prompt(`Bloquear saques de "${nome}" (${uid})?\n\nMotivo do bloqueio (será mostrado ao user):`,
    'Saque bloqueado preventivamente para análise de segurança. Entre em contato: contato@rafaelmariano.com.br');
  if (!motivo) return;
  try {
    await updateDoc(doc(db, 'usuarios', uid), {
      saquesBloqueados: true,
      motivoBloqueio: motivo,
      bloqueadoEm: new Date(),
      bloqueadoPor: 'admin',
    });
    // Atualiza cache local pra UI refletir imediatamente (não tem snapshot em usuarios/)
    state.usuarios.set(uid, {
      ...(state.usuarios.get(uid) ?? {}),
      saquesBloqueados: true,
      motivoBloqueio: motivo,
    });
    redesenha?.();
    toast(`${nome} bloqueado.`, 'ok');
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
  }
}

// ─── Export CSV ──────────────────────────────────────────────────────────────

function exportarCsv(state) {
  const rows = aplicarFiltros(state);
  if (!rows.length) { toast('Nada pra exportar com esse filtro.', 'aviso'); return; }
  const escapeCsv = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [
    'id,nome,chavePix,pontos,status,uid,saquesBloqueados,motivoBloqueio,criadoEm',
    ...rows.map(s => {
      const u = state.usuarios.get(s.uid);
      return [
        s.id, s.nome, s.chavePix, s.pontos, s.status, s.uid,
        u?.saquesBloqueados ?? false, u?.motivoBloqueio ?? '', fmtDateTime(s.criadoEm),
      ].map(escapeCsv).join(',');
    }),
  ];
  const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `saques-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`${rows.length} saque(s) exportado(s).`, 'ok');
}
