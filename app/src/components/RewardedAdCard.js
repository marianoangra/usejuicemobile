// Card de anúncio premiado na Home (entre Parceiros e Atividades).
// Toca → abre o anúncio rewarded em tela cheia → usuário ganha 10 pontos.
// O crédito dos pontos é feito no servidor (AdMob SSV), nunca aqui — ver ads.js.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAccent } from '../context/AccentContext';
import { useTranslation } from 'react-i18next';
import { preloadRewarded, isRewardedReady, showRewarded } from '../services/ads';

const PONTOS_POR_AD = 10;

export default function RewardedAdCard({ uid }) {
  const { colors } = useTheme();
  const accent = useAccent();
  const { t } = useTranslation();
  const [status, setStatus] = useState('carregando');

  // "carregando": pré-carrega e observa até o anúncio ficar pronto.
  // "indisponivel": estado transitório — tenta de novo sozinho (o 1º anúncio,
  // em cold start, pode demorar). Nunca vira beco sem saída.
  useEffect(() => {
    let vivo = true;

    if (status === 'carregando') {
      // SSV precisa do uid — espera o perfil carregar antes de pedir anúncio.
      if (!uid) return () => { vivo = false; };
      preloadRewarded(uid);
      const poll = setInterval(() => {
        if (vivo && isRewardedReady()) {
          setStatus('pronto');
          clearInterval(poll);
        }
      }, 500);
      const limite = setTimeout(() => {
        if (vivo) setStatus((s) => (s === 'carregando' ? 'indisponivel' : s));
      }, 25000);
      return () => { vivo = false; clearInterval(poll); clearTimeout(limite); };
    }

    if (status === 'indisponivel') {
      const retry = setTimeout(() => { if (vivo) setStatus('carregando'); }, 6000);
      return () => { vivo = false; clearTimeout(retry); };
    }

    return () => { vivo = false; };
  }, [status, uid]);

  const assistir = useCallback(async () => {
    if (status !== 'pronto') return;
    setStatus('assistindo');
    try {
      await showRewarded(uid);
      // Crédito de +10 pts é feito no servidor (AdMob SSV → Cloud Function);
      // o saldo no topo da Home atualiza sozinho pelo snapshot do perfil.
      setStatus('recompensado');
    } catch {
      setStatus('indisponivel');
    }
    // Rearma para o próximo anúncio (tanto no sucesso quanto na falha).
    setTimeout(() => setStatus('carregando'), 3500);
  }, [status, uid]);

  // titulo/sub por estado; `destaque` = visual verde (oportunidade ativa)
  const textos = {
    carregando:   { titulo: t('ads.loadingTitle'),                            sub: t('ads.loadingSub'),     destaque: false },
    pronto:       { titulo: t('ads.readyTitle', { points: PONTOS_POR_AD }),    sub: t('ads.readySub'),       destaque: true  },
    assistindo:   { titulo: t('ads.watchingTitle'),                           sub: t('ads.watchingSub'),    destaque: false },
    recompensado: { titulo: t('ads.rewardedTitle', { points: PONTOS_POR_AD }), sub: t('ads.rewardedSub'),    destaque: true  },
    indisponivel: { titulo: t('ads.unavailableTitle'),                        sub: t('ads.unavailableSub'), destaque: false },
  };
  const ui = textos[status];
  const interativo = status === 'pronto';
  const corIcone = status === 'indisponivel' ? colors.textDim : accent;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontSize: 10, letterSpacing: 2, color: colors.textFaint,
        textTransform: 'uppercase', marginBottom: 8,
      }}>
        {t('ads.sectionTitle')}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={!interativo}
        onPress={assistir}
        accessibilityRole="button"
        accessibilityLabel={`${ui.titulo}. ${ui.sub}`}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 14,
          padding: 16, borderRadius: 16,
          backgroundColor: ui.destaque ? `${accent}0F` : colors.surface,
          borderWidth: 1,
          borderColor: ui.destaque ? `${accent}55` : colors.borderSubtle,
          opacity: status === 'indisponivel' ? 0.55 : 1,
        }}>
        {/* Ícone / estado */}
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: `${accent}26`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {status === 'carregando' || status === 'assistindo' ? (
            <ActivityIndicator size="small" color={accent} />
          ) : status === 'recompensado' ? (
            <Check size={22} color={accent} strokeWidth={3} />
          ) : (
            <Play size={20} color={corIcone} fill={corIcone} />
          )}
        </View>

        {/* Textos */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: '700', color: ui.destaque ? accent : colors.text }}>
            {ui.titulo}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>
            {ui.sub}
          </Text>
        </View>

        {/* CTA — só quando há anúncio pronto */}
        {status === 'pronto' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: accent, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
          }}>
            <Play size={12} color="#000" fill="#000" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#000' }}>{t('ads.watchBtn')}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
