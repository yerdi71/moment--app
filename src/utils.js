import { Platform, Vibration } from 'react-native';
import { EMOTIONS, STOPWORDS, VIBE_DESCRIPTIONS, TREE_STAGES, ACHIEVEMENTS_LIST } from './constants';

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
    // Wibracje niedostępne (np. web preview) – pomijamy
  }
};

// ─── DZIEŃ ROKU (dla promptów/cytatów) ───
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