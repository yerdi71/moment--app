import { Platform, Vibration } from 'react-native';
import {
  EMOTIONS, STOPWORDS, VIBE_DESCRIPTIONS, TREE_STAGES,
  ACHIEVEMENTS_LIST, GARDEN_ACHIEVEMENTS,
} from './constants';

// ─── FORMATOWANIE DAT ───
export const formatDateToKey = (dateObj) => {
  const d = dateObj || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── WIBRACJE ───
export const vibrate = (pattern = 20) => {
  try {
    if (Platform.OS !== 'web') Vibration.vibrate(pattern);
  } catch (_error) {
    // Wibracje niedostępne – pomijamy
  }
};

// ─── DZIEŃ ROKU ───
export const getDayOfYear = (d = new Date()) => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
};

// ─── BUDOWA MOMENTU ───
export const buildMoment = (text, mood, imageUri, audioNote, location) => {
  const now = new Date();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.getTime(),
    dateKey: formatDateToKey(now),
    date: now.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
    text: text.trim(),
    mood,
    imageUri,
    audioNote,
    location: location?.trim() || '',
    isFavorite: false,
  };
};

// ─── PASSA ───
export const calculateStreak = (allMoments) => {
  if (!allMoments || allMoments.length === 0) return 0;
  const validDays = allMoments.map(m => m.dateKey || formatDateToKey(new Date(m.timestamp))).filter(Boolean);
  const uniqueDays = [...new Set(validDays)].sort((a, b) => b.localeCompare(a));
  if (uniqueDays.length === 0) return 0;
  const today = formatDateToKey(new Date());
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yesterday = formatDateToKey(yest);
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 1;
  let currDate = new Date(uniqueDays[0] === today ? Date.now() : yest.getTime());
  for (let i = 1; i < uniqueDays.length; i++) {
    currDate.setDate(currDate.getDate() - 1);
    if (uniqueDays[i] === formatDateToKey(currDate)) streak++;
    else break;
  }
  return streak;
};

// ─── SEKCJE LISTY ───
export const buildSections = (filteredMoments) => {
  const today = formatDateToKey(new Date());
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yesterday = formatDateToKey(yest);
  const weekAgo = Date.now() - 7 * 86400000;
  const twoWeeksAgo = Date.now() - 14 * 86400000;
  const buckets = { 'Dziś': [], 'Wczoraj': [], 'Ten tydzień': [], 'Zeszły tydzień': [] };
  const months = {};
  filteredMoments.forEach(m => {
    const k = m.dateKey || formatDateToKey(new Date(m.timestamp));
    if (k === today) buckets['Dziś'].push(m);
    else if (k === yesterday) buckets['Wczoraj'].push(m);
    else if (m.timestamp >= weekAgo) buckets['Ten tydzień'].push(m);
    else if (m.timestamp >= twoWeeksAgo) buckets['Zeszły tydzień'].push(m);
    else {
      const label = new Date(m.timestamp).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
      const cap = label.charAt(0).toUpperCase() + label.slice(1);
      if (!months[cap]) months[cap] = [];
      months[cap].push(m);
    }
  });
  const list = [];
  ['Dziś', 'Wczoraj', 'Ten tydzień', 'Zeszły tydzień'].forEach(k => {
    if (buckets[k].length) list.push({ title: k, data: buckets[k] });
  });
  Object.keys(months).forEach(k => {
    if (months[k].length) list.push({ title: k, data: months[k] });
  });
  return list;
};

export const paginateSections = (allSections, visibleCount) => {
  let remaining = visibleCount;
  const result = [];
  for (const sec of allSections) {
    if (remaining <= 0) break;
    const slice = sec.data.slice(0, remaining);
    result.push({ title: sec.title, data: slice });
    remaining -= slice.length;
  }
  return result;
};

// ─── STATYSTYKI ───
export const computeWeeklyReport = (moments) => {
  const ago = Date.now() - 7 * 86400000;
  const recent = moments.filter(m => m.timestamp >= ago);
  const emoCounts = {};
  EMOTIONS.forEach(e => emoCounts[e] = 0);
  recent.forEach(m => { if (m.mood && emoCounts[m.mood] !== undefined) emoCounts[m.mood]++; });
  let topMood = '😊', max = -1;
  for (const [e, c] of Object.entries(emoCounts)) if (c > max) { max = c; topMood = e; }
  return {
    count: recent.length,
    topMood,
    hasAudioCount: recent.filter(m => m.audioNote).length,
    hasImageCount: recent.filter(m => m.imageUri).length,
  };
};

export const computeLast7Days = (moments) => {
  const out = [];
  const labels = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateToKey(d);
    const count = moments.filter(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === key).length;
    out.push({ key, dayLabel: labels[d.getDay()], count, isToday: i === 0 });
  }
  return out;
};

export const computeTopWords = (moments) => {
  const counts = {};
  moments.forEach(m => {
    const words = m.text.toLowerCase()
      .replace(/[#.,!?;:„”"'()\[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
    words.forEach(w => counts[w] = (counts[w] || 0) + 1);
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
};

export const computeStats = (moments, currentStreak) => {
  const total = moments.length;
  const level = Math.floor(total / 5) + 1;
  const progress = (total % 5) / 5;
  const emoCounts = {};
  EMOTIONS.forEach(e => emoCounts[e] = 0);
  moments.forEach(m => { if (m.mood && emoCounts[m.mood] !== undefined) emoCounts[m.mood]++; });
  let dominantMood = '😊', maxC = -1;
  for (const [m, c] of Object.entries(emoCounts)) if (c > maxC) { maxC = c; dominantMood = m; }
  const currentTree = TREE_STAGES.find(t => total >= t.min) || TREE_STAGES[TREE_STAGES.length - 1];
  let nextTree = null, treeProgress = 1;
  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (TREE_STAGES[i].min > total) { nextTree = TREE_STAGES[i]; break; }
  }
  if (nextTree) {
    const range = nextTree.min - currentTree.min;
    const inStage = total - currentTree.min;
    treeProgress = range > 0 ? inStage / range : 0;
  }
  const unlockedCount = ACHIEVEMENTS_LIST.filter(a => a.check(moments, currentStreak)).length;
  return {
    totalEntries: total, level, progress, emotionCounts: emoCounts, dominantMood,
    vibe: VIBE_DESCRIPTIONS[dominantMood], currentTree, nextTree, treeProgress,
    unlockedCount, totalAchievements: ACHIEVEMENTS_LIST.length,
  };
};

export const computeMoodRecommendation = (moments, weeklyReport) => {
  const total = moments.length;
  const dominant = weeklyReport.topMood;
  if (total === 0) return null;
  const rules = {
    '😊': 'Masz w sobie dużo radości! Podziel się nią z kimś dziś.',
    '😌': total < 5 ? 'Cenisz spokój, ale rzadko piszesz. Spróbuj dodać 2 wpisy.' : 'Twoja praktyka spokoju jest piękna.',
    '⚡': 'Masz energię! Spróbuj wpisu o rzeczach, za które dziękujesz nawet w chaosie.',
    '💡': 'Częste momenty „Aha!” — zapisz jedną myśl, którą chcesz rozwijać.',
    '❤️': 'Relacje to Twój skarb. Napisz dziś wdzięczność do konkretnej osoby.',
  };
  return rules[dominant] || 'Trzymaj się regularności — 3 wpisy w tygodniu robią różnicę.';
};

export const computeNostalgiaBuckets = (moments) => {
  const findOn = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const key = formatDateToKey(d);
    return moments.filter(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === key);
  };
  return { week: findOn(7), month: findOn(30), year: findOn(365) };
};

// ═══════════════════════════════════════════
// ─── SYSTEM OGRODU ───
// ═══════════════════════════════════════════

// ─── Wzrost drzewka (1 pkt/wpisz + bonusy) ───
export const computeGardenGrowth = (moments) => {
  if (!moments || moments.length === 0) {
    return { total: 0, base: 0, bonus: 0, bonuses: { photos: 0, audio: 0, locations: 0, streaks: 0 }, maxStreak: 0 };
  }

  let base = moments.length;
  const bonuses = { photos: 0, audio: 0, locations: 0, streaks: 0 };

  moments.forEach(m => {
    if (m.imageUri) bonuses.photos += 1;
    if (m.audioNote) bonuses.audio += 1;
    if (m.location) bonuses.locations += 1;
  });

  // Bonus za najdłuższą passę (każde 7 dni = +10 pkt)
  const dateKeys = [...new Set(moments.map(m => m.dateKey || formatDateToKey(new Date(m.timestamp))))].sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate = null;

  dateKeys.forEach(key => {
    const current = new Date(key);
    if (prevDate) {
      const diffDays = Math.round((current - prevDate) / 86400000);
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
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

// ─── Stan drzewka ───
export const computeGardenState = (moments) => {
  const todayKey = formatDateToKey(new Date());

  if (!moments || moments.length === 0) {
    return {
      id: 'empty',
      emoji: '🌱',
      label: 'Zasiane Nasionko',
      desc: 'Dodaj swój pierwszy wpis, aby zacząć rosnąć.',
      color: '#8B5CF6',
      daysSinceLastEntry: null,
    };
  }

  const sorted = [...moments].sort((a, b) => b.timestamp - a.timestamp);
  const lastEntry = sorted[0];
  const lastKey = lastEntry.dateKey || formatDateToKey(new Date(lastEntry.timestamp));

  const lastDate = new Date(lastKey);
  const today = new Date(todayKey);
  const daysSince = Math.round((today - lastDate) / 86400000);

  if (daysSince <= 0) {
    return {
      id: 'blooming', emoji: '🌸', label: 'Kwitnące',
      desc: 'Twoje drzewko jest dziś szczęśliwe!',
      color: '#EC4899', daysSinceLastEntry: 0,
    };
  } else if (daysSince <= 2) {
    return {
      id: 'healthy', emoji: '🌿', label: 'Zdrowe',
      desc: 'Drzewko rośnie w siłę.',
      color: '#10B981', daysSinceLastEntry: daysSince,
    };
  } else if (daysSince <= 6) {
    return {
      id: 'thirsty', emoji: '🌾', label: 'Spragnione',
      desc: 'Drzewko czeka na wodę. Dodaj wpis!',
      color: '#F59E0B', daysSinceLastEntry: daysSince,
    };
  } else {
    return {
      id: 'sad', emoji: '🍂', label: 'Zasmucone',
      desc: 'Trochę zwiędło, ale nie umarło. Wróć do pisania!',
      color: '#92400E', daysSinceLastEntry: daysSince,
    };
  }
};

// ─── Podlewanie ───
export const isWateredToday = (waterings) => {
  if (!waterings || waterings.length === 0) return false;
  const todayKey = formatDateToKey(new Date());
  return waterings.includes(todayKey);
};

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

// ─── Etapy drzewka ───
export const getCurrentTreeStage = (growth) => {
  return TREE_STAGES.find(t => growth >= t.min) || TREE_STAGES[TREE_STAGES.length - 1];
};

export const getNextTreeStage = (growth) => {
  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (TREE_STAGES[i].min > growth) return TREE_STAGES[i];
  }
  return null;
};

// ─── Liczba dni od ostatniego wpisu ───
export const getDaysSinceLastEntry = (moments) => {
  if (!moments || moments.length === 0) return null;
  const sorted = [...moments].sort((a, b) => b.timestamp - a.timestamp);
  const lastKey = sorted[0].dateKey || formatDateToKey(new Date(sorted[0].timestamp));
  const lastDate = new Date(lastKey);
  const today = new Date(formatDateToKey(new Date()));
  return Math.round((today - lastDate) / 86400000);
};