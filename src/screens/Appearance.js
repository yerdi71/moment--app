import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SCREEN, ACCENTS, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';

const THEMES = [
  { id: 'night', label: 'Noc' }, { id: 'dusk', label: 'Zmierzch' },
  { id: 'dawn', label: 'Świt' }, { id: 'minimal', label: 'Minimal' },
];

export default function AppearanceScreen({ onBack }) {
  const [theme, setTheme] = useState('night');
  const [accent, setAccent] = useState(0);

  return (
    <View style={styles.root}>
      <StarField />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={HIT_SLOP}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jeden Moment</Text>
        <View style={{ width: 42 }} />
      </View>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Wygląd</Text>
        <Text style={styles.subtitle}>Wybierz styl, który Cię inspiruje.</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.preview}>
          <MountainScene height={SCREEN.H * 0.15} theme={theme} />
        </View>

        <View style={styles.themesRow}>
          {THEMES.map((t) => (
            <TouchableOpacity key={t.id} style={styles.themeItem} onPress={() => setTheme(t.id)}>
              <View style={[styles.themeBox, theme === t.id && { borderColor: COLORS.purpleLight }]} />
              <Text style={[styles.themeLabel, theme === t.id && { color: COLORS.white }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>KOLOR AKCENTU</Text>
        <View style={styles.accentsRow}>
          {ACCENTS.map((c, i) => (
            <TouchableOpacity key={i} onPress={() => setAccent(i)} style={[styles.accentOuter, accent === i && { borderColor: COLORS.purpleLight }]}>
              <View style={[styles.accentInner, { backgroundColor: c }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: COLORS.white, fontSize: 18 },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  titleWrap: { paddingHorizontal: 24, marginBottom: 14 },
  title: { color: COLORS.white, fontSize: 26, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  preview: { height: SCREEN.H * 0.15, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  themesRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  themeItem: { flex: 1, alignItems: 'center' },
  themeBox: { width: '100%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#1a0f30', marginBottom: 4 },
  themeLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  sectionLabel: { color: COLORS.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  accentsRow: { flexDirection: 'row', gap: 10 },
  accentOuter: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  accentInner: { width: 26, height: 26, borderRadius: 13 },
});