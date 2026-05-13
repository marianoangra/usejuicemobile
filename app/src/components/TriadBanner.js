import React, { useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, useWindowDimensions, Linking, Alert } from 'react-native';

const TRIAD_URL = 'https://triadmarkets.app/?ref=7EeJ6aU31fsgRk4pVYREfrhJWbyXB7bL5gm8kSC9vRQu';
const BANNER_H = 180;
const TRIAD_BLUE = '#1F5BFF';
const TRIAD_YELLOW = '#FFD12C';

export default function TriadBanner() {
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
      'Triad Markets',
      'Você será redirecionado para criar sua conta na Triad pelo nosso link de parceria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir', onPress: () => Linking.openURL(TRIAD_URL) },
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
        accessibilityLabel="Abrir página de cadastro Triad Markets"
      >
        <View style={{
          width: imgWidth, height: BANNER_H, borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: TRIAD_BLUE,
        }}>
          {/* Texto à esquerda */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: imgWidth * 0.66,
            justifyContent: 'center',
            paddingLeft: 18,
          }}>
            <Text style={{
              color: TRIAD_YELLOW,
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 1.6,
              marginBottom: 6,
            }}>
              PARCEIRO OFICIAL
            </Text>
            <Text style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: '900',
              lineHeight: 25,
              letterSpacing: -0.5,
            }}>
              Fast markets.{'\n'}Non-stop.
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              fontWeight: '600',
              marginTop: 8,
              letterSpacing: 0.3,
            }}>
              Predict · Win · Reset
            </Text>
          </View>

          {/* Triângulo Triad à direita */}
          <View style={{
            position: 'absolute',
            right: 24,
            top: (BANNER_H - 96) / 2,
            width: 96, height: 96,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderStyle: 'solid',
              borderLeftWidth: 42,
              borderRightWidth: 42,
              borderBottomWidth: 70,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: '#ffffff',
              shadowColor: '#ffffff',
              shadowOpacity: 0.4,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }} />
            <Text style={{
              position: 'absolute',
              bottom: 0,
              color: '#ffffff',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
            }}>
              TRIAD
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
