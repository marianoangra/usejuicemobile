// Banners do home — CRUD + upload Storage + agendamento + segmentação.
// Doc único: config/home_banners { banners: [{...}] }
import { db, storage } from './lib/firebase.js';
import {
  doc, getDoc, setDoc, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
  ref as storageRef, uploadBytes, getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { fmtDateTime, esc } from './lib/fmt.js';
import { toast, confirmar } from './lib/ui.js';

const DOC_PATH = 'config/home_banners';

function novoEstado() {
  return {
    banners: [],
    editando: null, // banner sendo editado (ou null pra novo)
    salvando: false,
  };
}

export async function init({ container, registerCleanup }) {
  const state = novoEstado();

  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">📢 Banners do Home</div>
        <button id="btn-novo" class="btn-small btn-ok">+ Novo banner</button>
      </div>
      <p style="font-size:12px;color:#8a9a8a;margin-bottom:12px">
        Banners são carregados pelo BannerCarousel do app via onSnapshot. Mudanças aparecem instantâneas (sem build).
        Aceita agendamento (início/fim) e segmento por pontos.
      </p>
    </div>

    <div id="lista-host"></div>
    <div id="form-host"></div>
  `;

  container.querySelector('#btn-novo').onclick = () => {
    state.editando = bannerVazio();
    renderForm(state, container);
  };

  registerCleanup(onSnapshot(doc(db, DOC_PATH), snap => {
    state.banners = snap.exists() ? (snap.data().banners ?? []) : [];
    renderLista(state, container);
  }));
}

function bannerVazio() {
  return {
    id: crypto.randomUUID(),
    tipo: 'institucional',
    campaignId: null,
    sponsorId: null,
    ativo: true,
    ordem: 10,
    imagemUrl: '',
    tituloAlt: '',
    deeplink: '',
    inicio: null,
    fim: null,
    segmentoPtsMin: null,
    segmentoPtsMax: null,
    segmentoModo: null,
    criadoEm: new Date().toISOString(),
  };
}

function ativoAgora(b) {
  const agora = Date.now();
  if (b.inicio && new Date(b.inicio).getTime() > agora) return false;
  if (b.fim && new Date(b.fim).getTime() < agora) return false;
  return b.ativo;
}

function renderLista(state, container) {
  const host = container.querySelector('#lista-host');
  const ordenados = [...state.banners].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  if (!ordenados.length) {
    host.innerHTML = `<div class="empty">Nenhum banner cadastrado. Clica em "+ Novo banner" pra começar.</div>`;
    return;
  }

  host.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr>
        <th style="width:60px">Ordem</th>
        <th>Preview</th>
        <th>Título</th>
        <th>Tipo</th>
        <th>Status</th>
        <th>Período</th>
        <th>Segmento</th>
        <th style="width:200px">Ações</th>
      </tr></thead>
      <tbody>
        ${ordenados.map(b => {
          const vivo = ativoAgora(b);
          const periodo = (b.inicio || b.fim)
            ? `<div style="font-size:11px">${b.inicio ? fmtDateTime(b.inicio) : 'sempre'} → ${b.fim ? fmtDateTime(b.fim) : '∞'}</div>`
            : '<span style="color:#8a9a8a;font-size:11px">sem agenda</span>';
          const segmento = (b.segmentoPtsMin || b.segmentoPtsMax || b.segmentoModo)
            ? `<div style="font-size:11px">${b.segmentoPtsMin ? `≥${b.segmentoPtsMin}` : ''} ${b.segmentoPtsMax ? `≤${b.segmentoPtsMax}` : ''} ${b.segmentoModo ? `· ${b.segmentoModo}` : ''}</div>`
            : '<span style="color:#8a9a8a;font-size:11px">todos</span>';
          return `
            <tr>
              <td>${b.ordem ?? 0}</td>
              <td>${b.imagemUrl ? `<img src="${esc(b.imagemUrl)}" style="width:80px;height:36px;object-fit:cover;border-radius:4px;background:#1a2535">` : '—'}</td>
              <td>${esc(b.tituloAlt)}</td>
              <td>${b.tipo === 'campaign' ? `<span class="status-badge" style="background:#1a2535;color:#9945FF">campanha</span>` : `<span style="font-size:11px;color:#8a9a8a">institucional</span>`}</td>
              <td>${vivo ? `<span class="status-badge status-processado">ativo</span>` : `<span class="status-badge status-bloqueado">inativo</span>`}</td>
              <td>${periodo}</td>
              <td>${segmento}</td>
              <td style="white-space:nowrap">
                <button class="btn-small btn-ok" data-acao="editar" data-id="${esc(b.id)}">✎ Editar</button>
                <button class="btn-small" data-acao="toggle" data-id="${esc(b.id)}" style="background:transparent;border:1px solid #1a2535;color:#8a9a8a">${b.ativo ? '⏸ Pausar' : '▶ Ativar'}</button>
                <button class="btn-small btn-danger" data-acao="excluir" data-id="${esc(b.id)}">🗑</button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table></div>
  `;

  host.querySelectorAll('button[data-acao]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const b = state.banners.find(x => x.id === id);
      if (!b) return;
      if (btn.dataset.acao === 'editar')   { state.editando = { ...b }; renderForm(state, container); }
      else if (btn.dataset.acao === 'toggle') { toggleAtivo(state, id); }
      else if (btn.dataset.acao === 'excluir') { excluir(state, id); }
    };
  });
}

function renderForm(state, container) {
  const b = state.editando;
  const host = container.querySelector('#form-host');
  host.innerHTML = `
    <div class="section" style="margin-top:24px">
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-size:16px">${state.banners.find(x => x.id === b.id) ? '✎ Editar banner' : '+ Novo banner'}</h3>
          <button id="form-cancelar" class="btn-small" style="background:transparent;border:1px solid #1a2535;color:#8a9a8a">Cancelar</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <div>
            <label class="label">Imagem</label>
            <input type="file" id="f-imagem" accept="image/*" class="filter-input" style="width:100%">
            ${b.imagemUrl ? `<img src="${esc(b.imagemUrl)}" style="width:100%;max-width:300px;height:auto;border-radius:6px;margin-top:8px">` : ''}
            <p style="font-size:11px;color:#8a9a8a;margin-top:4px">Recomendado: 800×360px, &lt; 2MB</p>
          </div>

          <div>
            <label class="label">Título / alt text</label>
            <input id="f-titulo" value="${esc(b.tituloAlt)}" class="filter-input" style="width:100%" placeholder="Ex: Acumule pontos">

            <label class="label" style="margin-top:10px">Deeplink (URL ou rota)</label>
            <input id="f-deeplink" value="${esc(b.deeplink)}" class="filter-input" style="width:100%" placeholder="https://… ou DePINInfo">

            <label class="label" style="margin-top:10px">Ordem (menor = aparece primeiro)</label>
            <input id="f-ordem" type="number" value="${b.ordem ?? 10}" class="filter-input" style="width:100%">
          </div>

          <div>
            <label class="label">Tipo</label>
            <select id="f-tipo" class="filter-select" style="width:100%">
              <option value="institucional" ${b.tipo === 'institucional' ? 'selected' : ''}>Institucional</option>
              <option value="campaign" ${b.tipo === 'campaign' ? 'selected' : ''}>Campanha (paga)</option>
            </select>

            <label class="label" style="margin-top:10px">Sponsor ID (se campanha)</label>
            <input id="f-sponsor" value="${esc(b.sponsorId ?? '')}" class="filter-input" style="width:100%" placeholder="opcional">

            <label class="label" style="margin-top:10px">Campaign ID (se campanha)</label>
            <input id="f-campaign" value="${esc(b.campaignId ?? '')}" class="filter-input" style="width:100%" placeholder="opcional">
          </div>

          <div>
            <label class="label">Início (vazio = sempre)</label>
            <input id="f-inicio" type="datetime-local" value="${dtToInput(b.inicio)}" class="filter-input" style="width:100%">

            <label class="label" style="margin-top:10px">Fim (vazio = ∞)</label>
            <input id="f-fim" type="datetime-local" value="${dtToInput(b.fim)}" class="filter-input" style="width:100%">
          </div>

          <div>
            <label class="label">Segmento — pontos mínimo</label>
            <input id="f-pts-min" type="number" value="${b.segmentoPtsMin ?? ''}" class="filter-input" style="width:100%" placeholder="vazio = sem mínimo">

            <label class="label" style="margin-top:10px">Segmento — pontos máximo</label>
            <input id="f-pts-max" type="number" value="${b.segmentoPtsMax ?? ''}" class="filter-input" style="width:100%" placeholder="vazio = sem máximo">

            <label class="label" style="margin-top:10px">Segmento — modo</label>
            <select id="f-modo" class="filter-select" style="width:100%">
              <option value="">qualquer</option>
              <option value="lite" ${b.segmentoModo === 'lite' ? 'selected' : ''}>Lite</option>
              <option value="tech" ${b.segmentoModo === 'tech' ? 'selected' : ''}>Tech</option>
            </select>
          </div>

          <div>
            <label class="label">Ativo?</label>
            <select id="f-ativo" class="filter-select" style="width:100%">
              <option value="true" ${b.ativo ? 'selected' : ''}>Sim</option>
              <option value="false" ${!b.ativo ? 'selected' : ''}>Não (pausado)</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
          <button id="form-cancelar2" class="btn-small" style="background:transparent;border:1px solid #1a2535;color:#8a9a8a">Cancelar</button>
          <button id="form-salvar" class="btn-small btn-ok">💾 Salvar</button>
        </div>
      </div>
    </div>
  `;

  // CSS pros labels
  const sid = 'banners-style';
  if (!document.getElementById(sid)) {
    const s = document.createElement('style');
    s.id = sid;
    s.textContent = `.label{font-size:11px;color:#8a9a8a;display:block;margin-bottom:4px}`;
    document.head.appendChild(s);
  }

  host.querySelector('#form-cancelar').onclick = () => { state.editando = null; host.innerHTML = ''; };
  host.querySelector('#form-cancelar2').onclick = () => { state.editando = null; host.innerHTML = ''; };
  host.querySelector('#form-salvar').onclick = () => salvar(state, container, host);
}

function dtToInput(iso) {
  if (!iso) return '';
  try {
    const d = typeof iso === 'string' ? new Date(iso) : iso.toDate?.() ?? new Date(iso?.seconds ? iso.seconds * 1000 : iso);
    if (isNaN(d)) return '';
    // datetime-local quer "YYYY-MM-DDTHH:MM" no fuso local
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  } catch { return ''; }
}

function inputToDt(v) {
  if (!v) return null;
  return new Date(v).toISOString();
}

async function salvar(state, container, host) {
  if (state.salvando) return;
  state.salvando = true;

  const b = state.editando;
  const fileInp = host.querySelector('#f-imagem');
  const file = fileInp.files?.[0];

  try {
    // 1. Upload imagem se foi escolhida
    if (file) {
      if (file.size > 2 * 1024 * 1024) throw new Error('Imagem maior que 2MB. Reduz e tenta de novo.');
      const ref = storageRef(storage, `banners/${b.id}-${Date.now()}.${file.name.split('.').pop() ?? 'jpg'}`);
      await uploadBytes(ref, file, { contentType: file.type });
      b.imagemUrl = await getDownloadURL(ref);
    }

    // 2. Coleta dos campos
    b.tituloAlt = host.querySelector('#f-titulo').value.trim();
    b.deeplink  = host.querySelector('#f-deeplink').value.trim();
    b.ordem     = Number(host.querySelector('#f-ordem').value) || 0;
    b.tipo      = host.querySelector('#f-tipo').value;
    b.sponsorId = host.querySelector('#f-sponsor').value.trim() || null;
    b.campaignId = host.querySelector('#f-campaign').value.trim() || null;
    b.inicio    = inputToDt(host.querySelector('#f-inicio').value);
    b.fim       = inputToDt(host.querySelector('#f-fim').value);
    b.segmentoPtsMin = Number(host.querySelector('#f-pts-min').value) || null;
    b.segmentoPtsMax = Number(host.querySelector('#f-pts-max').value) || null;
    b.segmentoModo   = host.querySelector('#f-modo').value || null;
    b.ativo     = host.querySelector('#f-ativo').value === 'true';
    b.atualizadoEm = new Date().toISOString();

    if (!b.imagemUrl) throw new Error('Suba uma imagem antes de salvar.');
    if (!b.tituloAlt) throw new Error('Título / alt text é obrigatório (acessibilidade).');

    // 3. Atualiza array no doc
    const ref = doc(db, DOC_PATH);
    const snap = await getDoc(ref);
    const banners = snap.exists() ? (snap.data().banners ?? []) : [];
    const idx = banners.findIndex(x => x.id === b.id);
    if (idx >= 0) banners[idx] = b;
    else banners.push(b);

    await setDoc(ref, { banners, atualizadoEm: new Date() }, { merge: true });
    toast('Banner salvo.', 'ok');
    state.editando = null;
    host.innerHTML = '';
  } catch (e) {
    toast('Erro: ' + e.message, 'erro');
    console.error(e);
  } finally {
    state.salvando = false;
  }
}

async function toggleAtivo(state, id) {
  const b = state.banners.find(x => x.id === id);
  if (!b) return;
  b.ativo = !b.ativo;
  b.atualizadoEm = new Date().toISOString();
  try {
    await setDoc(doc(db, DOC_PATH), { banners: state.banners, atualizadoEm: new Date() }, { merge: true });
    toast(b.ativo ? 'Banner ativado.' : 'Banner pausado.', 'ok');
  } catch (e) { toast('Erro: ' + e.message, 'erro'); }
}

async function excluir(state, id) {
  const b = state.banners.find(x => x.id === id);
  if (!b) return;
  const ok = await confirmar('Excluir banner', `Tem certeza que quer excluir "${b.tituloAlt || b.id}"? Isso some no app na hora.`, { destrutivo: true, confirmar: 'Excluir' });
  if (!ok) return;
  try {
    const remaining = state.banners.filter(x => x.id !== id);
    await setDoc(doc(db, DOC_PATH), { banners: remaining, atualizadoEm: new Date() }, { merge: true });
    toast('Banner excluído.', 'ok');
  } catch (e) { toast('Erro: ' + e.message, 'erro'); }
}
