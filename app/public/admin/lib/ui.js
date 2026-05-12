// Helpers de UI compartilhados.
import { esc } from './fmt.js';

// Renderiza um <table> com colunas declarativas dentro do elemento alvo.
// columns: [{ label, render: (row) => string|node, width?, align? }]
// rows: array de objetos
export function renderTable(target, columns, rows, opts = {}) {
  const empty = opts.empty ?? 'Nada por aqui.';
  if (!rows?.length) {
    target.innerHTML = `<div class="empty">${esc(empty)}</div>`;
    return;
  }
  const thead = columns.map(c => `<th${c.width ? ` style="width:${c.width}"` : ''}${c.align ? ` style="text-align:${c.align}"` : ''}>${esc(c.label)}</th>`).join('');
  const trs = rows.map(row => {
    const tds = columns.map(c => {
      const v = typeof c.render === 'function' ? c.render(row) : esc(row[c.key] ?? '—');
      return `<td${c.align ? ` style="text-align:${c.align}"` : ''}>${v ?? '—'}</td>`;
    }).join('');
    return `<tr data-id="${esc(row.__id ?? row.id ?? '')}">${tds}</tr>`;
  }).join('');
  target.innerHTML = `<div class="table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

// Toast effêmero
let toastTimer;
export function toast(msg, kind = 'info') {
  let el = document.getElementById('admin-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'admin-toast';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0d1421;border:1px solid #1a2535;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;z-index:9999;opacity:0;transition:.25s;pointer-events:none';
    document.body.appendChild(el);
  }
  const color = kind === 'ok' ? '#00FF88' : kind === 'erro' ? '#ff4d4d' : kind === 'aviso' ? '#FFB800' : '#8a9a8a';
  el.style.borderLeft = `4px solid ${color}`;
  el.textContent = msg;
  requestAnimationFrame(() => el.style.opacity = '1');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.style.opacity = '0', 3000);
}

// Modal de confirmação simples
export function confirmar(titulo, corpo, { confirmar = 'Confirmar', cancelar = 'Cancelar', destrutivo = false } = {}) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:10000';
    wrap.innerHTML = `
      <div style="background:#0d1421;border:1px solid #1a2535;border-radius:14px;padding:24px;max-width:420px;width:90%">
        <h3 style="font-size:16px;margin-bottom:8px">${esc(titulo)}</h3>
        <p style="color:#8a9a8a;font-size:13px;margin-bottom:20px;line-height:1.5">${esc(corpo)}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-cancel" style="border:1px solid #1a2535;color:#8a9a8a;padding:8px 16px;border-radius:8px;background:transparent;cursor:pointer;font-size:13px">${esc(cancelar)}</button>
          <button class="btn-go" style="border:none;color:#0A0F1E;background:${destrutivo ? '#ff4d4d' : '#00FF88'};padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">${esc(confirmar)}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.btn-cancel').onclick = () => { wrap.remove(); resolve(false); };
    wrap.querySelector('.btn-go').onclick = () => { wrap.remove(); resolve(true); };
  });
}

export function badge(texto, kind = 'info') {
  const cls = `status-${kind}`;
  return `<span class="status-badge ${cls}">${esc(texto)}</span>`;
}

// Placeholder genérico pra módulos em construção
export function emConstrucao(container, modulo, taskId) {
  container.innerHTML = `
    <div style="text-align:center;padding:80px 20px;color:#8a9a8a">
      <div style="font-size:48px;margin-bottom:16px">🚧</div>
      <h2 style="font-size:18px;color:#fff;margin-bottom:8px">${esc(modulo)}</h2>
      <p style="font-size:13px">Em construção${taskId ? ` (Task #${taskId})` : ''}.</p>
    </div>`;
}
