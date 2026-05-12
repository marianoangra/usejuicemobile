// Heartbeat de presença: marca lastSeen no doc do usuário a cada 5min em foreground.
// Usado pra contar "online agora", DAU/WAU/MAU no dashboard admin.
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const INTERVALO_MS = 5 * 60 * 1000; // 5 min

export function usePresence(uid) {
  const intervalRef = useRef(null);
  const subRef = useRef(null);

  useEffect(() => {
    if (!uid) return;

    const heartbeat = () => {
      // Silencioso: erros (offline, sem permissão) não devem quebrar o app
      updateDoc(doc(db, 'usuarios', uid), { lastSeen: serverTimestamp() })
        .catch(() => {});
    };

    const start = () => {
      heartbeat();
      intervalRef.current = setInterval(heartbeat, INTERVALO_MS);
    };
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Liga imediatamente
    start();

    // Pausa quando o app sai de foreground; retoma quando volta
    subRef.current = AppState.addEventListener('change', state => {
      if (state === 'active') { stop(); start(); }
      else stop();
    });

    return () => {
      stop();
      subRef.current?.remove?.();
    };
  }, [uid]);
}
