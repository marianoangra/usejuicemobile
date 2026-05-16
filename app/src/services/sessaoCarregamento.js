// Modelo de sessão de carregamento — RELÓGIO no cliente + reconciliação server-side.
//
// O contador antigo somava minuto a minuto via timer; quando o JS é suspenso
// (iOS em background) ou o foreground service é morto (OEM Android), o timer
// congela e o tempo decorrido é perdido. Modelo novo:
//  - a sessão guarda o timestamp de início; os minutos vêm do relógio;
//  - o crédito AO VIVO (1 min por ciclo) continua no foreground service —
//    o espaçamento de 60s respeita a regra do Firestore (≥50s entre writes);
//  - os GAPS (serviço morto, app suspenso) são creditados pela Cloud Function
//    reconciliarSessao, que credita via Admin SDK ignorando aquela regra.
//    Não existe caminho client-side para creditar um backlog: adicionarMinuto-
//    ComBonus em loop quebra na 2ª chamada (rate-limit de 50s).
//
// A sessão vive no AsyncStorage, compartilhada pelo hook useCarregamento e pelo
// foreground service (backgroundService.js) — ambos no mesmo runtime JS.

import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDeviceHash } from './deviceFingerprint';

export const SESSAO_KEY = 'cnb_sessao_carregamento';

// Anti-bot: teto de 8h contínuas de carregamento (igual ao TETO em reconciliarSessao).
export const LIMITE_MINUTOS = 480;

// Uma sessão guardada só é retomada se o último checkpoint for recente. Um
// checkpoint antigo indica sessão "órfã" de uma carga anterior (app foi morto,
// carregador trocado) — descartamos e começamos uma nova.
const SESSAO_RESUMIVEL_MS = 10 * 60 * 1000;

export function estaCarregando(state) {
  return state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
}

// Lê estado + nível da bateria. nivel em fração 0-1 (formato esperado por
// reconciliarSessao para a corroboração antifraude).
export async function lerBateria() {
  let charging = false;
  let nivel = 0;
  try { charging = estaCarregando(await Battery.getBatteryStateAsync()); } catch {}
  try {
    const lvl = await Battery.getBatteryLevelAsync();
    if (lvl >= 0) nivel = lvl;
  } catch {}
  return { charging, nivel };
}

// ─── Persistência ─────────────────────────────────────────────────────────────

export async function lerSessao(uid) {
  try {
    const raw = await AsyncStorage.getItem(SESSAO_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Descarta formato antigo (sem chargeStartedAt) ou sessão de outro usuário.
    if (!s || s.uid !== uid || typeof s.chargeStartedAt !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}

export async function salvarSessao(sessao) {
  try { await AsyncStorage.setItem(SESSAO_KEY, JSON.stringify(sessao)); } catch {}
}

export async function limparSessao() {
  try { await AsyncStorage.removeItem(SESSAO_KEY); } catch {}
}

export function novaSessao(uid, batteryStart) {
  const agora = Date.now();
  return { uid, chargeStartedAt: agora, batteryStart, ultimoCheckpoint: agora };
}

// A sessão guardada ainda representa a carga em andamento?
export function sessaoResumivel(sessao) {
  return !!sessao && (Date.now() - sessao.ultimoCheckpoint) < SESSAO_RESUMIVEL_MS;
}

// Minutos decorridos da sessão pelo relógio, limitados ao teto anti-bot.
export function minutosDecorridos(sessao, ate = Date.now()) {
  if (!sessao) return 0;
  const m = Math.floor((ate - sessao.chargeStartedAt) / 60000);
  return Math.max(0, Math.min(m, LIMITE_MINUTOS));
}

// Marca que a carga foi confirmada agora. ultimoCheckpoint é usado como
// chargeEndedAt honesto quando o desligamento não é observado (app suspenso).
export async function marcarCheckpoint(sessao) {
  const atualizada = { ...sessao, ultimoCheckpoint: Date.now() };
  await salvarSessao(atualizada);
  return atualizada;
}

// ─── Reconciliação server-side ────────────────────────────────────────────────

// Fila: hook e foreground service rodam no mesmo runtime JS. Encadear (em vez
// de descartar concorrentes) garante que a reconciliação final, no fim da
// sessão, não seja perdida por causa de uma periódica ainda em voo.
let cadeiaReconcile = Promise.resolve();

async function _reconciliar(sessao, bateria) {
  // chargeEndedAt honesto: "agora" se ainda carregando, senão o último
  // checkpoint confirmado (não sabemos quando desconectou se foi em background).
  const chargeEndedAt = bateria.charging ? Date.now() : sessao.ultimoCheckpoint;
  // Janela < 1 min não rende minuto e o servidor rejeita (fim <= início).
  if (chargeEndedAt - sessao.chargeStartedAt < 60000) return;

  let deviceHash = null;
  try { deviceHash = await getDeviceHash(); } catch {}

  await httpsCallable(getFunctions(), 'reconciliarSessao')({
    chargeStartedAt: sessao.chargeStartedAt,
    chargeEndedAt,
    batteryStart: sessao.batteryStart,
    batteryEnd: bateria.nivel,
    deviceHash,
  });
}

/**
 * Pede ao servidor para creditar os minutos desta sessão ainda não creditados
 * pelo caminho por-minuto (foreground service). reconciliarSessao é idempotente
 * (usa ultimaReconciliacao / minutosUltimaReconciliacao) e aplica o antifraude:
 * teto de 8h, limite pela parede do relógio e corroboração por nível de bateria.
 * Falha (offline) é silenciosa — o próximo gatilho (resume / fim) tenta de novo.
 */
export function reconciliar(sessao, bateria) {
  if (!sessao) return Promise.resolve();
  cadeiaReconcile = cadeiaReconcile
    .then(() => _reconciliar(sessao, bateria))
    .catch(() => {});
  return cadeiaReconcile;
}
