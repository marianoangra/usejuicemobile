// Bot — conversas do Telegram bot do Juice, agrupadas por usuário.
// Coleção Firestore: bot_conversations. Escrita pelo bot via Admin SDK.
import { db } from './lib/firebase.js';
import {
  collection, query, orderBy, limit, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { fmtNum, fmtDateTime, fmtRelative, esc } from './lib/fmt.js';

function novoEstado() {
  return {
    conversas: [],              // array bruto de { id, ...doc }
    busca: '',                  // filtro textual (username, nome, pergunta, resposta)
    expandido: null,            // telegramUserId atualmente expandido (1 por vez)
  };
}

export async function init({ container, registerCleanup }) {
  const state = novoEstado();

  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">🤖 Conversas do Bot</div>
        <span class="count-badge" id="bot-resumo">…</span>
      </div>
      <div class="card" style="padding:14px">
        <input id="bot-busca" placeholder="Buscar @username, nome, pergunta ou resposta…" class="bot-filter-input">
      </div>
    </div>

    <div class="grid-2" id="bot-cards"></div>

    <div class="section">
      <div id="bot-host" class="table-wrap"></div>
    </div>
  `;

  // CSS específico do módulo
  const styleId = 'bot-style';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      .bot-filter-input{width:100%;background:#0A0F1E;border:1px solid #1a2535;color:#fff;padding:10px 12px;border-radius:8px;font-size:13px}
      .bot-filter-input:focus{outline:none;border-color:#00FF88}
      .bot-row{cursor:pointer;transition:.15s}
      .bot-row.aberto{background:#111827}
      .bot-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#00FF88,#9945FF);display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#0A0F1E;font-size:13px;flex-shrink:0}
      .bot-user-cell{display:flex;align-items:center;gap:10px;min-width:0}
      .bot-user-meta{min-width:0;display:flex;flex-direction:column;gap:2px}
      .bot-user-name{color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
      .bot-user-handle{color:#8a9a8a;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
      .bot-preview{color:#8a9a8a;font-size:12px;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .bot-cmd-pill{display:inline-block;background:#1a2535;color:#9945FF;font-family:monospace;font-size:11px;padding:1px 6px;border-radius:4px;margin-right:6px}
      .bot-thread{background:#0A0F1E;padding:18px;border-top:1px solid #1a2535}
      .bot-turn{margin-bottom:14px}
      .bot-turn:last-child{margin-bottom:0}
      .bot-bubble-user{background:#162033;border:1px solid #1a2535;border-radius:12px 12px 12px 2px;padding:9px 13px;color:#fff;font-size:13px;max-width:80%;white-space:pre-wrap;word-break:break-word;line-height:1.45}
      .bot-bubble-bot{background:#0d1f0d;border:1px solid #1a3a1a;border-radius:12px 12px 2px 12px;padding:9px 13px;color:#cfe9d1;font-size:13px;max-width:80%;margin-left:auto;white-space:pre-wrap;word-break:break-word;line-height:1.45}
      .bot-turn-meta{font-size:10px;color:#555;margin-top:4px;text-align:right}
      .bot-turn-meta.left{text-align:left}
      .bot-arrow{display:inline-block;width:14px;text-align:center;color:#8a9a8a;transition:transform .15s}
      .bot-row.aberto .bot-arrow{transform:rotate(90deg);color:#00FF88}
    `;
    document.head.appendChild(s);
  }

  const inputBusca = container.querySelector('#bot-busca');
  inputBusca.addEventListener('input', () => {
    state.busca = inputBusca.value.trim().toLowerCase();
    redesenha();
  });

  // Subscribe — descendente pra mais recentes primeiro, hard-cap 1000.
  registerCleanup(onSnapshot(
    query(collection(db, 'bot_conversations'), orderBy('criadoEm', 'desc'), limit(1000)),
    snap => {
      state.conversas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      redesenha();
    },
    err => {
      console.error('Falha ao ler bot_conversations:', err);
      container.querySelector('#bot-host').innerHTML = `
        <div class="empty">
          ❌ Falha ao carregar. Provável: regras do Firestore ainda não permitem leitura.<br>
          Deploy: <code>firebase deploy --only firestore:rules</code>
        </div>`;
    }
  ));

  function redesenha() {
    renderCards(state, container);
    renderResumo(state, container);
    renderUsuarios(state, container);
  }
}

// ─── Agregação ─────────────────────────────────────────────────────────────

// Agrupa conversas por telegramUserId. Cada usuário traz totais + última atividade.
function agruparPorUsuario(state) {
  const porUser = new Map();
  for (const c of state.conversas) {
    const uid = c.telegramUserId;
    if (uid == null) continue;
    let g = porUser.get(uid);
    if (!g) {
      g = {
        userId: uid,
        username: c.telegramUsername ?? null,
        firstName: c.telegramFirstName ?? null,
        lastName: c.telegramLastName ?? null,
        totalMsgs: 0,
        comandos: 0,
        livres: 0,
        ultimaAt: null,    // timestamp da última conversa (mais recente)
        primeiraAt: null,
        ultimaPergunta: '',
        turnos: [],        // {pergunta, resposta, criadoEm, isCommand, command, inputTokens, outputTokens, id}
      };
      porUser.set(uid, g);
    }
    g.totalMsgs++;
    if (c.isCommand) g.comandos++; else g.livres++;
    // Mantém metadata mais recente do user (pode ter mudado username/nome)
    if (c.telegramUsername) g.username = c.telegramUsername;
    if (c.telegramFirstName) g.firstName = c.telegramFirstName;
    if (c.telegramLastName) g.lastName = c.telegramLastName;
    g.turnos.push(c);
  }
  for (const g of porUser.values()) {
    // turnos vêm do firestore em desc — ordena asc pra exibir cronologicamente
    g.turnos.sort((a, b) => tsMs(a.criadoEm) - tsMs(b.criadoEm));
    g.primeiraAt = g.turnos[0]?.criadoEm ?? null;
    const ultimo = g.turnos[g.turnos.length - 1];
    g.ultimaAt = ultimo?.criadoEm ?? null;
    g.ultimaPergunta = ultimo?.question ?? '';
  }
  return [...porUser.values()].sort((a, b) => tsMs(b.ultimaAt) - tsMs(a.ultimaAt));
}

function tsMs(ts) {
  if (!ts) return 0;
  if (ts?.toDate) return ts.toDate().getTime();
  if (ts?.seconds) return ts.seconds * 1000;
  if (typeof ts === 'string') return new Date(ts).getTime() || 0;
  return 0;
}

function aplicarFiltro(usuarios, busca) {
  if (!busca) return usuarios;
  return usuarios.filter(u => {
    const blob = `${u.username ?? ''} ${u.firstName ?? ''} ${u.lastName ?? ''} ${u.userId} ${u.ultimaPergunta ?? ''}`.toLowerCase();
    if (blob.includes(busca)) return true;
    // Busca também em qualquer turno
    return u.turnos.some(t =>
      (t.question ?? '').toLowerCase().includes(busca)
      || (t.answer ?? '').toLowerCase().includes(busca)
    );
  });
}

function nomeExibicao(u) {
  if (u.firstName) {
    return (u.firstName + (u.lastName ? ' ' + u.lastName : '')).trim();
  }
  if (u.username) return '@' + u.username;
  return 'ID ' + u.userId;
}

function iniciais(u) {
  const base = u.firstName || u.username || String(u.userId);
  return base.slice(0, 2).toUpperCase();
}

// ─── Render ────────────────────────────────────────────────────────────────

function renderCards(state, container) {
  const agora = Date.now();
  const umDia = 24 * 3600 * 1000;
  let totalMsgs = state.conversas.length;
  let msgsHoje = 0;
  const usuariosUnicos = new Set();
  const usuariosHoje = new Set();
  for (const c of state.conversas) {
    if (c.telegramUserId != null) usuariosUnicos.add(c.telegramUserId);
    const t = tsMs(c.criadoEm);
    if (t && (agora - t) <= umDia) {
      msgsHoje++;
      if (c.telegramUserId != null) usuariosHoje.add(c.telegramUserId);
    }
  }
  container.querySelector('#bot-cards').innerHTML = `
    <div class="card g"><div class="card-label">Total mensagens</div><div class="card-value green">${fmtNum(totalMsgs)}</div></div>
    <div class="card p"><div class="card-label">Usuários únicos</div><div class="card-value purple">${fmtNum(usuariosUnicos.size)}</div></div>
    <div class="card y"><div class="card-label">Mensagens (24h)</div><div class="card-value yellow">${fmtNum(msgsHoje)}</div></div>
    <div class="card"><div class="card-label">Usuários (24h)</div><div class="card-value">${fmtNum(usuariosHoje.size)}</div></div>
  `;
}

function renderResumo(state, container) {
  const todos = agruparPorUsuario(state);
  const filtrados = aplicarFiltro(todos, state.busca).length;
  container.querySelector('#bot-resumo').textContent =
    state.busca ? `${filtrados} de ${todos.length} usuário(s)` : `${todos.length} usuário(s)`;
}

function renderUsuarios(state, container) {
  const todos = agruparPorUsuario(state);
  const usuarios = aplicarFiltro(todos, state.busca);
  const host = container.querySelector('#bot-host');

  if (!state.conversas.length) {
    host.innerHTML = `<div class="empty">Nenhuma conversa ainda. Quando o bot responder alguém, aparece aqui.</div>`;
    return;
  }
  if (!usuarios.length) {
    host.innerHTML = `<div class="empty">Nada bate com a busca "${esc(state.busca)}".</div>`;
    return;
  }

  const head = `
    <thead><tr>
      <th style="width:30px"></th>
      <th>Usuário</th>
      <th style="width:80px;text-align:right">Mensagens</th>
      <th>Última pergunta</th>
      <th style="width:130px">Última atividade</th>
    </tr></thead>
  `;

  const body = usuarios.map(u => {
    const aberto = state.expandido === u.userId;
    const nome = nomeExibicao(u);
    const handle = u.username ? '@' + u.username : `id ${u.userId}`;
    const previewQ = (u.ultimaPergunta ?? '').slice(0, 80);
    const isCmdPreview = previewQ.startsWith('/');

    const linha = `
      <tr class="bot-row ${aberto ? 'aberto' : ''}" data-uid="${esc(u.userId)}">
        <td><span class="bot-arrow">▸</span></td>
        <td>
          <div class="bot-user-cell">
            <div class="bot-avatar">${esc(iniciais(u))}</div>
            <div class="bot-user-meta">
              <span class="bot-user-name">${esc(nome)}</span>
              <span class="bot-user-handle">${esc(handle)}</span>
            </div>
          </div>
        </td>
        <td style="text-align:right">
          <strong>${fmtNum(u.totalMsgs)}</strong>
          <div style="font-size:10px;color:#555">${fmtNum(u.comandos)} cmd · ${fmtNum(u.livres)} chat</div>
        </td>
        <td>
          <div class="bot-preview">
            ${isCmdPreview ? `<span class="bot-cmd-pill">${esc(previewQ.split(/\s+/)[0])}</span>` : ''}
            ${esc(previewQ.replace(/^\/\S+\s*/, '')) || '<span style="color:#555">—</span>'}
          </div>
        </td>
        <td style="color:#8a9a8a;font-size:12px">${esc(fmtRelative(u.ultimaAt))}</td>
      </tr>
    `;

    if (!aberto) return linha;

    // Thread expandida
    const turnos = u.turnos.map(t => {
      const meta = `${fmtDateTime(t.criadoEm)}${t.inputTokens != null ? ` · ${fmtNum(t.inputTokens)} in / ${fmtNum(t.outputTokens)} out` : ''}`;
      return `
        <div class="bot-turn">
          <div class="bot-bubble-user">${esc(t.question ?? '—')}</div>
          <div class="bot-turn-meta left">${esc(meta)}</div>
          ${t.answer ? `
            <div class="bot-bubble-bot" style="margin-top:6px">${esc(t.answer)}</div>
            <div class="bot-turn-meta">resposta do bot${t.isCommand ? ' · comando' : ''}</div>
          ` : ''}
        </div>
      `;
    }).join('');

    const thread = `
      <tr class="bot-thread-row">
        <td colspan="5" style="padding:0">
          <div class="bot-thread">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
              <div style="color:#8a9a8a;font-size:12px">
                Primeira interação: <strong style="color:#fff">${esc(fmtDateTime(u.primeiraAt))}</strong> ·
                Total: <strong style="color:#fff">${fmtNum(u.totalMsgs)} mensagens</strong>
              </div>
              <a href="https://t.me/${esc(u.username || '')}" target="_blank" rel="noopener"
                 style="font-size:12px;color:#9945FF;text-decoration:none;${u.username ? '' : 'pointer-events:none;opacity:.3'}">
                ↗ abrir no Telegram
              </a>
            </div>
            ${turnos}
          </div>
        </td>
      </tr>
    `;

    return linha + thread;
  }).join('');

  host.innerHTML = `<table>${head}<tbody>${body}</tbody></table>`;

  host.querySelectorAll('tr.bot-row').forEach(tr => {
    tr.addEventListener('click', () => {
      const uid = Number(tr.dataset.uid);
      state.expandido = state.expandido === uid ? null : uid;
      renderUsuarios(state, container);
    });
  });
}
