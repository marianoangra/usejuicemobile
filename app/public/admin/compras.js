// Compras de pontos — reconcilia solicitações históricas, credita pts ao confirmar.
import { db, functions } from './lib/firebase.js';
import {
  collection, query, orderBy, limit, onSnapshot, doc, updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js';
import { fmtNum, fmtDateTime, esc } from './lib/fmt.js';
import { toast, confirmar } from './lib/ui.js';

const confirmarCompraFn = httpsCallable(functions, 'confirmarCompra');

function novoEstado() {
  return {
    compras: [],
    filtro: {
      status: 'todos',  // todos | aguardando | confirmado | rejeitado
      janela: 'todos',  // 30d | 90d | todos
      busca: '',
    },
  };
}

export async function init({ container, registerCleanup }) {
  const state = novoEstado();

  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">💵 Compras de pontos (histórico)</div>
        <span class="count-badge" id="compras-resumo">…</span>
      </div>
      <p style="font-size:12px;color:#8a9a8a;margin-bottom:12px">
        Fluxo descontinuado em maio/2026. Esses são docs históricos pra reconciliação. Confirmar credita os pontos no usuário via Cloud Function (atomico, idempotente).
      </p>

      <div class="card" style="padding:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <select id="f-status" class="filter-select">
          <option value="todos">Todos status</option>
          <option value="aguardando">⏳ Aguardando</option>
          <option value="confirmado">✅ Confirmados</option>
          <option value="rejeitado">🚫 Rejeitados</option>
        </select>
        <select id="f-janela" class="filter-select">
          <option value="30d">Últimos 30d</option>
          <option value="90d">Últimos 90d</option>
          <option value="todos" selected>Toda história</option>
        </select>
        <input id="f-busca" placeholder="Buscar nome, email ou uid…" class="filter-input">
      </div>
    </div>

    <div class="grid-2" id="cards-resumo"></div>

    <div class="section">
      <div id="tabela-host" class="table-wrap"></div>
    </div>
  `;

  // Filtros
  const fStatus = container.querySelector('#f-status');
  const fJanela = container.querySelector('#f-janela');
  const fBusca  = container.querySelector('#f-busca');
  fStatus.addEventListener('change', () => { state.filtro.status = fStatus.value; redesenha(); });
  fJanela.addEventListener('change', () => { state.filtro.janela = fJanela.value; redesenha(); });
  fBusca.addEventListener('input',   () => { state.filtro.busca  = fBusca.value;  redesenha(); });

  registerCleanup(onSnapshot(
    query(collection(db, 'solicitacoes_compra'), orderBy('criadoEm', 'desc'), limit(500)),
    snap => {
      state.compras = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      redesenha();
    },
    err => {
      console.error('Erro carregando compras:', err);
      container.querySelector('#tabela-host').innerHTML =
        `<div class="empty">❌ Falha ao carregar: ${esc(err.message)}</div>`;
    }
  ));

  function redesenha() {
    renderResumo(state, container);
    renderTabela(state, container, redesenha);
  }
}

function aplicarFiltros(state) {
  const { filtro } = state;
  const agora = Date.now();
  const janelaMs = filtro.janela === '30d' ? 30 * 86400000
                : filtro.janela === '90d' ? 90 * 86400000
                : Infinity;
  const buscaLower = filtro.busca.trim().toLowerCase();

  return state.compras.filter(c => {
    const statusCheck = c.status ?? 'aguardando'; // default
    if (filtro.status !== 'todos' && statusCheck !== filtro.status) return false;
    if (janelaMs !== Infinity) {
      const t = c.criadoEm?.toDate?.()?.getTime?.() ?? (c.criadoEm?.seconds ? c.criadoEm.seconds * 1000 : 0);
      if (t && (agora - t) > janelaMs) return false;
    }
    if (buscaLower) {
      const blob = `${c.nome ?? ''} ${c.email ?? ''} ${c.uid ?? ''} ${c.id}`.toLowerCase();
      if (!blob.includes(buscaLower)) return false;
    }
    return true;
  });
}

function renderResumo(state, container) {
  let aguardando = 0, confirmado = 0, rejeitado = 0, brlAguardando = 0, ptsConfirmados = 0;
  for (const c of state.compras) {
    const status = c.status ?? 'aguardando';
    if (status === 'confirmado') { confirmado++; ptsConfirmados += Number(c.cnbCalculado ?? 0); }
    else if (status === 'rejeitado') rejeitado++;
    else { aguardando++; brlAguardando += Number(c.valorBRL ?? 0); }
  }
  const filtrados = aplicarFiltros(state).length;
  container.querySelector('#compras-resumo').textContent =
    `${filtrados} de ${state.compras.length} (filtro)`;

  container.querySelector('#cards-resumo').innerHTML = `
    <div class="card y"><div class="card-label">Aguardando</div><div class="card-value yellow">${fmtNum(aguardando)}</div><div style="font-size:11px;color:#8a9a8a;margin-top:6px">R$ ${brlAguardando.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
    <div class="card g"><div class="card-label">Confirmados</div><div class="card-value green">${fmtNum(confirmado)}</div><div style="font-size:11px;color:#8a9a8a;margin-top:6px">${fmtNum(ptsConfirmados)} pts creditados</div></div>
    <div class="card r"><div class="card-label">Rejeitados</div><div class="card-value red">${fmtNum(rejeitado)}</div></div>
    <div class="card p"><div class="card-label">Total no DB</div><div class="card-value purple">${fmtNum(state.compras.length)}</div></div>
  `;
}

function renderTabela(state, container, redesenha) {
  const rows = aplicarFiltros(state);
  const host = container.querySelector('#tabela-host');
  if (!rows.length) {
    host.innerHTML = `<div class="empty">Nenhuma compra com esses filtros.</div>`;
    return;
  }

  const head = `
    <thead><tr>
      <th>Cliente</th>
      <th>Email</th>
      <th>Valor R$</th>
      <th>Pontos</th>
      <th>Status</th>
      <th>Data</th>
      <th>Ações</th>
    </tr></thead>
  `;
  const body = rows.map(c => {
    const status = c.status ?? 'aguardando';
    const badge = status === 'confirmado' ? 'status-processado'
                : status === 'rejeitado'  ? 'status-bloqueado'
                : 'status-pendente';
    const isAguardando = status === 'aguardando' || !c.status;
    return `
      <tr data-id="${esc(c.id)}">
        <td>${esc(c.nome)}</td>
        <td style="font-size:12px">${esc(c.email)}</td>
        <td>R$ ${Number(c.valorBRL ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>${fmtNum(c.cnbCalculado)}</td>
        <td><span class="status-badge ${badge}">${esc(status)}</span></td>
        <td>${fmtDateTime(c.criadoEm)}</td>
        <td style="white-space:nowrap">
          ${isAguardando ? `<button class="btn-small btn-ok" data-acao="confirmar" data-id="${esc(c.id)}">✓ Confirmar</button>` : ''}
          ${isAguardando ? `<button class="btn-small btn-danger" data-acao="rejeitar" data-id="${esc(c.id)}">🚫 Rejeitar</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  host.innerHTML = `<table>${head}<tbody>${body}</tbody></table>`;

  host.querySelectorAll('button[data-acao="confirmar"]').forEach(btn => {
    btn.onclick = () => confirmarCompra(btn.dataset.id, state, redesenha);
  });
  host.querySelectorAll('button[data-acao="rejeitar"]').forEach(btn => {
    btn.onclick = () => rejeitarCompra(btn.dataset.id, state, redesenha);
  });
}

async function confirmarCompra(id, state, redesenha) {
  const c = state.compras.find(x => x.id === id);
  if (!c) return;
  const ok = await confirmar(
    'Confirmar compra de pontos',
    `Vai creditar ${fmtNum(c.cnbCalculado)} pts em ${esc(c.nome)} (${esc(c.email)}).\n\nEssa ação é atômica e idempotente. Confere se o PIX de R$ ${Number(c.valorBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} caiu antes de confirmar.`,
    { confirmar: 'Creditar e confirmar' }
  );
  if (!ok) return;
  try {
    const res = await confirmarCompraFn({ id });
    if (res.data.jaConfirmado) {
      toast('Já estava confirmada (idempotente).', 'aviso');
    } else {
      toast(`✓ ${fmtNum(res.data.creditados)} pts creditados.`, 'ok');
    }
  } catch (e) {
    toast('Erro: ' + (e.message ?? e.code), 'erro');
    console.error('confirmarCompra falhou:', e);
  }
}

async function rejeitarCompra(id, state, redesenha) {
  const motivo = prompt('Motivo da rejeição (opcional, fica no doc):', '');
  if (motivo === null) return; // cancelou
  try {
    await updateDoc(doc(db, 'solicitacoes_compra', id), {
      status: 'rejeitado',
      rejeitadoEm: new Date(),
      motivoRejeicao: motivo || null,
    });
    toast('Compra rejeitada.', 'ok');
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
  }
}
