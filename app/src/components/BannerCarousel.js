import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, ScrollView, View, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import FrontierBanner from './FrontierBanner';
import WhatsappBanner from './WhatsappBanner';
import KastBanner from './KastBanner';
import TriadBanner from './TriadBanner';
import JtxBanner from './JtxBanner';

const PRIMARY = '#c6ff4a';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CACHE_KEY = '@juice:banners:cache:v1';
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.45); // ~aspect 2.2:1

export default function BannerCarousel({ uid, perfil }) {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const [banners, setBanners] = useState(null); // null=loading, []=vazio, [...]=ativos
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);

  // Carrega cache primeiro pra evitar tela vazia em cold start
  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then(s => { if (s) try { setBanners(JSON.parse(s)); } catch {} })
      .catch(() => {});
  }, []);

  // onSnapshot do doc remoto
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'config', 'home_banners'),
      snap => {
        const lista = snap.exists() ? (snap.data().banners ?? []) : [];
        const agora = Date.now();
        const pts = perfil?.pontos ?? 0;
        const modo = perfil?.modo;
        const visiveis = lista
          .filter(b => {
            if (!b.ativo) return false;
            if (b.inicio && new Date(b.inicio).getTime() > agora) return false;
            if (b.fim && new Date(b.fim).getTime() < agora) return false;
            if (b.segmentoPtsMin && pts < b.segmentoPtsMin) return false;
            if (b.segmentoPtsMax && pts > b.segmentoPtsMax) return false;
            if (b.segmentoModo && b.segmentoModo !== modo) return false;
            if (!b.imagemUrl) return false;
            return true;
          })
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        setBanners(visiveis);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(visiveis)).catch(() => {});
      },
      err => { console.warn('[BannerCarousel] onSnapshot falhou:', err?.message ?? err); },
    );
    return () => unsub();
  }, [perfil?.pontos, perfil?.modo]);

  // Auto-avanço a cada 6s
  useEffect(() => {
    const total = (banners && banners.length > 0) ? banners.length : 5; // 5 = fallback (WhatsApp + Kast + Triad + JTX + Frontier)
    if (total < 2) return;
    const interval = setInterval(() => {
      const next = (activeIdxRef.current + 1) % total;
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== activeIdxRef.current) {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
    }
  }, []);

  async function onPressBanner(b) {
    // Best-effort tracking (failsafe — não bloqueia navegação)
    try {
      addDoc(collection(db, 'banner_clicks'), {
        bannerId: b.id,
        campaignId: b.campaignId ?? null,
        sponsorId: b.sponsorId ?? null,
        uid: uid ?? null,
        clicadoEm: serverTimestamp(),
      }).catch(() => {});
    } catch {}

    if (!b.deeplink) return;
    if (b.deeplink.startsWith('http://') || b.deeplink.startsWith('https://')) {
      Linking.openURL(b.deeplink).catch(() => {});
    } else {
      try { navigation.navigate(b.deeplink); }
      catch (e) { console.warn('[BannerCarousel] navigate falhou:', b.deeplink, e?.message); }
    }
  }

  // Decide o que renderizar:
  //  - banners === null (loading) OU banners === [] (sem banners) → fallback legacy
  //  - banners tem itens → renderiza eles
  const usarFallback = !banners || banners.length === 0;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
      >
        {usarFallback ? (
          <>
            <View style={{ width: BANNER_WIDTH }}><WhatsappBanner /></View>
            <View style={{ width: BANNER_WIDTH, marginLeft: 40 }}><KastBanner /></View>
            <View style={{ width: BANNER_WIDTH, marginLeft: 40 }}><TriadBanner /></View>
            <View style={{ width: BANNER_WIDTH, marginLeft: 40 }}><JtxBanner /></View>
            <View style={{ width: BANNER_WIDTH, marginLeft: 40 }}><FrontierBanner /></View>
          </>
        ) : (
          banners.map((b, i) => (
            <View key={b.id ?? i} style={{ width: BANNER_WIDTH, marginLeft: i === 0 ? 0 : 40 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onPressBanner(b)}
                accessibilityLabel={b.tituloAlt}
                accessibilityRole="link"
              >
                <Image
                  source={{ uri: b.imagemUrl }}
                  style={{ width: '100%', height: BANNER_HEIGHT, borderRadius: 14, backgroundColor: '#0d1421' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {(usarFallback ? [0, 1, 2, 3, 4] : banners).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dotBase,
              i === activeIdx ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  dotBase: { height: 4, borderRadius: 2 },
  dotActive: { backgroundColor: PRIMARY, width: 16 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.25)', width: 8 },
});
