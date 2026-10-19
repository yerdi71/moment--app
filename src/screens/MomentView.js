import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';
import { EmotionBadge } from '../components/UI';

export default function MomentViewScreen({ onBack, moment }) {
  // Jeśli moment jest pusty (np. z Home), pokazujemy dane testowe
  const data = moment || { text: 'Spokojny wieczór nad jeziorem...', emotion: 'calm' };

  return (
    <View style={styles.root}>
      <StarField />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={HIT_SLOP}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Jeden</Text>
          <Text style={[styles.headerTitle, { color: COLORS.purpleLight }]}>Moment</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} hitSlop={HIT_SLOP}>
          <Text style={styles.iconText}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.dateWrap}>
          <Text style={styles.day}>ŚRODA</Text>
          <Text style={styles.date}>15 października 2026</Text>
          <Text style={styles.time}>20:14</Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <MountainScene height={SCREEN.H * 0.22} />
          </View>
        </View>

        <View style={styles.textCard}>
          <View style={styles.textRow}>
            <Text style={styles.text}>{data.text}</Text>
            <EmotionBadge emotionKey={data.emotion} />
          </View>
          <Text style={styles.counter}>{data.text.length}/150</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Edytuj', 'Wkrótce')}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>Edytuj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Udostępnij', 'Wkrótce')}>
          <Text style={styles.actionIcon}>🔗</Text>
          <Text style={styles.actionLabel}>Udostępnij</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Usuń', 'Wkrótce')}>
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionLabel}>Usuń</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: COLORS.white, fontSize: 18 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  dateWrap: { alignItems: 'center', marginVertical: 16 },
  day: { color: COLORS.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  date: { color: COLORS.white, fontSize: 22, fontWeight: '700', marginTop: 6 },
  time: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },
  heroWrap: { paddingHorizontal: 20, marginBottom: 14 },
  heroCard: { height: SCREEN.H * 0.22, borderRadius: 20, overflow: 'hidden' },
  textCard: { marginHorizontal: 20, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14 },
  textRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  text: { flex: 1, color: COLORS.white, fontSize: 15, lineHeight: 22 },
  counter: { color: COLORS.textFaint, fontSize: 11, textAlign: 'right', marginTop: 8 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: COLORS.bg, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  actionBtn: { flex: 1, alignItems: 'center' },
  actionIcon: { fontSize: 18 },
  actionLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
});