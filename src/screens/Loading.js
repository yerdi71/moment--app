import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SCREEN } from '../theme';
import { StarField } from '../components/Art';

export default function LoadingScreen({ onDone }) {
  const fade = useRef(new Animated.Value(1)).current;
  const barW = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    pulse(d1, 0); pulse(d2, 200); pulse(d3, 400);

    Animated.timing(barW, { toValue: 1, duration: 800, useNativeDriver: false }).start();

    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => onDone && onDone());
    }, 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[styles.wrap, { opacity: fade }]}>
      <StarField />
      <Text style={styles.logo}>Jeden</Text>
      <Text style={[styles.logo, { color: COLORS.purpleLight }]}>Moment</Text>
      <Text style={styles.sub}>Ładowanie Twoich chwil...</Text>
      <View style={styles.bar}>
        <Animated.View style={[styles.barFill, { width: barW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: d1 }]} />
        <Animated.View style={[styles.dot, { opacity: d2 }]} />
        <Animated.View style={[styles.dot, { opacity: d3 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  logo: { fontSize: 44, fontWeight: '700', color: COLORS.white, letterSpacing: -1, textAlign: 'center', lineHeight: 48 },
  sub: { marginTop: 16, fontSize: 13, color: COLORS.textMuted, letterSpacing: 0.5 },
  bar: { marginTop: 32, width: SCREEN.W * 0.55, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.purpleLight },
  dots: { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.purpleLight, marginHorizontal: 3 },
});