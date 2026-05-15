// Antifraude — investigação de saques.
// Cruzamento /saques + /usuarios. Bloqueio segue padrão do onReferreeBecameActive:
// marca usuário com saquesBloqueados + motivoBloqueio (texto amigável).
import { db } from './lib/firebase.js';
import {
  collection, getDocs, doc, updateDoc, serverTimestamp, addDoc, query, orderBy,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { fmtNum, fmtRelative, fmtShort, esc } from './lib/fmt.js';
import { toast, confirmar } from './lib/ui.js';

const LIMIT_PTS_PER_MIN = 60;     // teto teórico: 10/min + 50/h bônus ~ 60 pts/min
const MIN_THRESHOLD_PTS = 50000;  // só flaga ratio acima desse volume
const RATIO_TOLERANCIA = 1.5;     // ratio acima de 1.5× o teórico = suspeito

const MOTIVOS_AMIGAVEIS = {
  pix_duplicada: 'Identificamos que a mesma chave PIX foi cadastrada em mais de uma conta. Por segurança, seus saques foram bloqueados pra revisão manual. Se for engano, entre em contato com o suporte.',
  sub60_threshold: 'Identificamos saques solicitados antes do tempo mínimo de atividade verificada (60 minutos de carregamento). Por segurança, seus saques foram bloqueados pra revisão manual.',
  ratio_anomalo: 'Identificamos volume de pontos incompatível com o tempo de uso verificado. Por segurança, seus saques foram bloqueados pra revisão manual.',
};

export async function init({ container }) {
  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">🚫 Antifraude — investigação de saques</div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="count-badge" id="fraude-resumo">carregando…</span>
          <button id="btn-recarregar" class="btn-small btn-ok">↻ Reanalisar</button>
        </div>
      </div>
      <div class="card" style="padding:12px;font-size:12px;color:#8a9a8a;line-height:1.5">
        Investigação automatizada cruzando <code>/saques</code> com <code>/usuarios</code>.
        Bloquear marca o usuário com <code>saquesBloqueados: true</code> + <code>motivoBloqueio</code> —
        mesmo padrão do trigger antifraude já existente. Atinge todos os saques pendentes E futuros do uid.
        Reversível: usar botão <strong>Desbloquear</strong>.
      </div>
    </div>

    <div class="grid-2" id="fraude-cards"></div>

    <div class="section">
      <div class="section-header"><div class="section-title">🔥 Chaves PIX duplicadas (collusion)</div><span class="count-badge" id="cnt-pix">…</span></div>
      <div id="bloco-pix"></div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">🚨 Sacou com &lt; 60 minutos verificados</div><span class="count-badge" id="cnt-sub60">…</span></div>
      <div id="bloco-sub60"></div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">⚠️ Ratio pontos/minutos desproporcional</div><span class="count-badge" id="cnt-ratio">…</span></div>
      <div id="bloco-ratio"></div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">⏰ Pendentes parados há mais de 7 dias</div><span class="count-badge" id="cnt-antigo">…</span></div>
      <div id="bloco-antigo"></div>
    </div>

    <div class="section" style="opacity:.7">
      <div class="section-header"><div class="section-title">📝 Audit log recente (/ajustes_manuais)</div></div>
      <div id="bloco-audit"></div>
    </div>
  `;

  if (!document.getElementById('fraude-style')) {
    const s = document.createElement('style');
    s.id = 'fraude-style';
    s.textContent = `
      .flag-card{background:#0d1421;border:1px solid #1a2535;border-radius:10px;padding:14px;margin-bottom:10px}
      .flag-card.critico{border-left:3px solid #ff4d4d}
      .flag-card.alto{border-left:3px solid #FFB800}
      .flag-card.medio{border-left:3px solid #6db8e0}
      .flag-card h4{font-size:13px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px}
      .flag-card .tag{font-size:10px;background:#1a2535;color:#8a9a8a;padding:2px 8px;border-radius:6px;text-transform:uppercase;white-space:nowrap}
      .flag-card .tag.critico{background:#3a0e0e;color:#ff7a7a}
      .flag-card .tag.alto{background:#3a2400;color:#FFB800}
      .flag-card .row{font-size:12px;color:#8a9a8a;display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:7px 0;border-top:1px dotted #1a2535;align-items:center}
      .flag-card .row:first-of-type{border-top:0}
      .flag-card .row .nome{color:#fff;font-weight:600}
      .flag-card .row .meta{font-family:ui-monospace,Menlo,monospace;font-size:11px}
      .flag-card .row.bloqueado .nome::before{content:"🚫 "; }
      .flag-card .row.bloqueado{opacity:.55}
      .flag-card .acoes{display:flex;gap:6px}
      .btn-fraude{font-size:11px;padding:4px 10px;border-radius:6px;cursor:pointer;font-weight:600;border:1px solid}
      .btn-fraude.danger{background:#3a0e0e;color:#ff7a7a;border-color:#ff4d4d}
      .btn-fraude.warn{background:#3a2400;color:#FFB800;border-color:#FFB800}
      .btn-fraude.ghost{background:transparent;color:#8a9a8a;border-color:#1a2535}
      .btn-fraude:hover{filter:brightness(1.25)}
      .kpi-card{background:#0d1421;border:1px solid #1a2535;border-radius:10px;padding:14px}
      .kpi-card .v{font-size:24px;font-weight:800;color:#FFB800}
      .kpi-card .v.danger{color:#ff7a7a}
      .kpi-card .v.ok{color:#00FF88}
      .kpi-card .l{font-size:11px;color:#8a9a8a;text-transform:uppercase;letter-spacing:.08em;margin-top:4px}
      code{background:#1a2535;padding:1px 6px;border-radius:4px;font-size:11px}
      .empty{padding:14px;color:#8a9a8a;text-align:center;font-size:12px;font-style:italic}
    `;
    document.head.appendChild(s);
  }

  let dataset = null;

  function userBloqueado(u) {
    return u?.saquesBloqueados === true || u?.contaBanida === true;
  }

  function isConfiavel(u) {
    return u?.confiavel === true;
  }

  async function carregar() {
    document.getElementById('fraude-resumo').textContent = 'carregando…';

    const [saquesSnap, usuariosSnap, ajustesSnap] = await Promise.all([
      getDocs(collection(db, 'saques')),
      getDocs(collection(db, 'usuarios')),
      getDocs(query(collection(db, 'ajustes_manuais'), orderBy('timestamp', 'desc'))).catch(() => null),
    ]);

    const saques = saquesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const usuarios = new Map();
    usuariosSnap.docs.forEach(d => usuarios.set(d.id, d.data()));

    dataset = {
      saques,
      usuarios,
      ajustes: ajustesSnap ? ajustesSnap.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() })) : [],
    };

    analisar();
  }

  function analisar() {
    const { saques, usuarios, ajustes } = dataset;
    const pendentes = saques.filter(s => s.status === 'pendente');
    const totalPendente = pendentes.reduce((s, x) => s + (x.pontos || 0), 0);

    // Contas confiáveis (founder + parceiros) — excluídas dos flags abaixo.
    // Marcadas via campo confiavel:true no doc /usuarios.
    let confiaveisCount = 0;
    for (const u of usuarios.values()) if (isConfiavel(u)) confiaveisCount++;

    // FLAG 1: PIX duplicada em uids diferentes
    // (mantém grupo se ao menos 1 uid NÃO é confiável)
    const porPix = new Map();
    saques.forEach(s => {
      const k = (s.chavePix || '').trim().toLowerCase();
      if (!k) return;
      if (!porPix.has(k)) porPix.set(k, { pix: s.chavePix, uids: new Set(), saques: [] });
      const entry = porPix.get(k);
      entry.uids.add(s.uid);
      entry.saques.push(s);
    });
    const pixDup = [...porPix.values()].filter(p => {
      if (p.uids.size <= 1) return false;
      return ![...p.uids].every(uid => isConfiavel(usuarios.get(uid)));
    });

    // FLAG 2: Sacou com <60 min verificados (skip confiáveis)
    const sub60 = saques.filter(s => {
      const u = usuarios.get(s.uid);
      if (!u || isConfiavel(u)) return false;
      return (u.minutos || 0) < 60;
    });

    // FLAG 3: Ratio pts/min desproporcional (skip confiáveis)
    const porUid = {};
    saques.forEach(s => {
      porUid[s.uid] = porUid[s.uid] || { uid: s.uid, total: 0, saques: [] };
      porUid[s.uid].total += (s.pontos || 0);
      porUid[s.uid].saques.push(s);
    });
    const ratio = Object.values(porUid)
      .map(u => {
        const ud = usuarios.get(u.uid);
        if (!ud || isConfiavel(ud)) return null;
        const min = ud.minutos || 0;
        const teto = min * LIMIT_PTS_PER_MIN;
        if (u.total < MIN_THRESHOLD_PTS) return null;
        if (min < 60) return null;
        if (u.total <= teto * RATIO_TOLERANCIA) return null;
        return { ...u, minutos: min, teto, ratio: (u.total / Math.max(min, 1)).toFixed(0), userData: ud };
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total);

    // FLAG 4: Pendentes parados > 7 dias (skip confiáveis — eles estão fora do antifraude)
    const agora = Date.now();
    const antigos = pendentes
      .filter(s => !isConfiavel(usuarios.get(s.uid)))
      .map(s => {
        const t = s.criadoEm?.toDate?.() || (typeof s.criadoEm === 'string' ? new Date(s.criadoEm) : null);
        const dias = t ? Math.floor((agora - t.getTime()) / 86400000) : 0;
        return { ...s, dias };
      })
      .filter(s => s.dias > 7)
      .sort((a, b) => b.dias - a.dias);

    // KPIs no topo
    const sufixoConfiaveis = confiaveisCount ? ` · 🛡️ ${confiaveisCount} confiável(is) excluído(s)` : '';
    document.getElementById('fraude-resumo').textContent =
      `${pixDup.length} PIX dup · ${sub60.length} sub-60 · ${ratio.length} ratio · ${antigos.length} antigos${sufixoConfiaveis}`;

    document.getElementById('fraude-cards').innerHTML = `
      <div class="kpi-card"><div class="v ${pixDup.length > 0 ? 'danger' : 'ok'}">${pixDup.length}</div><div class="l">Chaves PIX em múltiplos uids</div></div>
      <div class="kpi-card"><div class="v ${sub60.length > 0 ? 'danger' : 'ok'}">${sub60.length}</div><div class="l">Saques com &lt; 60 min</div></div>
      <div class="kpi-card"><div class="v ${ratio.length > 0 ? 'danger' : 'ok'}">${ratio.length}</div><div class="l">Ratio pts/min anômalo</div></div>
      <div class="kpi-card"><div class="v">${fmtNum(totalPendente)}</div><div class="l">Pontos em pendente</div></div>
    `;

    // Renderiza FLAGS
    renderPixDup(pixDup);
    renderSub60(sub60);
    renderRatio(ratio);
    renderAntigos(antigos);
    renderAudit(ajustes);

    // Bind global action buttons
    container.querySelectorAll('[data-act="bloquear-user"]').forEach(btn => {
      btn.addEventListener('click', () => bloquearUsuario(btn.dataset.uid, btn.dataset.tipo, btn.dataset.tecnico));
    });
    container.querySelectorAll('[data-act="desbloquear"]').forEach(btn => {
      btn.addEventListener('click', () => desbloquearUsuario(btn.dataset.uid));
    });
  }

  function rowHtml(s, ud, opts = {}) {
    const bloq = userBloqueado(ud);
    const min = ud?.minutos ?? 0;
    return `<div class="row ${bloq ? 'bloqueado' : ''}">
      <div>
        <div class="nome">${esc(s.nome || ud?.nome || '?')}</div>
        <div class="meta">${fmtShort(s.uid)} · ${min} min · ${esc(s.status || '?')} · PIX <code>${esc(s.chavePix || '')}</code> · ${fmtRelative(s.criadoEm)}</div>
      </div>
      <div class="meta">${fmtNum(s.pontos || 0)} pts</div>
      <div class="acoes">
        ${bloq
          ? `<button class="btn-fraude ghost" data-act="desbloquear" data-uid="${esc(s.uid)}">↺ Desbloquear</button>`
          : (s.status === 'pendente' && opts.tipo
              ? `<button class="btn-fraude danger" data-act="bloquear-user" data-uid="${esc(s.uid)}" data-tipo="${esc(opts.tipo)}" data-tecnico="${esc(opts.tecnico || '')}">🚫 Bloquear conta</button>`
              : '')
        }
      </div>
    </div>`;
  }

  function renderPixDup(pixDup) {
    const { usuarios } = dataset;
    document.getElementById('cnt-pix').textContent = pixDup.length;
    document.getElementById('bloco-pix').innerHTML = pixDup.length === 0
      ? `<div class="empty">Nenhuma chave PIX compartilhada. ✓</div>`
      : pixDup
          .sort((a, b) => b.saques.reduce((s, x) => s + (x.pontos || 0), 0) - a.saques.reduce((s, x) => s + (x.pontos || 0), 0))
          .map(p => {
            const totalPix = p.saques.reduce((s, x) => s + (x.pontos || 0), 0);
            const pagos = p.saques.filter(s => s.status === 'processado').reduce((s, x) => s + (x.pontos || 0), 0);
            return `<div class="flag-card critico">
              <h4>
                <span>PIX <code>${esc(p.pix)}</code> usada por <strong>${p.uids.size} uids</strong> · ${p.saques.length} saques · ${fmtNum(totalPix)} pts</span>
                <span class="tag critico">collusion</span>
              </h4>
              ${pagos > 0 ? `<div style="font-size:11px;color:#ff7a7a;margin-bottom:8px">⚠️ ${fmtNum(pagos)} pts JÁ FORAM PAGOS pra essa chave</div>` : ''}
              ${p.saques.map(s => rowHtml(s, usuarios.get(s.uid), { tipo: 'pix_duplicada', tecnico: `PIX ${p.pix} usada por ${p.uids.size} uids` })).join('')}
            </div>`;
          })
          .join('');
  }

  function renderSub60(sub60) {
    const { usuarios } = dataset;
    document.getElementById('cnt-sub60').textContent = sub60.length;
    const totalSub60 = sub60.reduce((s, x) => s + (x.pontos || 0), 0);
    document.getElementById('bloco-sub60').innerHTML = sub60.length === 0
      ? `<div class="empty">Tudo limpo. ✓</div>`
      : `<div class="flag-card alto">
          <h4>
            <span>${sub60.length} saque(s) de usuários com &lt; 60 minutos verificados · ${fmtNum(totalSub60)} pts</span>
            <span class="tag alto">antifraude bypass</span>
          </h4>
          ${sub60.sort((a, b) => (b.pontos || 0) - (a.pontos || 0)).map(s => {
            const u = usuarios.get(s.uid);
            return rowHtml(s, u, { tipo: 'sub60_threshold', tecnico: `Sacou ${s.pontos} pts com apenas ${u?.minutos || 0} min` });
          }).join('')}
        </div>`;
  }

  function renderRatio(ratio) {
    const { usuarios } = dataset;
    document.getElementById('cnt-ratio').textContent = ratio.length;
    document.getElementById('bloco-ratio').innerHTML = ratio.length === 0
      ? `<div class="empty">Tudo dentro do esperado. ✓</div>`
      : `<div class="flag-card alto">
          <h4>
            <span>${ratio.length} usuário(s) com pts/min muito acima do teórico (teto: ${LIMIT_PTS_PER_MIN}/min)</span>
            <span class="tag alto">ratio anômalo</span>
          </h4>
          ${ratio.map(u => {
            const bloq = userBloqueado(u.userData);
            return `<div class="row ${bloq ? 'bloqueado' : ''}">
              <div>
                <div class="nome">${esc(u.userData.nome || '?')}</div>
                <div class="meta">${fmtShort(u.uid)} · sacou ${fmtNum(u.total)} pts em ${u.saques.length} saque(s) · ${u.minutos} min · ratio ${u.ratio} pts/min</div>
              </div>
              <div class="meta">${fmtNum(u.total)} pts</div>
              <div class="acoes">
                ${bloq
                  ? `<button class="btn-fraude ghost" data-act="desbloquear" data-uid="${esc(u.uid)}">↺ Desbloquear</button>`
                  : `<button class="btn-fraude danger" data-act="bloquear-user" data-uid="${esc(u.uid)}" data-tipo="ratio_anomalo" data-tecnico="Ratio ${u.ratio} pts/min — ${u.total} pts vs ${u.minutos} min">🚫 Bloquear conta</button>`}
              </div>
            </div>`;
          }).join('')}
        </div>`;
  }

  function renderAntigos(antigos) {
    const { usuarios } = dataset;
    document.getElementById('cnt-antigo').textContent = antigos.length;
    const totalAntigo = antigos.reduce((s, x) => s + (x.pontos || 0), 0);
    document.getElementById('bloco-antigo').innerHTML = antigos.length === 0
      ? `<div class="empty">Sem pendências velhas. ✓</div>`
      : `<div class="flag-card medio">
          <h4>
            <span>${antigos.length} pendente(s) parados > 7 dias · ${fmtNum(totalAntigo)} pts em fila</span>
            <span class="tag">aging</span>
          </h4>
          ${antigos.slice(0, 20).map(s => {
            const u = usuarios.get(s.uid);
            const bloq = userBloqueado(u);
            return `<div class="row ${bloq ? 'bloqueado' : ''}">
              <div>
                <div class="nome">${esc(s.nome || '?')}</div>
                <div class="meta">${fmtShort(s.uid)} · PIX <code>${esc(s.chavePix || '')}</code> · há ${s.dias} dias</div>
              </div>
              <div class="meta">${fmtNum(s.pontos || 0)} pts</div>
              <div class="acoes">${bloq ? '<span style="font-size:11px;color:#ff7a7a">bloqueado</span>' : ''}</div>
            </div>`;
          }).join('')}
        </div>`;
  }

  function renderAudit(ajustes) {
    document.getElementById('bloco-audit').innerHTML = ajustes.length === 0
      ? `<div class="empty">Nada registrado em /ajustes_manuais ainda.</div>`
      : ajustes.map(a => `<div style="display:grid;grid-template-columns:1fr auto;gap:10px;padding:8px 14px;background:#0d1421;border:1px solid #1a2535;border-radius:6px;margin-bottom:6px;font-size:12px;color:#8a9a8a;align-items:center">
          <div><strong style="color:#fff">${esc(a.tipo || '?')}</strong> · ${esc(a.email || a.uid?.slice(0, 12) || '?')} · ${a.delta ? fmtNum(a.delta) + ' pts · ' : ''}<em>${esc((a.motivo || '').slice(0, 80))}</em></div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px">${fmtRelative(a.timestamp)}</div>
        </div>`).join('');
  }

  async function bloquearUsuario(uid, tipoFraude, motivoTecnico) {
    const motivoAmigavel = MOTIVOS_AMIGAVEIS[tipoFraude] || 'Identificamos atividade incomum em sua conta. Saques bloqueados pra revisão manual.';
    const u = dataset.usuarios.get(uid);
    const nome = u?.nome || uid;

    const ok = await confirmar(
      `Bloquear conta de ${nome}?`,
      `saquesBloqueados → true. Atinge todos os saques pendentes E futuros deste uid.\n\nMotivo técnico: ${motivoTecnico}\n\nO usuário vai ver no app: "${motivoAmigavel}"`,
      { confirmar: '🚫 Bloquear conta', destrutivo: true },
    );
    if (!ok) return;

    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        saquesBloqueados: true,
        contaSuspeita: true,
        motivoBloqueio: motivoAmigavel,
        fraudeDetectada: tipoFraude,
        bloqueadoEm: serverTimestamp(),
        bloqueadoPor: 'admin-dashboard',
      });
      await addDoc(collection(db, 'ajustes_manuais'), {
        uid,
        tipo: 'bloqueio_conta',
        fraudeDetectada: tipoFraude,
        motivoTecnico,
        motivoAmigavel,
        aplicadoPor: 'admin-dashboard',
        timestamp: serverTimestamp(),
      });
      toast(`Conta de ${nome} bloqueada.`, 'ok');
      await carregar();
    } catch (e) {
      toast('Erro: ' + e.message, 'erro');
      console.error(e);
    }
  }

  async function desbloquearUsuario(uid) {
    const u = dataset.usuarios.get(uid);
    const nome = u?.nome || uid;

    const ok = await confirmar(
      `Desbloquear conta de ${nome}?`,
      `saquesBloqueados → false. Saques voltam a ser processáveis. Registrado em audit log.`,
      { confirmar: '↺ Desbloquear' },
    );
    if (!ok) return;

    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        saquesBloqueados: false,
        contaSuspeita: false,
        motivoBloqueio: null,
        fraudeDetectada: null,
        desbloqueadoEm: serverTimestamp(),
        desbloqueadoPor: 'admin-dashboard',
      });
      await addDoc(collection(db, 'ajustes_manuais'), {
        uid,
        tipo: 'desbloqueio_conta',
        motivo: 'Revisão manual no dashboard',
        aplicadoPor: 'admin-dashboard',
        timestamp: serverTimestamp(),
      });
      toast(`Conta de ${nome} desbloqueada.`, 'ok');
      await carregar();
    } catch (e) {
      toast('Erro: ' + e.message, 'erro');
      console.error(e);
    }
  }

  document.getElementById('btn-recarregar').addEventListener('click', carregar);

  await carregar();
}
