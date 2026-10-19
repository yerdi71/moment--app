import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN, COLORS } from '../theme';
import { ONLINE_BACKGROUNDS } from '../data';

const STARS = [
  { x: 0.08, y: 0.06, s: 1.5 }, { x: 0.22, y: 0.12, s: 1 },
  { x: 0.35, y: 0.04, s: 2 },   { x: 0.48, y: 0.10, s: 1 },
  { x: 0.62, y: 0.07, s: 1.5 }, { x: 0.78, y: 0.03, s: 1 },
  { x: 0.90, y: 0.14, s: 2 },   { x: 0.15, y: 0.22, s: 1 },
  { x: 0.55, y: 0.18, s: 1.5 }, { x: 0.85, y: 0.26, s: 1 },
];

export function StarField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map((st, i) => (
        <View key={i} style={{ position: 'absolute', left: SCREEN.W * st.x, top: SCREEN.H * st.y, width: st.s, height: st.s, borderRadius: st.s / 2, backgroundColor: COLORS.star, opacity: 0.7 }} />
      ))}
    </View>
  );
}

export function MountainScene({ height, theme = 'night' }) {
  const H = typeof height === 'number' ? height : SCREEN.H * 0.62;
  const [imgOk, setImgOk] = useState(true);
  const imgUrl = ONLINE_BACKGROUNDS[theme] || ONLINE_BACKGROUNDS.night;

  if (!imgOk) {
    const W = SCREEN.W;
    return (
      <View style={[{ height: H, overflow: 'hidden', backgroundColor: '#1a0f30' }]} pointerEvents="none">
        <View style={{ position: 'absolute', bottom: H * 0.30, left: -W * 0.35, width: 0, height: 0, borderLeftWidth: W * 0.55, borderRightWidth: W * 0.55, borderBottomWidth: H * 0.35, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#4a3060' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.30, backgroundColor: '#1c1030' }} />
      </View>
    );
  }

  return (
    <View style={{ height: H, overflow: 'hidden' }}>
      <ImageBackground source={{ uri: imgUrl }} style={{ flex: 1 }} resizeMode="cover" onError={() => setImgOk(false)}>
        <LinearGradient colors={['rgba(11,8,21,0.1)', 'rgba(11,8,21,0.95)']} style={StyleSheet.absoluteFill} />
      </ImageBackground>
    </View>
  );
}