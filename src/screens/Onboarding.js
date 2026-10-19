import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SCREEN, HIT_SLOP } from '../theme';

// Proste grafiki dla onboardingu
function HeroArt({ size = 260 }) {
  return (
    <View style={{ width: size, height: size * 0.82, borderRadius: 26, overflow: 'hidden', backgroundColor: '#140f28' }}>
      <View style={{ position: 'absolute', top: 20, right: 30, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(246,217,240,0.18)' }} />
      <View style={{ position: 'absolute', top: 30, right: 40, width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3dcee' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', backgroundColor: COLORS.bg }} />
    </View>
  );
}

function SproutArt({ size = 220 }) {
  return (
    <View style={{ width: size, height: size * 0.85, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', top: 10, width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, backgroundColor: 'rgba(124,58,237,0.18)' }} />
      <View style={{ width: 5, height: size * 0.32, backgroundColor: '#bdf0b2', borderRadius: 3 }} />
      <View style={{ width: size * 0.78, height: 26, borderRadius: 13, backgroundColor: '#1d1430', marginTop: -2 }} />
    </View>
  );
}

const SLIDES = [
  { id: 'welcome', kind: 'hero', counter: null, showSkip: false,
    titleParts: [{ text: 'Jeden ', color: COLORS.white }, { text: 'Moment', color: COLORS.purpleLight }],
    subtitle: 'Zatrzymaj to co ulotne.', footLine1: 'Małe chwile.', footLine2: 'Wielkie znaczenie.' },
  { id: 'capture', kind: 'feature', counter: '2/4', showSkip: true, icon: '✏️',
    title: 'Zapisuj chwile', subtitle: 'Jeden wpis dziennie.\nKrótka myśl, która zostaje.' },
  { id: 'remind', kind: 'feature', counter: '3/4', showSkip: true, icon: '🔔',
    title: 'Pamiętaj o tym,\nco ważne', subtitle: 'Delikatne przypomnienie o 20:00,\nżeby wrócić do siebie.' },
  { id: 'grow', kind: 'final', counter: '4/4', showSkip: false, icon: '🌱',
    title: 'Więcej uważności\nna co dzień', subtitle: 'Odkrywaj siebie, doceniaj chwile\ni buduj piękniejsze jutro.' },
];

export default function OnboardingScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = SLIDES[index];

  const goTo = (next) => {
    if (next < 0 || next > SLIDES.length - 1 || next === index) return;
    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.counter}>{slide.counter ?? ''}</Text>
        {slide.showSkip && (
          <TouchableOpacity onPress={() => onDone()} hitSlop={HIT_SLOP}>
            <Text style={styles.skip}>Pomiń</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        {slide.kind === 'hero' ? (
          <>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>
                {slide.titleParts.map((part, i) => <Text key={i} style={{ color: part.color }}>{part.text}</Text>)}
              </Text>
              <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
            </View>
            <View style={styles.artWrap}><HeroArt /></View>
            <View style={styles.footBlock}>
              <Text style={styles.footText}>{slide.footLine1}</Text>
              <Text style={styles.footText}>{slide.footLine2}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.iconCircle}><Text style={{ fontSize: 24 }}>{slide.icon}</Text></View>
            <Text style={styles.featureTitle}>{slide.title}</Text>
            <Text style={styles.featureSubtitle}>{slide.subtitle}</Text>
            <View style={styles.artWrap}>{slide.kind === 'final' && <SproutArt />}</View>
          </>
        )}
      </Animated.View>

      <View style={styles.bottom}>
        {slide.kind !== 'final' ? (
          <View style={styles.navRow}>
            {index > 0 ? (
              <TouchableOpacity style={styles.navCircle} onPress={() => goTo(index - 1)}>
                <Text style={styles.navArrow}>←</Text>
              </TouchableOpacity>
            ) : <View style={{ flex: 1 }} />}
            <TouchableOpacity style={[styles.navCircle, { backgroundColor: COLORS.purple }]} onPress={() => goTo(index + 1)}>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.ctaBtn} onPress={onDone}>
            <Text style={styles.ctaText}>Zaczynamy</Text>
            <Text style={styles.navArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 50 },
  counter: { color: COLORS.textMuted, fontSize: 14 },
  skip: { color: COLORS.textMuted, fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center' },
  heroTextBlock: { width: '100%', marginTop: 20 },
  heroTitle: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  heroSubtitle: { color: COLORS.textMuted, fontSize: 16, marginTop: 10 },
  artWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footBlock: { width: '100%', marginBottom: 20 },
  footText: { color: COLORS.textFaint, fontSize: 14 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 20 },
  featureTitle: { color: COLORS.white, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  featureSubtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 10 },
  bottom: { paddingHorizontal: 28, paddingBottom: 30 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between' },
  navCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  ctaBtn: { flexDirection: 'row', height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.purple, gap: 10 },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});