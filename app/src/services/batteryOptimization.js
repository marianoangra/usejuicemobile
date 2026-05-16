// Isenção de otimização de bateria (Android).
//
// Em muitos fabricantes (Xiaomi, Samsung, Motorola, Oppo...) o sistema mata o
// foreground service de carregamento em segundo plano, o que faz a contagem de
// pontos travar até o usuário reabrir o app. Liberar o JUICE da otimização de
// bateria reduz bastante essa morte do serviço.
//
// Implementação sem dependência nem permissão extra: usa Linking.sendIntent
// (RN core, Android). O intent IGNORE_BATTERY_OPTIMIZATION_SETTINGS abre a
// LISTA de apps e NÃO exige a permissão restrita pelo Google Play
// REQUEST_IGNORE_BATTERY_OPTIMIZATIONS (essa seria a do diálogo de 1 toque).

import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FLAG_KEY = '@cnb/bateria_otimizacao_pedida_v1';

// iOS não tem o conceito de "battery optimization" — tudo aqui é no-op fora do Android.
export const SUPORTA_OTIMIZACAO_BATERIA = Platform.OS === 'android';

/**
 * Abre a tela de otimização de bateria do Android para o usuário liberar o JUICE.
 * Fallback: configurações do próprio app, caso o intent não seja resolvido.
 */
export async function abrirAjustesOtimizacaoBateria() {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch {
    try { await Linking.openSettings(); } catch {}
  }
}

/** Já mostramos o pedido de isenção de bateria a este usuário? */
export async function jaPediuOtimizacaoBateria() {
  try {
    return (await AsyncStorage.getItem(FLAG_KEY)) === '1';
  } catch {
    return true; // em caso de erro de storage, não insiste
  }
}

/** Marca que o pedido já foi exibido — mostrado apenas uma vez por instalação. */
export async function marcarOtimizacaoBateriaPedida() {
  try { await AsyncStorage.setItem(FLAG_KEY, '1'); } catch {}
}
