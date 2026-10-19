import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';
import { StarField, MountainScene } from '../components/Art';
import { HINT_QUESTIONS } from '../data';
import { analyzeEmotion } from '../algorithm';

const MAX_CHARS = 150;

export default function WriteScreen({ onBack, onSave }) {
  const [text, setText] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  
  const counter = text.length;
  const canSave = counter > 0 && counter <= MAX_CHARS;

  // Algorytm działa na żywo! Pytania zmieniają się w trakcie pisania.
  const currentEmotion = text.length > 5 ? analyzeEmotion(text).emotion : 'calm';
  const hints = HINT_QUESTIONS[currentEmotion];

  const today = new Date();
  const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Dodaj moment</Text>
        <Text style={styles.subtitle}>Zatrzymaj to, co ważne...</Text>
      </View>

      <View style={styles.content}>
        {!keyboardOpen && (
          <View style={styles.preview}>
            <MountainScene height={SCREEN.H * 0.16} />
            <View style={styles.previewBadge}>
              <Text style={styles.previewStar}>✨</Text>
              <Text style={styles.previewText}>Tło dobrane automatycznie</Text>
            </View>
          </View>
        )}

        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>✏️</Text>
          <TextInput
            style={styles.input}
            placeholder="Dodaj opis tego momentu..."
            placeholderTextColor={COLORS.textFaint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX_CHARS}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{counter}/{MAX_CHARS}</Text>
        </View>

        {!keyboardOpen && (
          <View style={styles.row}>
            <View style={styles.halfCard}>
              <View style={styles.infoIconWrap}><Text style={styles.infoIcon}>📅</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Dziś</Text>
                <Text style={styles.infoDescSmall} numberOfLines={1}>{today.getDate()} {months[today.getMonth()]}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.halfCard} activeOpacity={0.7} onPress={() => setShowHints(!showHints)}>
              <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(139,92,246,0.25)' }]}><Text style={styles.infoIcon}>💡</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Pomoc</Text>
                <Text style={styles.infoDescSmall} numberOfLines={1}>{showHints ? 'Ukryj' : 'Pytania'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {showHints && !keyboardOpen && (
          <View style={styles.hintsWrap}>
            {hints.map((q, i) => (
              <View key={i} style={styles.hintItem}>
                <Text style={styles.hintDot}>•</Text>
                <Text style={styles.hintText} numberOfLines={1}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, !canSave && { opacity: 0.4 }]} onPress={() => canSave && onSave(text)} disabled={!canSave} activeOpacity={0.85}>
          <Text style={styles.saveIcon}>📖</Text>
          <Text style={styles.saveText}>Zapisz moment</Text>
          <Text style={styles.saveArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '800', lineHeight: 18, letterSpacing: -0.3 },
  titleWrap: { alignItems: 'center', marginTop: 4, marginBottom: 14 },
  title: { color: COLORS.white, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 },
  preview: { height: SCREEN.H * 0.16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 12 },
  previewBadge: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(11,8,21,0.8)', borderWidth: 1, borderColor: COLORS.cardBorder, gap: 6 },
  previewStar: { fontSize: 11 },
  previewText: { color: COLORS.white, fontSize: 10.5, fontWeight: '600' },
  inputWrap: { height: 110, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 26, marginBottom: 12 },
  inputIcon: { position: 'absolute', top: 14, left: 14, fontSize: 16, zIndex: 1 },
  input: { flex: 1, color: COLORS.white, fontSize: 15, lineHeight: 22, paddingLeft: 28, paddingTop: 0 },
  counter: { position: 'absolute', bottom: 8, right: 14, color: COLORS.textFaint, fontSize: 12, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  halfCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 14 },
  infoTitle: { color: COLORS.white, fontSize: 12.5, fontWeight: '700' },
  infoDescSmall: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  hintsWrap: { marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', borderRadius: 12 },
  hintItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 3, gap: 6 },
  hintDot: { color: COLORS.purpleLight, fontSize: 13, lineHeight: 18 },
  hintText: { flex: 1, color: COLORS.textMuted, fontSize: 12.5, lineHeight: 18 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 26, backgroundColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  saveIcon: { fontSize: 16 },
  saveText: { color: COLORS.white, fontSize: 15.5, fontWeight: '700', flex: 1, textAlign: 'center' },
  saveArrow: { color: COLORS.white, fontSize: 18, fontWeight: '600' },
});