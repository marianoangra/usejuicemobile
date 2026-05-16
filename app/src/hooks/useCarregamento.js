import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Battery from 'expo-battery';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { iniciarForegroundService, pararForegroundService, servicoRodando } from '../services/backgroundService';
import {
  lerBateria, lerSessao, salvarSessao, limparSessao, novaSessao,
  sessaoResumivel, minutosDecorridos, marcarCheckpoint, reconciliar,
  estaCarregando, LIMITE_MINUTOS,
} from '../services/sessaoCarregamento';
import { logInicioCarregamento, logFimCarregamento, logSessaoOnChain } from '../services/analytics';
import { calcularPontosTotal } from '../services/pontos';
import { getDeviceHash } from '../services/deviceFingerprint';
import { emitPontosUpdate } from '../services/chargeEvents';
import { notificarInicioCarregamento } from '../services/notificacoes';

// A cada quantos minute ticks chamar reconciliarSessao (mantém o Firestore
// atualizado durante carga em foreground e o marcador antifraude fresco).
const TICKS_POR_RECONCILE = 5;

export function useCarregamento(uid, onPontosAdicionados) {
  const [carregando, setCarregando] = useState(false);
  const [pontosGanhos, setPontosGanhos] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(3600);
  const [limiteBotAtingido, setLimiteBotAtingido] = useState(false);

  const uidRef = useRef(uid);
  const carregandoRef = useRef(false);
  const onAtualizarRef = useRef(onPontosAdicionados);
  const montadoRef = useRef(true);

  // Espelho em memória da sessão persistida (modelo em sessaoCarregamento.js)
  const sessaoRef = useRef(null);
  const limiteBotRef = useRef(false);
  const reconcileTickRef = useRef(0);

  // Timers visuais — recalculam a UI pelo relógio; se forem throttled, nada
  // se perde, pois o valor é derivado de (agora - chargeStartedAt).
  const countdownRef = useRef(null);   // 1s — segundosRestantes
  const minuteTickRef = useRef(null);  // 60s — recalcula minutos e checkpoint

  // Mutexes: Android dispara múltiplos eventos de bateria ao conectar/desconectar
  const iniciandoSessaoRef = useRef(false);
  const parandoSessaoRef = useRef(false);
  const servicoIniciadoRef = useRef(false);
  const batteryDebounceRef = useRef(null);

  // pararSessao é referenciado pelo minute tick antes de ser declarado
  const pararSessaoRef = useRef(null);

  useEffect(() => { uidRef.current = uid; }, [uid]);
  useEffect(() => { onAtualizarRef.current = onPontosAdicionados; }, [onPontosAdicionados]);
  useEffect(() => { carregandoRef.current = carregando; }, [carregando]);
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // ─── UI pelo relógio ─────────────────────────────────────────────────────────

  // Recalcula pontos e countdown a partir de (agora - chargeStartedAt).
  // Devolve os minutos decorridos.
  const atualizarUI = useCallback(() => {
    if (!montadoRef.current) return 0;
    const s = sessaoRef.current;
    const m = minutosDecorridos(s);
    const pts = calcularPontosTotal(m);
    setPontosGanhos(pts);
    emitPontosUpdate(pts);
    if (s) {
      const seg = Math.floor((Date.now() - s.chargeStartedAt) / 1000) % 3600;
      setSegundosRestantes(3600 - seg);
    }
    return m;
  }, []);

  // ─── Timers visuais ──────────────────────────────────────────────────────────

  const pararTimers = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (minuteTickRef.current) { clearInterval(minuteTickRef.current); minuteTickRef.current = null; }
  }, []);

  const iniciarTimers = useCallback(() => {
    if (!countdownRef.current) {
      countdownRef.current = setInterval(() => {
        const s = sessaoRef.current;
        if (!s || !montadoRef.current) return;
        const seg = Math.floor((Date.now() - s.chargeStartedAt) / 1000) % 3600;
        setSegundosRestantes(3600 - seg);
      }, 1000);
    }
    if (!minuteTickRef.current) {
      minuteTickRef.current = setInterval(async () => {
        const m = atualizarUI();

        // Anti-bot: interrompe após 8 horas consecutivas de carregamento.
        if (m >= LIMITE_MINUTOS) {
          limiteBotRef.current = true;
          if (montadoRef.current) setLimiteBotAtingido(true);
          await pararSessaoRef.current?.();
          return;
        }

        // Avança o checkpoint a cada minuto (chargeEndedAt honesto se o app
        // for morto) e reconcilia periodicamente (mantém o Firestore em dia).
        let s = sessaoRef.current;
        if (s) {
          s = await marcarCheckpoint(s);
          sessaoRef.current = s;
          reconcileTickRef.current += 1;
          if (reconcileTickRef.current >= TICKS_POR_RECONCILE) {
            reconcileTickRef.current = 0;
            const bateria = await lerBateria();
            await reconciliar(s, bateria);
            onAtualizarRef.current?.();
          }
        }
      }, 60000);
    }
  }, [atualizarUI]);

  // ─── Sessão ──────────────────────────────────────────────────────────────────

  const iniciarSessao = useCallback(async () => {
    if (!uidRef.current) return;
    // Mutex: impede chamadas concorrentes (Android dispara eventos múltiplos)
    if (iniciandoSessaoRef.current) return;
    iniciandoSessaoRef.current = true;

    try {
      const bateria = await lerBateria();

      // Retoma a sessão guardada se o checkpoint ainda for recente; caso
      // contrário concilia a sessão órfã (de uma carga anterior) e inicia uma nova.
      const guardada = await lerSessao(uidRef.current);
      let sessao;
      let resumida = false;
      if (guardada && sessaoResumivel(guardada)) {
        sessao = guardada;
        resumida = true;
      } else {
        if (guardada) {
          // Sessão órfã — credita só até o checkpoint dela (charging:false),
          // sem incluir o tempo não observado até agora.
          await reconciliar(guardada, { charging: false, nivel: bateria.nivel });
        }
        sessao = novaSessao(uidRef.current, bateria.nivel);
        await salvarSessao(sessao);
      }
      sessaoRef.current = sessao;
      reconcileTickRef.current = 0;
      limiteBotRef.current = false;
      if (montadoRef.current) setLimiteBotAtingido(false);

      logInicioCarregamento();
      // Notifica o usuário se o app estiver em background
      notificarInicioCarregamento().catch(() => {});

      atualizarUI();
      iniciarTimers();

      // Sessão retomada: credita o gap recente.
      if (resumida) {
        await reconciliar(sessao, bateria);
        onAtualizarRef.current?.();
      }

      // Já passou de 8h (sessão retomada antiga)? encerra.
      if (minutosDecorridos(sessao) >= LIMITE_MINUTOS) {
        limiteBotRef.current = true;
        if (montadoRef.current) setLimiteBotAtingido(true);
        await pararSessaoRef.current?.();
        return;
      }

      // Foreground Service — crédito ao vivo no Android e roda em background
      try {
        await iniciarForegroundService(uidRef.current);
        servicoIniciadoRef.current = servicoRodando();
      } catch (e) {
        console.warn('[Carregar] Erro ao iniciar serviço:', e?.message);
        servicoIniciadoRef.current = false;
      }
    } finally {
      iniciandoSessaoRef.current = false;
    }
  }, [iniciarTimers, atualizarUI]);

  const pararSessao = useCallback(async () => {
    // Mutex: impede chamadas concorrentes
    if (parandoSessaoRef.current) return;
    parandoSessaoRef.current = true;

    try {
      pararTimers();

      // Sessão autoritativa: a do storage (o foreground service pode tê-la
      // atualizado), com fallback para o espelho em memória.
      const guardada = await lerSessao(uidRef.current);
      const sessao = guardada || sessaoRef.current;

      let minutosFinal = 0;
      if (sessao) {
        const bateria = await lerBateria();
        // Reconciliação final — credita o gap que faltou. Encadeada, então
        // não é descartada mesmo se uma reconciliação periódica estiver em voo.
        await reconciliar(sessao, bateria);
        const chargeEndedAt = bateria.charging ? Date.now() : sessao.ultimoCheckpoint;
        minutosFinal = minutosDecorridos(sessao, chargeEndedAt);
      }

      sessaoRef.current = null;
      if (montadoRef.current) {
        setPontosGanhos(0);
        setSegundosRestantes(3600);
      }
      emitPontosUpdate(0);

      await limparSessao();
      try { await pararForegroundService(); } catch {}
      servicoIniciadoRef.current = false;

      if (minutosFinal > 0) {
        logFimCarregamento(minutosFinal, calcularPontosTotal(minutosFinal));
        // Registra prova on-chain da sessão (não-bloqueante — falha silenciosa)
        getDeviceHash().then(deviceHash =>
          httpsCallable(getFunctions(), 'registrarProvasSessao')({ duracaoMinutos: minutosFinal, deviceHash })
        )
          .then(r => logSessaoOnChain(minutosFinal, calcularPontosTotal(minutosFinal), r?.data?.signature))
          .catch(() => logSessaoOnChain(minutosFinal, calcularPontosTotal(minutosFinal), null));
        onAtualizarRef.current?.();
      }
    } finally {
      parandoSessaoRef.current = false;
    }
  }, [pararTimers]);

  useEffect(() => { pararSessaoRef.current = pararSessao; }, [pararSessao]);

  // ─── Sincroniza ao retornar ao foreground ────────────────────────────────────

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active') return;
      if (!carregandoRef.current) return;

      const bateria = await lerBateria();

      if (bateria.charging) {
        // Credita o gap que passou com o app suspenso (iOS) ou com o serviço
        // morto pelo SO (Android). É aqui que a contagem por relógio destrava.
        let sessao = (await lerSessao(uidRef.current)) || sessaoRef.current;
        if (sessao) {
          sessao = await marcarCheckpoint(sessao);
          sessaoRef.current = sessao;
          await reconciliar(sessao, bateria);
        }
        const m = atualizarUI();

        if (m >= LIMITE_MINUTOS) {
          limiteBotRef.current = true;
          if (montadoRef.current) setLimiteBotAtingido(true);
          await pararSessao();
        } else if (!servicoRodando() && uidRef.current && !limiteBotRef.current) {
          // Serviço morto pelo SO — religa.
          try { await iniciarForegroundService(uidRef.current); } catch {}
        }
      } else {
        // Carregador foi desconectado enquanto o app estava fora.
        if (montadoRef.current) setCarregando(false);
        await pararSessao();
      }

      onAtualizarRef.current?.();
    });
    return () => sub.remove();
  }, [atualizarUI, pararSessao]);

  // ─── Inicialização: detecção de bateria ──────────────────────────────────────

  useEffect(() => {
    let sub;
    let ativo = true;

    (async () => {
      try {
        const { charging } = await lerBateria();
        if (!ativo) return;
        if (montadoRef.current) setCarregando(charging);
        if (charging) {
          await iniciarSessao();
        }
        // Não chama pararSessao() no mount quando não está carregando —
        // evita chamar onAtualizar desnecessariamente na abertura da tela

        sub = Battery.addBatteryStateListener(({ batteryState }) => {
          // Debounce: Android pode disparar múltiplos eventos ao conectar/desconectar USB.
          // Aguarda 1500ms para o estado estabilizar antes de agir.
          if (batteryDebounceRef.current) clearTimeout(batteryDebounceRef.current);
          batteryDebounceRef.current = setTimeout(async () => {
            batteryDebounceRef.current = null;
            if (!ativo) return;
            try {
              const c = estaCarregando(batteryState);
              if (montadoRef.current) setCarregando(c);
              if (c) {
                await iniciarSessao();
              } else {
                await pararSessao();
              }
            } catch (e) {
              console.warn('[Carregar] Erro no listener de bateria:', e);
            }
          }, 1500);
        });
      } catch (e) {
        console.warn('[Carregar] Erro ao inicializar bateria:', e);
        if (ativo && montadoRef.current) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
      if (batteryDebounceRef.current) {
        clearTimeout(batteryDebounceRef.current);
        batteryDebounceRef.current = null;
      }
      sub?.remove();
      pararTimers();
      pararForegroundService().catch(() => {});
    };
  }, [iniciarSessao, pararSessao, pararTimers]);

  return { carregando, pontosGanhos, segundosRestantes, limiteBotAtingido };
}
