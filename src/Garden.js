import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { vibrate } from './utils';
import { TREE_STAGES, GARDEN_ACHIEVEMENTS } from './constants';

// ─── Funkcje pomocnicze ───

const formatDateToKey = (dateObj) => {
  const d = dateObj || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── Obliczanie wzrostu drzewka ───
export const computeGardenGrowth = (moments) => {
  if (!moments || moments.length === 0) {
    return { total: 0, base: 0, bonus: 0, bonuses: {} };
  }

  let base = moments.length; // 1 punkt za każdy wpis
  let bonuses = {
    photos: 0,
    audio: 0,
    locations: 0,
    streaks: 0,
  };

  moments.forEach(m => {
    if (m.imageUri) bonuses.photos += 1;
    if (m.audioNote) bonuses.audio += 1;
    if (m.location) bonuses.locations += 1;
  });

  // Bonus za passę (każde 7 dni z rzędu = +10 pkt)
  const dateKeys = [...new Set(moments.map(m => m.dateKey || formatDateToKey(new Date(m.timestamp))))].sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate = null;

  dateKeys.forEach(key => {
    const current = new Date(key);
    if (prevDate) {
      const diffDays = Math.round((current - prevDate) / 86400000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    prevDate = current;
  });

  bonuses.streaks = Math.floor(maxStreak / 7) * 10;

  const bonusTotal = bonuses.photos + bonuses.audio + bonuses.locations + bonuses.streaks;
  const total = base + bonusTotal;

  return { total, base, bonus: bonusTotal, bonuses, maxStreak };
};

// ─── Stan drzewka (Kwitnące / Zdrowe / Spragnione / Zasmucone) ───
export const computeGardenState = (moments) => {
  const now = Date.now();
  const todayKey = formatDateToKey(new Date());

  if (!moments || moments.length === 0) {
    return {
      id: 'empty',
      emoji: '🌱',
      label: 'Zasiane Nasionko',
      color: '#8B5CF6',
      daysSinceLastEntry: null,
    };
  }

  // Sortuj wpisy od najnowszego
  const sorted = [...moments].sort((a, b) => b.timestamp - a.timestamp);
  const lastEntry = sorted[0];
  const lastKey = lastEntry.dateKey || formatDateToKey(new Date(lastEntry.timestamp));

  // Ile dni od ostatniego wpisu
  let daysSince = 0;
  const lastDate = new Date(lastKey);
  const today = new Date(todayKey);
  daysSince = Math.round((today - lastDate) / 86400000);

  if (daysSince <= 0) {
    return {
      id: 'blooming',
      emoji: '🌸',
      label: 'Kwitnące',
      desc: 'Twoje drzewko jest dziś szczęśliwe!',
      color: '#EC4899',
      daysSinceLastEntry: 0,
    };
  } else if (daysSince <= 2) {
    return {
      id: 'healthy',
      emoji: '🌿',
      label: 'Zdrowe',
      desc: 'Drzewko rośnie w siłę.',
      color: '#10B981',
      daysSinceLastEntry: daysSince,
    };
  } else if (daysSince <= 6) {
    return {
      id: 'thirsty',
      emoji: '🌾',
      label: 'Spragnione',
      desc: 'Drzewko czeka na wodę. Dodaj wpis!',
      color: '#F59E0B',
      daysSinceLastEntry: daysSince,
    };
  } else {
    return {
      id: 'sad',
      emoji: '🍂',
      label: 'Zasmucone',
      desc: 'Trochę zwiędło, ale nie umarło. Wróć do pisania!',
      color: '#92400E',
      daysSinceLastEntry: daysSince,
    };
  }
};

// ─── Czy drzewko było dziś podlane? ───
export const isWateredToday = (waterings) => {
  if (!waterings || waterings.length === 0) return false;
  const todayKey = formatDateToKey(new Date());
  return waterings.includes(todayKey);
};

// ─── Seria podlań (dni z rzędu) ───
export const computeWateringStreak = (waterings) => {
  if (!waterings || waterings.length === 0) return 0;

  const sorted = [...waterings].sort().reverse();
  const todayKey = formatDateToKey(new Date());
  const yestDate = new Date();
  yestDate.setDate(yestDate.getDate() - 1);
  const yesterdayKey = formatDateToKey(yestDate);

  if (sorted[0] !== todayKey && sorted[0] !== yesterdayKey) return 0;

  let streak = 1;
  let currentDate = new Date(sorted[0] === todayKey ? Date.now() : yestDate.getTime());

  for (let i = 1; i < sorted.length; i++) {
    currentDate.setDate(currentDate.getDate() - 1);
    const expectedKey = formatDateToKey(currentDate);
    if (sorted[i] === expectedKey) streak++;
    else break;
  }
  return streak;
};

// ─── Aktualny etap drzewka (progi) ───
export const getCurrentTreeStage = (growth) => {
  return TREE_STAGES.find(t => growth >= t.min) || TREE_STAGES[TREE_STAGES.length - 1];
};

export const getNextTreeStage = (growth) => {
  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (TREE_STAGES[i].min > growth) return TREE_STAGES[i];
  }
  return null;
};

// ─── Główny komponent ───
export default function Garden({
  moments,
  waterings,
  theme,
  styles,
  dynamicStyles,
  currentStreak,
  onWater,
  onBack,
}) {
  const growth = useMemo(() => computeGardenGrowth(moments), [moments]);
  const state = useMemo(() => computeGardenState(moments), [moments]);
  const wateringStreak = useMemo(() => computeWateringStreak(waterings), [waterings]);
  const wateredToday = useMemo(() => isWateredToday(waterings), [waterings]);
  const currentStage = useMemo(() => getCurrentTreeStage(growth.total), [growth.total]);
  const nextStage = useMemo(() => getNextTreeStage(growth.total), [growth.total]);

  const progressToNext = useMemo(() => {
    if (!nextStage) return 1;
    const range = nextStage.min - currentStage.min;
    const progress = (growth.total - currentStage.min) / range;
    return Math.max(0, Math.min(1, progress));
  }, [growth.total, currentStage, nextStage]);

  const handleWater = useCallback(() => {
    if (wateredToday) {
      vibrate([0, 40, 40, 40]);
      return;
    }
    vibrate(30);
    onWater();
  }, [wateredToday, onWater]);

  const unlockedAchievements = useMemo(() => {
    return GARDEN_ACHIEVEMENTS.filter(a => a.check(moments, waterings, currentStreak));
  }, [moments, waterings, currentStreak]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Nagłówek */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}>
          Twój Ogród
        </Text>
        <TouchableOpacity
          onPress={handleWater}
          disabled={wateredToday}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: wateredToday ? theme.border : theme.accent,
            opacity: wateredToday ? 0.5 : 1,
          }}
        >
          <Text style={{
            color: wateredToday ? theme.subtext : '#FFF',
            fontWeight: 'bold',
            fontSize: 13,
          }}>
            {wateredToday ? '💧 Podlane ✓' : '💧 Podlej'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Karta drzewka */}
      <View style={[
        dynamicStyles.card,
        {
          alignItems: 'center',
          paddingVertical: 40,
          backgroundColor: theme.card,
          borderColor: state.color,
          borderWidth: 2,
        }
      ]}>
        <Text style={{ fontSize: 120, marginBottom: 20 }}>
          {currentStage.icon}
        </Text>

        <Text style={{
          color: theme.text,
          fontSize: 24,
          fontWeight: '900',
          marginBottom: 8,
        }}>
          {currentStage.name}
        </Text>

        {/* Stan drzewka */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: state.color + '22',
          borderWidth: 1,
          borderColor: state.color,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>{state.emoji}</Text>
          <Text style={{
            color: state.color,
            fontWeight: 'bold',
            fontSize: 13,
          }}>
            {state.label}
          </Text>
        </View>

        <Text style={{
          color: theme.subtext,
          fontSize: 13,
          textAlign: 'center',
          paddingHorizontal: 30,
          lineHeight: 20,
          fontStyle: 'italic',
        }}>
          {state.desc}
        </Text>
      </View>

      {/* Postęp wzrostu */}
      {nextStage && (
        <View style={dynamicStyles.card}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>
              Do etapu {nextStage.icon}
            </Text>
            <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>
              {growth.total} / {nextStage.min}
            </Text>
          </View>

          <View style={{
            width: '100%',
            height: 12,
            backgroundColor: theme.border,
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            <View style={{
              width: `${progressToNext * 100}%`,
              height: '100%',
              backgroundColor: theme.accent,
              borderRadius: 6,
            }} />
          </View>

          <Text style={{
            color: theme.subtext,
            fontSize: 11,
            marginTop: 8,
            textAlign: 'right',
          }}>
            {Math.round(progressToNext * 100)}% • brakuje {nextStage.min - growth.total} pkt
          </Text>
        </View>
      )}

      {/* Statystyki ogrodu */}
      <Text style={[styles.sectionLabel, { color: theme.subtext, marginTop: 8 }]}>
        📊 Statystyki drzewka
      </Text>
      <View style={dynamicStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '900' }}>
              {growth.total}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>
              Wzrost
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '900' }}>
              {currentStreak}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>
              Passa dni
            </Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '900' }}>
              {wateringStreak}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>
              Podlane
            </Text>
          </View>
        </View>

        <View style={{
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingTop: 14,
          marginTop: 4,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: theme.text, fontSize: 13 }}>📸 Zdjęcia</Text>
            <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13 }}>
              +{growth.bonuses.photos} pkt
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: theme.text, fontSize: 13 }}>🎙️ Notatki głosowe</Text>
            <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13 }}>
              +{growth.bonuses.audio} pkt
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: theme.text, fontSize: 13 }}>📍 Miejsca</Text>
            <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13 }}>
              +{growth.bonuses.locations} pkt
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.text, fontSize: 13 }}>🔥 Bonus passy</Text>
            <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 13 }}>
              +{growth.bonuses.streaks} pkt
            </Text>
          </View>
        </View>
      </View>

      {/* Podlewanie info */}
      <Text style={[styles.sectionLabel, { color: theme.subtext }]}>
        💧 Podlewanie
      </Text>
      <View style={dynamicStyles.card}>
        <Text style={{ color: theme.text, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>
          {wateredToday
            ? '✅ Dziś podlane! Wróć jutro po kolejną kroplę.'
            : '💧 Podlej drzewko dziś, aby dodać +5% do następnego wpisu.'}
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 12, lineHeight: 18 }}>
          Podlewanie pomaga drzewku rosnąć szybciej. Jeśli zapomnisz — nie umiera, ale lekko więdnie. Zawsze możesz wrócić!
        </Text>
      </View>

      {/* Odznaki ogrodu */}
      <Text style={[styles.sectionLabel, { color: theme.subtext }]}>
        🏆 Odznaki ogrodu ({unlockedAchievements.length}/{GARDEN_ACHIEVEMENTS.length})
      </Text>
      <View style={dynamicStyles.card}>
        {GARDEN_ACHIEVEMENTS.map(a => {
          const unlocked = a.check(moments, waterings, currentStreak);
          return (
            <View key={a.id} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <Text style={{
                fontSize: 24,
                marginRight: 12,
                opacity: unlocked ? 1 : 0.3,
              }}>
                {a.icon}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: unlocked ? theme.text : theme.subtext,
                  fontWeight: 'bold',
                  fontSize: 14,
                }}>
                  {a.title}
                </Text>
                <Text style={{ color: theme.subtext, fontSize: 12 }}>
                  {a.desc}
                </Text>
              </View>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: unlocked ? theme.accent : theme.subtext,
              }}>
                {unlocked ? '✓' : '•'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}