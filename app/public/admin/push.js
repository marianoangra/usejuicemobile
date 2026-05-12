// Push notifications — compor, segmentar audiência, enviar via Expo Push API.
import { db, functions } from './lib/firebase.js';
import {
  collection, query, orderBy, limit, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js';
import { fmtNum, fmtDateTime, esc } from './lib/fmt.js';
import { toast, confirmar } from './lib/ui.js';

const enviarPushJob = httpsCallable(functions, 'enviarPushJob');

export async function init({ container, registerCleanup }) {
  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">📨 Push notifications</div>
      </div>
      <p style="font-size:12px;color:#8a9a8a;margin-bottom:12px">
        Dispara via Expo Push API. App precisa ter <code>push_tokens/{uid}</code> registrado (bug de rules antigo fez nem todos terem — só users que abriram o app recentemente recebem).
      </p>
    </div>

    <div class="section">
      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin-bottom:14px">✏️ Compor</h3>

        <div style="display:grid;grid-template-columns:1fr;gap:12px">
          <div>
            <label class="label">Título</label>
            <input id="p-titulo" class="filter-input" maxlength="120" style="width:100%" placeholder="Ex: ⚡ Bonus do dia disponível!">
            <small id="p-titulo-count" style="color:#555;font-size:10px"></small>
          </div>

          <div>
            <label class="label">Corpo</label>
            <textarea id="p-corpo" class="filter-input" maxlength="500" rows="3" style="width:100%;resize:vertical;font-family:inherit" placeholder="Mensagem que aparece no banner do push…"></textarea>
            <small id="p-corpo-count" style="color:#555;font-size:10px"></small>
          </div>

          <div>
            <label class="label">Deeplink (rota interna ou URL) — opcional</label>
            <input id="p-deeplink" class="filter-input" style="width:100%" placeholder="Ex: AirdropScreen ou https://…">
          </div>

          <div>
            <h4 style="font-size:13px;margin:8px 0 6px">🎯 Audiência</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <label class="radio-pill"><input type="radio" name="aud" value="todos" checked> Todos com push token</label>
              <label class="radio-pill"><input type="radio" name="aud" value="pts_gte"> Pontos ≥ <input id="aud-pts" type="number" value="100000" style="width:80px;margin-left:6px"></label>
              <label class="radio-pill"><input type="radio" name="aud" value="waitlist"> Waitlist $JUICE</label>
              <label class="radio-pill"><input type="radio" name="aud" value="uid"> UID único: <input id="aud-uid" placeholder="uid…" style="width:160px;margin-left:6px"></label>
            </div>
          </div>

          <div style="background:#0A0F1E;border:1px dashed #1a2535;border-radius:10px;padding:14px;margin-top:6px">
            <div style="font-size:11px;color:#555;margin-bottom:6px">📱 PREVIEW</div>
            <div style="background:#1a2535;border-radius:8px;padding:10px;color:#fff">
              <div id="prev-titulo" style="font-weight:600;font-size:14px;margin-bottom:4px">—</div>
              <div id="prev-corpo" style="font-size:13px;color:#aaa">—</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
          <button id="p-cancelar" class="btn-small" style="background:transparent;border:1px solid #1a2535;color:#8a9a8a">Limpar</button>
          <button id="p-enviar" class="btn-small btn-ok">🚀 Enviar agora</button>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-title">📜 Histórico de envios</div>
        <span class="count-badge" id="jobs-count">…</span>
      </div>
      <div id="jobs-host" class="table-wrap"></div>
    </div>
  `;

  // CSS pros pills
  const sid = 'push-style';
  if (!document.getElementById(sid)) {
    const s = document.createElement('style');
    s.id = sid;
    s.textContent = `
      .radio-pill{display:inline-flex;align-items:center;gap:4px;background:#0A0F1E;border:1px solid #1a2535;color:#fff;padding:6px 12px;border-radius:8px;font-size:13px;cursor:pointer}
      .radio-pill:has(input:checked){border-color:#00FF88;color:#00FF88}
      .radio-pill input[type="number"],.radio-pill input[type="text"],.radio-pill input:not([type="radio"]){background:#1a2535;border:1px solid #1a2535;color:#fff;padding:2px 6px;border-radius:4px;font-size:12px}
      .label{font-size:11px;color:#8a9a8a;display:block;margin-bottom:4px}
    `;
    document.head.appendChild(s);
  }

  const tInp = container.querySelector('#p-titulo');
  const cInp = container.querySelector('#p-corpo');
  const dInp = container.querySelector('#p-deeplink');
  const prevT = container.querySelector('#prev-titulo');
  const prevC = container.querySelector('#prev-corpo');
  const tCount = container.querySelector('#p-titulo-count');
  const cCount = container.querySelector('#p-corpo-count');

  function updatePreview() {
    prevT.textContent = tInp.value || '—';
    prevC.textContent = cInp.value || '—';
    tCount.textContent = `${tInp.value.length}/120`;
    cCount.textContent = `${cInp.value.length}/500`;
  }
  tInp.addEventListener('input', updatePreview);
  cInp.addEventListener('input', updatePreview);
  updatePreview();

  container.querySelector('#p-cancelar').onclick = () => {
    tInp.value = ''; cInp.value = ''; dInp.value = '';
    container.querySelector('#aud-pts').value = '100000';
    container.querySelector('#aud-uid').value = '';
    updatePreview();
  };

  container.querySelector('#p-enviar').onclick = () => enviar(container);

  // Histórico de jobs
  registerCleanup(onSnapshot(
    query(collection(db, 'push_jobs'), orderBy('criadoEm', 'desc'), limit(50)),
    snap => {
      container.querySelector('#jobs-count').textContent = `${snap.size} envios`;
      const host = container.querySelector('#jobs-host');
      if (snap.empty) { host.innerHTML = '<div class="empty">Nenhum push enviado ainda.</div>'; return; }
      host.innerHTML = `<table>
        <thead><tr><th>Quando</th><th>Título</th><th>Audiência</th><th>Resultados</th><th>Status</th></tr></thead>
        <tbody>
          ${snap.docs.map(d => {
            const j = d.data();
            const audDesc = j.audiencia?.tipo === 'pts_gte' ? `pts ≥ ${fmtNum(j.audiencia.valor)}`
                          : j.audiencia?.tipo === 'uid' ? `UID ${esc(j.audiencia.valor?.slice(0,10) ?? '')}…`
                          : j.audiencia?.tipo ?? '—';
            const taxa = j.totalTokens ? `${fmtNum(j.sucesso ?? 0)} ✓ · ${fmtNum(j.falha ?? 0)} ✗ de ${fmtNum(j.totalTokens)} tokens` : '—';
            return `<tr>
              <td>${fmtDateTime(j.criadoEm)}</td>
              <td>${esc(j.titulo)}</td>
              <td><span style="font-size:11px">${esc(audDesc)}</span></td>
              <td>${taxa}</td>
              <td><span class="status-badge status-${j.status === 'enviado' ? 'processado' : 'pendente'}">${esc(j.status ?? '—')}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    }
  ));
}

async function enviar(container) {
  const titulo = container.querySelector('#p-titulo').value.trim();
  const corpo  = container.querySelector('#p-corpo').value.trim();
  const deeplink = container.querySelector('#p-deeplink').value.trim();
  const audTipo = container.querySelector('input[name="aud"]:checked').value;

  if (!titulo || titulo.length < 3) return toast('Título obrigatório (≥3 chars).', 'erro');
  if (!corpo || corpo.length < 3) return toast('Corpo obrigatório (≥3 chars).', 'erro');

  let valor = null;
  if (audTipo === 'pts_gte') valor = Number(container.querySelector('#aud-pts').value) || 0;
  if (audTipo === 'uid')     valor = container.querySelector('#aud-uid').value.trim();
  if (audTipo === 'uid' && !valor) return toast('Cole o UID alvo.', 'erro');

  const audDesc = audTipo === 'todos' ? 'TODOS os usuários com push token'
                : audTipo === 'pts_gte' ? `usuários com pts ≥ ${valor}`
                : audTipo === 'waitlist' ? 'todos da waitlist $JUICE'
                : `UID ${valor}`;

  const ok = await confirmar(
    'Enviar push agora?',
    `Vai disparar pra ${audDesc}.\n\nTítulo: ${titulo}\nCorpo: ${corpo}\n\nEsta ação é irreversível e visível pros usuários imediatamente.`,
    { confirmar: 'Enviar agora' }
  );
  if (!ok) return;

  const btn = container.querySelector('#p-enviar');
  const labelOriginal = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Enviando…';
  try {
    const res = await enviarPushJob({
      titulo, corpo,
      audiencia: { tipo: audTipo, valor },
      data: deeplink ? { deeplink } : null,
    });
    const d = res.data;
    if (d.total === 0) {
      toast('Audiência vazia.', 'aviso');
    } else if (d.totalTokens === 0) {
      toast(`${d.total} users na audiência mas ninguém tem push_token (eles precisam abrir o app).`, 'aviso');
    } else {
      toast(`✓ ${d.sucesso} enviados, ${d.falha} falhas (de ${d.totalTokens} tokens).`, d.falha ? 'aviso' : 'ok');
    }
  } catch (e) {
    toast('Erro: ' + (e.message ?? e.code), 'erro');
    console.error('enviarPushJob falhou:', e);
  } finally {
    btn.disabled = false;
    btn.textContent = labelOriginal;
  }
}
