import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Image, View, useWindowDimensions, Linking, Alert } from 'react-native';

const KAST_URL = 'https://app.kast.xyz/referral/HCNRPO3U';
const BANNER_H = 180;

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
        }}>
          <Image
            source={require('../../assets/kast-banner.png')}
            style={{ width: imgWidth, height: BANNER_H }}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
