// Analytics MVP — presence (online 30min) + DAU/WAU/MAU via count agregado.
import { db } from './lib/firebase.js';
import {
  collection, query, where, getCountFromServer, orderBy, limit, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { fmtNum, fmtDateTime, fmtRelative, esc } from './lib/fmt.js';

const REFRESH_MS = 60 * 1000; // recarrega contagens a cada 1min

export async function init({ container, registerCleanup }) {
  container.innerHTML = `
    <div class="section" style="margin-bottom:14px">
      <div class="section-header">
        <div class="section-title">📈 Analytics</div>
        <span class="count-badge" id="last-refresh">…</span>
      </div>
      <p style="font-size:12px;color:#8a9a8a;margin-bottom:12px">
        Baseado em <code>usuarios/{uid}.lastSeen</code> que o app escreve a cada 5min em foreground. Atualiza a cada 1min.
      </p>
    </div>

    <div class="grid-2" id="cards-host"></div>

    <div class="section">
      <div class="section-header">
        <div class="section-title">🟢 Vistos nos últimos 30 minutos</div>
        <span class="count-badge" id="online-count">…</span>
      </div>
      <div id="online-host" class="table-wrap"></div>
    </div>
  `;

  let cancelled = false;
  registerCleanup(() => { cancelled = true; });

  async function refresh() {
    if (cancelled) return;
    try {
      const agora = Date.now();
      const cutoff30m = new Date(agora - 30 * 60 * 1000);
      const cutoff24h = new Date(agora - 24 * 60 * 60 * 1000);
      const cutoff7d  = new Date(agora - 7 * 24 * 60 * 60 * 1000);
      const cutoff30d = new Date(agora - 30 * 24 * 60 * 60 * 1000);

      const usuariosRef = collection(db, 'usuarios');
      const [c30m, c24h, c7d, c30d, total] = await Promise.all([
        getCountFromServer(query(usuariosRef, where('lastSeen', '>=', cutoff30m))),
        getCountFromServer(query(usuariosRef, where('lastSeen', '>=', cutoff24h))),
        getCountFromServer(query(usuariosRef, where('lastSeen', '>=', cutoff7d))),
        getCountFromServer(query(usuariosRef, where('lastSeen', '>=', cutoff30d))),
        getCountFromServer(usuariosRef),
      ]);

      const host = container.querySelector('#cards-host');
      host.innerHTML = `
        <div class="card g">
          <div class="card-label">🟢 Online agora (30min)</div>
          <div class="card-value green">${fmtNum(c30m.data().count)}</div>
        </div>
        <div class="card p">
          <div class="card-label">DAU (24h)</div>
          <div class="card-value purple">${fmtNum(c24h.data().count)}</div>
        </div>
        <div class="card y">
          <div class="card-label">WAU (7d)</div>
          <div class="card-value yellow">${fmtNum(c7d.data().count)}</div>
        </div>
        <div class="card g">
          <div class="card-label">MAU (30d)</div>
          <div class="card-value green">${fmtNum(c30d.data().count)}</div>
        </div>
        <div class="card r">
          <div class="card-label">Total usuários (DB)</div>
          <div class="card-value red">${fmtNum(total.data().count)}</div>
        </div>
        <div class="card p">
          <div class="card-label">% MAU / Total</div>
          <div class="card-value purple">${total.data().count > 0 ? Math.round(c30d.data().count / total.data().count * 100) : 0}%</div>
        </div>
      `;

      // Lista quem está online agora
      const snap = await getDocs(
        query(usuariosRef, where('lastSeen', '>=', cutoff30m), orderBy('lastSeen', 'desc'), limit(50))
      );
      const onlineHost = container.querySelector('#online-host');
      container.querySelector('#online-count').textContent = `${snap.size} usuários`;
      if (snap.empty) {
        onlineHost.innerHTML = `<div class="empty">Ninguém ativo nos últimos 30min.<br><span style="font-size:11px;color:#555">Lembrete: a coluna lastSeen só é preenchida em builds com o usePresence hook — precisa novo build do app.</span></div>`;
      } else {
        onlineHost.innerHTML = `<table>
          <thead><tr><th>Nome</th><th>Email</th><th>Pontos</th><th>Visto há</th><th>UID</th></tr></thead>
          <tbody>${snap.docs.map(d => {
            const u = d.data();
            return `<tr>
              <td><a href="#usuarios?uid=${esc(d.id)}" style="color:#fff;text-decoration:none;border-bottom:1px dotted #8a9a8a">${esc(u.nome)}</a></td>
              <td style="font-size:12px">${esc(u.email)}</td>
              <td>${fmtNum(u.pontos)}</td>
              <td>${fmtRelative(u.lastSeen)}</td>
              <td style="font-family:monospace;font-size:11px;color:#8a9a8a">${esc(d.id.slice(0, 8))}…</td>
            </tr>`;
          }).join('')}</tbody>
        </table>`;
      }

      container.querySelector('#last-refresh').textContent = `atualizado ${fmtDateTime(new Date())}`;
    } catch (e) {
      console.error('analytics refresh falhou:', e);
      container.querySelector('#last-refresh').textContent = '❌ erro: ' + e.message;
    }
  }

  refresh();
  const id = setInterval(refresh, REFRESH_MS);
  registerCleanup(() => clearInterval(id));
}
