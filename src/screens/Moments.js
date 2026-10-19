import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';
import { EmotionBadge, BottomNav } from '../components/UI';

// Na razie dane statyczne, ale struktura jest gotowa pod bazę AsyncStorage
const SAMPLE_MONTHS = [
  {
    id: 'oct2026', label: 'Październik 2026', count: 3,
    items: [
      { id: '1', date: '15 października 2026', time: '20:14', text: '„Dziś poczułem spokój. Małe rzeczy naprawdę potrafią cieszyć."', emotion: 'calm' },
      { id: '2', date: '8 października 2026', time: '19:42', text: '„Cisza, kawa i ten widok. Dobrze być tu i teraz."', emotion: 'joy' },
      { id: '3', date: '2 października 2026', time: '18:27', text: '„Małe chwile naprawdę mają znaczenie."', emotion: 'power' },
    ],
  },
];

export default function MomentsScreen({ onBack, onOpenMoment, onHome, onProfile }) {
  const [expanded, setExpanded] = useState({ oct2026: true });
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.root}>
      <StarField />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Jeden</Text>
          <Text style={[styles.title, { color: COLORS.purpleLight }]}>Moment</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Szukaj', 'Wkrótce.')} hitSlop={HIT_SLOP}>
          <Text style={styles.icon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => Alert.alert('Sortuj', 'Wkrótce.')} hitSlop={HIT_SLOP}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <MountainScene height={SCREEN.H * 0.20} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Wspomnienia</Text>
            <Text style={styles.heroSub}>Małe chwile. Wielkie zmiany.</Text>
          </View>
        </View>

        <View style={styles.monthsWrap}>
          {SAMPLE_MONTHS.map((m) => (
            <View key={m.id} style={styles.monthGroup}>
              <TouchableOpacity style={styles.monthHeader} activeOpacity={0.7} onPress={() => toggle(m.id)}>
                <Text style={styles.monthTitle}>{m.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.monthCount}>{m.count} chwile</Text>
                  <Text style={styles.monthChevron}>{expanded[m.id] ? '⌃' : '⌄'}</Text>
                </View>
              </TouchableOpacity>

              {expanded[m.id] && m.items.map((item) => (
                <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8} onPress={() => onOpenMoment(item)}>
                  <View style={styles.thumb}>
                    <MountainScene height={88} theme="dawn" />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardDate} numberOfLines={1}>{item.date}</Text>
                      <Text style={styles.cardTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.cardText} numberOfLines={2}>{item.text}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <EmotionBadge emotionKey={item.emotion} />
                    </View>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="moments" onHome={onHome} onMoments={() => {}} onProfile={onProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 30, letterSpacing: -0.5 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 17 },
  hero: { height: SCREEN.H * 0.20, overflow: 'hidden', marginBottom: 16 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,8,21,0.45)' },
  heroText: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 18, zIndex: 5 },
  heroTitle: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  heroSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  monthsWrap: { paddingHorizontal: 20 },
  monthGroup: { marginBottom: 18 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8 },
  monthTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  monthCount: { color: COLORS.textMuted, fontSize: 12 },
  monthChevron: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 16, padding: 10, marginBottom: 8 },
  thumb: { width: 80, height: 88, borderRadius: 12, overflow: 'hidden', backgroundColor: '#2d1a3d' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardDate: { color: COLORS.white, fontSize: 12.5, fontWeight: '700' },
  cardTime: { color: COLORS.textMuted, fontSize: 11 },
  cardText: { color: COLORS.textMuted, fontSize: 12.5, lineHeight: 17, marginBottom: 6 },
  cardArrow: { color: COLORS.textMuted, fontSize: 20, marginLeft: 6 },
});