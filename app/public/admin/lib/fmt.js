// Formatadores compartilhados.

export const fmtNum = n => (n == null ? '—' : Number(n).toLocaleString('pt-BR'));

export const fmtPts = n => fmtNum(n) + ' pts';

export const fmtJuice = n => fmtNum(Math.floor((n ?? 0) / 1000)) + ' $JUICE';

// Real (estimativa) baseado em ~R$1 por 1000 pts
export const fmtBRL = n => 'R$ ' + (Number(n ?? 0) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = ts => {
  if (!ts) return '—';
  // Firestore Timestamp ou string ISO ou Date
  if (ts?.toDate) ts = ts.toDate();
  else if (typeof ts === 'string') ts = new Date(ts);
  else if (ts?.seconds) ts = new Date(ts.seconds * 1000);
  if (!(ts instanceof Date) || isNaN(ts)) return '—';
  return ts.toLocaleDateString('pt-BR');
};

export const fmtDateTime = ts => {
  if (!ts) return '—';
  if (ts?.toDate) ts = ts.toDate();
  else if (typeof ts === 'string') ts = new Date(ts);
  else if (ts?.seconds) ts = new Date(ts.seconds * 1000);
  if (!(ts instanceof Date) || isNaN(ts)) return '—';
  return ts.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export const fmtRelative = ts => {
  if (!ts) return '—';
  if (ts?.toDate) ts = ts.toDate();
  else if (ts?.seconds) ts = new Date(ts.seconds * 1000);
  if (!(ts instanceof Date) || isNaN(ts)) return '—';
  const diff = Date.now() - ts.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
};

// Encurta wallet/UID/ID pra ficar legível
export const fmtShort = (s, head = 8, tail = 6) => {
  if (!s || typeof s !== 'string') return '—';
  if (s.length <= head + tail + 3) return s;
  return s.slice(0, head) + '…' + s.slice(-tail);
};

// Escape HTML pra prevenir XSS quando injetar strings em innerHTML
export const esc = v => String(v ?? '—')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
