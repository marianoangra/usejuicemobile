import * as Notifications from 'expo-notifications';
import { adicionarMinutoComBonus, calcularPontosTotal } from './pontos';
import { lerConsentimentos } from '../utils/consentimentos';
import {
  lerBateria, lerSessao, salvarSessao, novaSessao, marcarCheckpoint,
  reconciliar, minutosDecorridos, LIMITE_MINUTOS, SESSAO_KEY,
} from './sessaoCarregamento';

// Re-export para compatibilidade com importadores antigos.
export { SESSAO_KEY };

// ─── Guard do módulo nativo ───────────────────────────────────────────────────
// Se o build ainda não inclui react-native-background-actions compilado,
// todas as funções degradam silenciosamente sem derrubar o app.

let BackgroundService = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  BackgroundService = require('react-native-background-actions').default;
} catch {
  console.warn('[BackgroundService] Módulo nativo não disponível neste build.');
}

function moduloDisponivel() {
  try {
    return BackgroundService !== null && typeof BackgroundService.isRunning === 'function';
  } catch {
    return false;
  }
}

function estaRodando() {
  try {
    return moduloDisponivel() && BackgroundService.isRunning();
  } catch {
    return false;
  }
}

// ─── Lógica da tarefa (roda em background) ───────────────────────────────────

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Foreground service: crédito AO VIVO da sessão. A cada ciclo credita 1 minuto
// via adicionarMinutoComBonus — o espaçamento de 60s respeita a regra do
// Firestore (≥50s entre writes). Se o SO throttla o serviço, esse caminho
// credita menos que o tempo real; o gap é fechado depois por reconciliarSessao.
async function tarefaCarregamento(taskData) {
  const { uid } = taskData;

  // O hook normalmente já criou a sessão ao detectar a carga; garante mesmo assim.
  let sessao = await lerSessao(uid);
  if (!sessao) {
    const { nivel } = await lerBateria();
    sessao = novaSessao(uid, nivel);
    await salvarSessao(sessao);
  }

  while (estaRodando()) {
    await sleep(60000);
    if (!estaRodando()) break;

    const bateria = await lerBateria();
    if (!bateria.charging) {
      // Carregador desconectado — credita o gap final e encerra.
      const atual = (await lerSessao(uid)) || sessao;
      await reconciliar(atual, bateria);
      try { await BackgroundService.stop(); } catch {}
      break;
    }

    // Crédito ao vivo — 1 minuto por ciclo.
    try {
      const consent = await lerConsentimentos().catch(() => ({}));
      await adicionarMinutoComBonus(uid, consent.horarios !== false);
    } catch {}

    // Avança o checkpoint (chargeEndedAt honesto para a reconciliação).
    sessao = (await lerSessao(uid)) || sessao;
    sessao = await marcarCheckpoint(sessao);

    // Anti-bot: para após 8 horas contínuas de carregamento.
    // Reinicia quando o usuário desconectar e reconectar o carregador.
    const minutos = minutosDecorridos(sessao);
    if (minutos >= LIMITE_MINUTOS) {
      await reconciliar(sessao, bateria);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'JUICE',
            body: 'Limite de 8h de carregamento contínuo atingido. Desconecte e reconecte o carregador para continuar.',
            data: { tela: 'Carregar' },
          },
          trigger: null,
        });
      } catch {}
      try { await BackgroundService.stop(); } catch {}
      break;
    }

    try {
      await BackgroundService.updateNotification({
        taskDesc: `⚡ ${minutos} min carregando · +${calcularPontosTotal(minutos).toLocaleString('pt-BR')} pts`,
      });
    } catch {}
  }
}

const OPCOES_BASE = {
  taskName: 'cnb-carregamento',
  taskTitle: 'JUICE',
  taskDesc: 'Acumulando pontos enquanto você carrega...',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#00FF7F',
  linkingURI: 'com.cnb.cnbappv2://',
  // Android 14+ (API 34+) exige que o tipo declarado aqui coincida com o do AndroidManifest.
  // O plugin withBackgroundActions declara dataSync — deve ser igual aqui.
  foregroundServiceType: ['dataSync'],
};

// ─── API pública ─────────────────────────────────────────────────────────────

// Mutex nativo: impede que dois start() simultâneos cheguem ao módulo nativo.
// isRunning() pode retornar false enquanto o primeiro start() ainda não completou.
let iniciandoServico = false;

export async function iniciarForegroundService(uid) {
  if (!moduloDisponivel() || estaRodando() || iniciandoServico) return;
  iniciandoServico = true;
  try {
    await BackgroundService.start(tarefaCarregamento, { ...OPCOES_BASE, parameters: { uid } });
  } catch (e) {
    console.warn('[BackgroundService] Erro ao iniciar:', e?.message);
  } finally {
    iniciandoServico = false;
  }
}

export async function pararForegroundService() {
  if (!estaRodando()) return;
  try {
    await BackgroundService.stop();
  } catch (e) {
    console.warn('[BackgroundService] Erro ao parar:', e?.message);
  }
}

export function servicoRodando() {
  return estaRodando();
}
