import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';

function Row({ icon, title, desc, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}><Text style={{ fontSize: 15 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {desc && <Text style={styles.rowDesc} numberOfLines={1}>{desc}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ onBack, onAppearance, onPin }) {
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
        <Text style={styles.title}>Ustawienia</Text>
        <Text style={styles.subtitle}>Dostosuj aplikację do siebie.</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.heroCard}>
          <MountainScene height={SCREEN.H * 0.09} />
        </View>
        <Row icon="🔔" title="Przypomnienia" desc="Delikatne powiadomienia" onPress={() => Alert.alert('Wkrótce')} />
        <Row icon="🎨" title="Wygląd" desc="Motywy, kolor akcentu" onPress={onAppearance} />
        <Row icon="🛡️" title="Prywatność i bezpieczeństwo" desc="PIN, biometria" onPress={onPin} />
        <Row icon="ℹ️" title="O aplikacji" desc="Wersja 0.8.0" onPress={() => Alert.alert('Jeden Moment v0.8.0')} />
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
  heroCard: { height: SCREEN.H * 0.09, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: COLORS.cardBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.18)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: COLORS.white, fontSize: 13.5, fontWeight: '700' },
  rowDesc: { color: COLORS.textMuted, fontSize: 11.5, marginTop: 1 },
  chevron: { color: COLORS.textMuted, fontSize: 18 },
});