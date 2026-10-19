import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SCREEN } from '../theme';
import { StarField, MountainScene } from '../components/Art';

export default function SuccessScreen({ onBack }) {
  return (
    <View style={styles.root}>
      <StarField />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jeden</Text>
        <Text style={[styles.headerTitle, { color: COLORS.purpleLight }]}>Moment</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.art}>
          <MountainScene height={SCREEN.H * 0.32} />
        </View>
        <Text style={styles.title}>Zapisano</Text>
        <Text style={[styles.title, { color: COLORS.purpleLight }]}>Twój moment</Text>
        <Text style={styles.sub}>Dziękujemy, że podzieliłeś się{'\n'}swoją chwilą.</Text>
        <TouchableOpacity style={styles.btn} onPress={onBack}>
          <Text style={styles.btnText}>Wróć do ekranu głównego</Text>
          <Text style={styles.btnArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  art: { width: '100%', height: SCREEN.H * 0.32, borderRadius: 20, overflow: 'hidden', marginVertical: 20 },
  title: { color: COLORS.white, fontSize: 30, fontWeight: '800', textAlign: 'center' },
  sub: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  btn: { flexDirection: 'row', width: '100%', paddingVertical: 18, paddingHorizontal: 28, borderRadius: 28, backgroundColor: COLORS.purple, justifyContent: 'space-between', alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: 15.5, fontWeight: '700', flex: 1, textAlign: 'center' },
  btnArrow: { color: COLORS.white, fontSize: 20 },
});