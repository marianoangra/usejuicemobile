import React, { useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, useWindowDimensions, Linking, Alert } from 'react-native';

const KAST_URL = 'https://app.kast.xyz/referral/HCNRPO3U';
const BANNER_H = 180;
const KAST_GREEN = '#00E0B8';
const KAST_BG = '#0A0A0A';

export default function KastBanner() {
  const scale = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const imgWidth = width - 40;

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }
  function handlePress() {
    Alert.alert(
      'Cartão Kast',
      'Você será redirecionado para criar sua conta na Kast pelo nosso link de parceria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir', onPress: () => Linking.openURL(KAST_URL) },
      ],
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel="Abrir página de cadastro Kast"
      >
        <View style={{
          width: imgWidth, height: BANNER_H, borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: KAST_BG,
          borderWidth: 1, borderColor: 'rgba(0,224,184,0.2)',
        }}>
          {/* Texto à esquerda */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: imgWidth * 0.65,
            justifyContent: 'center',
            paddingLeft: 18,
          }}>
            <Text style={{
              color: KAST_GREEN,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.6,
              marginBottom: 6,
            }}>
              PARCEIRO OFICIAL
            </Text>
            <Text style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: '800',
              lineHeight: 26,
            }}>
              Cartão Kast{'\n'}cripto global
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12,
              marginTop: 8,
            }}>
              Use seu USDC no dia a dia
            </Text>
          </View>

          {/* "K" wordmark à direita */}
          <View style={{
            position: 'absolute',
            right: 20,
            top: (BANNER_H - 92) / 2,
            width: 92, height: 92,
            borderRadius: 22,
            borderWidth: 2, borderColor: KAST_GREEN,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: KAST_GREEN,
            shadowOpacity: 0.4,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 44,
              fontWeight: '900',
              letterSpacing: -2,
              includeFontPadding: false,
            }}>
              K
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
