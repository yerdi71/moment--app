import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';

export default function PinScreen({ onBack, onDone }) {
  const [pin, setPin] = useState('');

  const handlePress = (n) => {
    if (pin.length >= 4) return;
    const newPin = pin + n;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => { onDone && onDone(); }, 200);
    }
  };

  const Key = ({ val, icon }) => (
    <TouchableOpacity style={styles.key} onPress={() => val ? handlePress(val) : Alert.alert('Wkrótce')}>
      <Text style={icon ? styles.keyIcon : styles.keyText}>{val || icon}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}><MountainScene height={SCREEN.H} /></View>
      <StarField />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={HIT_SLOP}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jeden Moment</Text>
        <View style={{ width: 42 }} />
      </View>
      
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Ustaw PIN</Text>
        <Text style={styles.subtitle}>Wybierz 4-cyfrowy kod.</Text>
      </View>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, pin.length > i && { backgroundColor: COLORS.purple, borderColor: COLORS.purpleLight }]} />
        ))}
      </View>

      <View style={styles.keyboard}>
        <View style={styles.row}><Key val="1" /><Key val="2" /><Key val="3" /></View>
        <View style={styles.row}><Key val="4" /><Key val="5" /><Key val="6" /></View>
        <View style={styles.row}><Key val="7" /><Key val="8" /><Key val="9" /></View>
        <View style={styles.row}><Key icon="👆" /><Key val="0" /><Key icon="⌫" /></View>
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
  titleWrap: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  title: { color: COLORS.white, fontSize: 28, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 40 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(196,181,253,0.35)' },
  keyboard: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  keyText: { color: COLORS.white, fontSize: 26 },
  keyIcon: { fontSize: 24 },
});