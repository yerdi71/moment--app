import React from 'react';
import { View, Text } from 'react-native';
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