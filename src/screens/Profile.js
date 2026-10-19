import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';
import { BottomNav } from '../components/UI';

export default function ProfileScreen({ onBack, onOpenLast, onMoments, onSettings }) {
  return (
    <View style={styles.root}>
      <StarField />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Jeden</Text>
            <Text style={[styles.title, { color: COLORS.purpleLight }]}>Moment</Text>
            <Text style={styles.profileLabel}>PROFIL</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Edytuj', 'Wkrótce')}>
            <Text style={{ fontSize: 17 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <MountainScene height={SCREEN.H * 0.26} theme="dawn" />
          <View style={styles.heroOverlay} />
          <View style={styles.avatar} />
          <Text style={styles.name}>Nazwa</Text>
          <Text style={styles.motto}>Zatrzymaj to, co ulotne.</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCol}><Text style={styles.statIcon}>🔥</Text><Text style={styles.statVal}>27</Text><Text style={styles.statLabel}>Dni z rzędu</Text></View>
          <View style={styles.divider} />
          <View style={styles.statCol}><Text style={styles.statIcon}>🌱</Text><Text style={styles.statVal}>63</Text><Text style={styles.statLabel}>Wszystkie chwile</Text></View>
          <View style={styles.divider} />
          <View style={styles.statCol}><Text style={styles.statIcon}>📅</Text><Text style={styles.statVal}>Paź 2026</Text><Text style={styles.statLabel}>Dołączył</Text></View>
        </View>

        <TouchableOpacity style={styles.lastCard} onPress={onOpenLast}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Twoje ostatnie wspomnienie</Text>
            <Text style={styles.cardDesc} numberOfLines={1}>Dziś poczułem spokój...</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="profile" onHome={onBack} onMoments={onMoments} onProfile={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  profileLabel: { color: COLORS.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 2.5, marginTop: 6 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 14, overflow: 'hidden' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,8,21,0.35)' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(11,8,21,0.85)', borderWidth: 2, borderColor: COLORS.purpleLight, marginTop: 12, marginBottom: 12, zIndex: 5 },
  name: { color: COLORS.white, fontSize: 24, fontWeight: '800', zIndex: 5 },
  motto: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, zIndex: 5, marginBottom: 16 },
  stats: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: COLORS.cardBg, borderRadius: 16, paddingVertical: 14 },
  statCol: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  divider: { width: 1, backgroundColor: COLORS.cardBorder, marginVertical: 8 },
  lastCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16 },
  cardTitle: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  chevron: { color: COLORS.textMuted, fontSize: 22 },
});