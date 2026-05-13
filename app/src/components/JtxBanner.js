import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Image, View, useWindowDimensions, Linking, Alert } from 'react-native';

const JTX_URL = 'https://jtx.trade/?ref=usejuice';
const BANNER_H = 180;

export default function JtxBanner() {
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
      'JTX (Jito)',
      'Você será redirecionado para a JTX pelo nosso link de parceria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir', onPress: () => Linking.openURL(JTX_URL) },
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
        accessibilityLabel="Abrir página da JTX"
      >
        <View style={{
          width: imgWidth, height: BANNER_H, borderRadius: 16,
          overflow: 'hidden',
        }}>
          <Image
            source={require('../../assets/jtx-banner.png')}
            style={{ width: imgWidth, height: BANNER_H }}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
