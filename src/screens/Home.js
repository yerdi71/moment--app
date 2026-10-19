import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';
import { BottomNav, EmotionBadge } from '../components/UI';

export default function HomeScreen({ onSettings, onWrite, onOpenLast, onMoments, onProfile, lastEntry }) {
  return (
    <View style={styles.root}>
      <StarField />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Jeden</Text>
          <Text style={[styles.title, { color: COLORS.purpleLight }]}>Moment</Text>
        </View>
        <TouchableOpacity style={styles.gearBtn} onPress={onSettings} hitSlop={HIT_SLOP}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quoteCard}>
        <View style={styles.quoteHeaderRow}>
          <Text style={styles.quoteLabel}>CYTAT DNIA</Text>
          <Text style={styles.quoteMark}>”</Text>
        </View>
        <Text style={styles.quoteText}>„To, co małe,{'\n'}też tworzy wielkie życie."</Text>
      </View>

      <View style={styles.sceneWrap}>
        <MountainScene theme="night" />
        <View style={styles.plusWrap}>
          <TouchableOpacity style={styles.bigPlus} activeOpacity={0.85} onPress={onWrite}>
            <Text style={styles.bigPlusIcon}>+</Text>
          </TouchableOpacity>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Zapisz moment</Text>
            <Text style={styles.actionSub}>Co dziś chcesz zapamiętać?</Text>
          </View>
        </View>
      </View>

      {/* Karta Ostatniego wpisu */}
      <TouchableOpacity style={styles.lastCard} activeOpacity={0.8} onPress={onOpenLast}>
        <View style={styles.lastHeader}>
          <Text style={styles.lastLabel}>OSTATNI MOMENT</Text>
          {lastEntry && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.lastDate}>{lastEntry.fullDate}</Text>
              <Text style={styles.lastArrow}>›</Text>
            </View>
          )}
        </View>
        
        {lastEntry ? (
          <View style={styles.lastBody}>
            <View style={styles.lastThumb}>
              <MountainScene height={56} theme="dusk" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.lastTitle} numberOfLines={1}>{lastEntry.text}</Text>
              <View style={{ marginTop: 4 }}>
                <EmotionBadge emotionKey={lastEntry.emotion} />
              </View>
            </View>
          </View>
        ) : (
          <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8 }}>
            Twoja historia zaczyna się dzisiaj. Kliknij + powyżej.
          </Text>
        )}
      </TouchableOpacity>

      <BottomNav active="home" onHome={() => {}} onMoments={onMoments} onProfile={onProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 30, letterSpacing: -0.5 },
  gearBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: 17 },
  quoteCard: { marginHorizontal: 24, marginTop: 12, backgroundColor: 'rgba(20,14,38,0.85)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)', borderRadius: 16, padding: 14, zIndex: 20 },
  quoteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  quoteLabel: { color: COLORS.purpleLight, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  quoteMark: { color: COLORS.purpleLight, fontSize: 22, fontWeight: '700', lineHeight: 22, opacity: 0.55 },
  quoteText: { color: COLORS.white, fontSize: 15, lineHeight: 21, fontWeight: '500' },
  sceneWrap: { flex: 1, marginTop: -30, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  plusWrap: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 18, zIndex: 5 },
  bigPlus: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.purple, shadowOpacity: 0.8, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 18 },
  bigPlusIcon: { color: COLORS.white, fontSize: 48, fontWeight: '300', lineHeight: 52, marginTop: -3 },
  actionTextWrap: { alignItems: 'center', marginTop: 14 },
  actionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  actionSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  lastCard: { marginHorizontal: 24, marginTop: 8, marginBottom: 78, backgroundColor: 'rgba(20,14,38,0.7)', borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 16, padding: 12, zIndex: 10 },
  lastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lastLabel: { color: COLORS.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  lastDate: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  lastArrow: { color: COLORS.textMuted, fontSize: 17, marginLeft: 6 },
  lastBody: { flexDirection: 'row', alignItems: 'center' },
  lastThumb: { width: 56, height: 56, borderRadius: 11, backgroundColor: '#1c1030', overflow: 'hidden' },
  lastTitle: { color: COLORS.white, fontSize: 13.5, fontWeight: '700' },
});