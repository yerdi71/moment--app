import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';
import { EMOTIONS_META } from '../data';

export function EmotionBadge({ emotionKey }) {
  const e = EMOTIONS_META.find(x => x.key === emotionKey) || EMOTIONS_META[1];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4, alignSelf: 'flex-start', backgroundColor: e.bg, borderColor: e.text + '55' }}>
      <Text style={{ fontSize: 11 }}>{e.icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: e.text }}>{e.label}</Text>
    </View>
  );
}

// Dolna nawigacja
export function BottomNav({ active, onHome, onMoments, onProfile }) {
  const items = [
    { id: 'home',    icon: '🏠', label: 'Dziś',    onPress: onHome },
    { id: 'moments', icon: '🖼️', label: 'Momenty', onPress: onMoments },
    { id: 'profile', icon: '👤', label: 'Profil',  onPress: onProfile },
  ];
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: 'rgba(11,8,21,0.96)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 10, paddingBottom: 16 }}>
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <TouchableOpacity key={it.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8} onPress={it.onPress}>
            <Text style={{ fontSize: 18, opacity: 0.9, color: isActive ? COLORS.purple : COLORS.textMuted }}>{it.icon}</Text>
            <Text style={{ color: isActive ? COLORS.purple : COLORS.textMuted, fontSize: 11, marginTop: 3, fontWeight: '500' }}>{it.label}</Text>
            {isActive && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.purple, marginTop: 4 }} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}