import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Vibration } from 'react-native';

// ═══════════════════════════════════════════
// KONFIGURACJA
// ═══════════════════════════════════════════

export const VERSION = '0.8.0';
export const GITHUB_REPO = 'yerdi71/moment--app';

export const STORAGE_KEYS = {
  moments: '@jm_moments',
  settings: '@jm_settings',
  onboarding: '@jm_onboarding_done',
  lastUpdateCheck: '@jm_last_update_check',
  pendingUpdate: '@jm_pending_update',
};

export const MAX_TEXT_LENGTH = 150;

// ═══════════════════════════════════════════
// PYTANIA DNIA (30)
// ═══════════════════════════════════════════

export const DAILY_PROMPTS = [
  'Co dziś było dla Ciebie ważne?',
  'Który moment dnia chcesz zapamiętać?',
  'Co dziś sprawiło Ci radość?',
  'Za co jesteś dziś wdzięczny?',
  'Co dobrego spotkało Cię dzisiaj?',
  'Jaka chwila była dla Ciebie wyjątkowa?',
  'Co dziś zauważyłeś, czego zwykle nie widzisz?',
  'Kogo dziś spotkałeś i jak się poczułeś?',
  'Co dziś zrobiłeś dla siebie?',
  'Jaki drobiazg dziś Cię ucieszył?',
  'Co dziś poszło lepiej niż się spodziewałeś?',
  'O czym dziś myślałeś najczęściej?',
  'Za co chciałbyś podziękować sobie?',
  'Co dziś Cię zaskoczyło?',
  'Jak wyglądałby ten dzień, gdybyś miał go opisać jednym zdaniem?',
  'Co dziś było trudne, ale tego nie żałujesz?',
  'Który obraz z dzisiaj chcesz zachować w pamięci?',
  'Co dziś sprawiło, że poczułeś się sobą?',
  'Jaki dźwięk, zapach lub smak dziś zapamiętasz?',
  'Co dziś zrobiłeś inaczej niż zwykle?',
  'Kto dziś okazał Ci życzliwość?',
  'Co dziś Cię uspokoiło?',
  'Za co chciałbyś być wdzięczny za rok?',
  'Co dziś było miłe w najmniejszym stopniu?',
  'Jaka myśl dziś do Ciebie wróciła?',
  'Co dziś zobaczyłeś pięknego?',
  'Który moment dnia minął zbyt szybko?',
  'Za co jesteś wdzięczny komuś, kogo dziś nie widziałeś?',
  'Co dziś zrobiłeś, co wymagało odwagi?',
  'Jaki moment dnia chciałbyś przeżyć jeszcze raz?',
];

// ═══════════════════════════════════════════
// CYTATY DNIA (20, prawdziwi autorzy)
// ═══════════════════════════════════════════

export const DAILY_QUOTES = [
  { text: 'Małe momenty mogą zmienić całe życie.', author: 'Nieznany' },
  { text: 'Szczęście to suma małych rzeczy.', author: 'Robert Brault' },
  { text: 'Życie jest tym, co się dzieje, gdy jesteś zajęty planowaniem.', author: 'John Lennon' },
  { text: 'Ciesz się małymi rzeczami, bo kiedyś spojrzysz wstecz i zobaczysz, że były wielkie.', author: 'Robert Brault' },
  { text: 'Nie liczy się to, ile mamy, ale ile doceniamy.', author: 'Melody Beattie' },
  { text: 'Wdzięczność zamienia to, co mamy, w to, co wystarcza.', author: 'Melody Beattie' },
  { text: 'Szczęście nie polega na posiadaniu, lecz na docenianiu.', author: 'Michael Leunig' },
  { text: 'Najpiękniejsze chwile nie przychodzą głośno.', author: 'Antoine de Saint-Exupéry' },
  { text: 'Każdy dzień jest nową szansą, by zacząć od nowa.', author: 'Anne Frank' },
  { text: 'Czas, który spędzasz na uśmiechu, nigdy nie jest stracony.', author: 'Nelson Mandela' },
  { text: 'Nie każdy dzień jest dobry, ale coś dobrego jest w każdym dniu.', author: 'Nell Newman' },
  { text: 'Szczęście zależy od tego, co w sobie pielęgnujemy.', author: 'Arystoteles' },
  { text: 'Bądź tu i teraz. Wszystko inne to wspomnienia lub marzenia.', author: 'Matshona Dhliwayo' },
  { text: 'Doceniaj każdy moment, bo one już nie wrócą.', author: 'Nieznany' },
  { text: 'Szczęście to nie coś gotowego. To coś, co tworzysz.', author: 'Dalajlama XIV' },
  { text: 'Nie czekaj na idealny moment. Weź ten, który masz.', author: 'Napoleon Hill' },
  { text: 'Życie nie polega na czekaniu, aż burza minie. Polega na nauce tańca w deszczu.', author: 'Vivian Greene' },
  { text: 'Wszystko, co dobre, zaczyna się od wdzięczności.', author: 'Nieznany' },
  { text: 'Nie liczy się długość życia, ale głębokość.', author: 'Ralph Waldo Emerson' },
  { text: 'Życie to 10% tego, co się dzieje, i 90% tego, jak to odbierasz.', author: 'Charles Swindoll' },
];

// ═══════════════════════════════════════════
// HELPERY DAT
// ═══════════════════════════════════════════

const MONTHS_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

const MONTHS_NOMINATIVE = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];

const DAYS_FULL = [
  'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota',
];

export const formatDateFull = (date = new Date()) => {
  const day = DAYS_FULL[date.getDay()];
  const dayNum = date.getDate();
  const month = MONTHS_PL[date.getMonth()];
  const year = date.getFullYear();
  return `${day}, ${dayNum} ${month} ${year}`;
};

export const formatDateShort = (date = new Date()) => {
  const day = date.getDate();
  const month = MONTHS_PL[date.getMonth()];
  return `${day} ${month}`;
};

export const formatDateUpper = (date = new Date()) => {
  const day = date.getDate();
  const month = MONTHS_NOMINATIVE[date.getMonth()].toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatDateKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayKey = () => formatDateKey(new Date());

export const getDayOfYear = (date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
};

// ═══════════════════════════════════════════
// ROTACJA — pytanie dnia i cytat dnia
// ═══════════════════════════════════════════

export const getTodayPrompt = () => {
  const dayOfYear = getDayOfYear();
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};

export const getTodayQuote = () => {
  const dayOfYear = getDayOfYear();
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

// ═══════════════════════════════════════════
// WIBRACJE
// ═══════════════════════════════════════════

export const vibrate = (pattern = 20) => {
  try {
    if (Platform.OS !== 'web') Vibration.vibrate(pattern);
  } catch (_error) {
    // wibracje niedostępne
  }
};

// ═══════════════════════════════════════════
// STORAGE — MOMENTY
// ═══════════════════════════════════════════

export const loadMoments = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('loadMoments', e);
    return [];
  }
};

export const saveMoments = async (moments) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.moments, JSON.stringify(moments));
    return true;
  } catch (e) {
    console.error('saveMoments', e);
    return false;
  }
};

export const addMoment = async (text) => {
  const now = new Date();
  const moment = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.getTime(),
    dateKey: formatDateKey(now),
    text: text.trim(),
  };

  const existing = await loadMoments();
  const todayKey = getTodayKey();
  const alreadyToday = existing.some(m => m.dateKey === todayKey);

  if (alreadyToday) {
    return { success: false, reason: 'already_today' };
  }

  const updated = [moment, ...existing];
  await saveMoments(updated);
  return { success: true, moment };
};

export const getTodayMoment = async () => {
  const moments = await loadMoments();
  const todayKey = getTodayKey();
  return moments.find(m => m.dateKey === todayKey) || null;
};

export const deleteMoment = async (id) => {
  const moments = await loadMoments();
  const updated = moments.filter(m => m.id !== id);
  await saveMoments(updated);
  return updated;
};

export const updateMoment = async (id, newText) => {
  const moments = await loadMoments();
  const updated = moments.map(m =>
    m.id === id ? { ...m, text: newText.trim(), editedAt: Date.now() } : m
  );
  await saveMoments(updated);
  return updated.find(m => m.id === id);
};

// ═══════════════════════════════════════════
// STORAGE — USTAWIENIA
// ═══════════════════════════════════════════

export const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  notificationsEnabled: true,
  notificationHour: 20,
  notificationMinute: 0,
};

export const loadSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('loadSettings', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('saveSettings', e);
    return false;
  }
};

// ═══════════════════════════════════════════
// STORAGE — ONBOARDING
// ═══════════════════════════════════════════

export const isOnboardingDone = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.onboarding);
    return val === 'true';
  } catch (e) {
    return false;
  }
};

export const markOnboardingDone = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'true');
    return true;
  } catch (e) {
    return false;
  }
};

// ═══════════════════════════════════════════
// STATYSTYKI — PASSA (w tle)
// ═══════════════════════════════════════════

export const calculateStreak = (moments) => {
  if (!moments || moments.length === 0) return 0;

  const dateKeys = [...new Set(moments.map(m => m.dateKey))].sort().reverse();
  if (dateKeys.length === 0) return 0;

  const today = getTodayKey();
  const yesterday = formatDateKey(new Date(Date.now() - 86400000));

  if (dateKeys[0] !== today && dateKeys[0] !== yesterday) return 0;

  let streak = 1;
  let curr = new Date(dateKeys[0] === today ? Date.now() : Date.now() - 86400000);

  for (let i = 1; i < dateKeys.length; i++) {
    curr.setDate(curr.getDate() - 1);
    const expected = formatDateKey(curr);
    if (dateKeys[i] === expected) streak++;
    else break;
  }

  return streak;
};

export const getTotalDaysWithMoments = (moments) => {
  if (!moments) return 0;
  return new Set(moments.map(m => m.dateKey)).size;
};

// ═══════════════════════════════════════════
// EKSPORT
// ═══════════════════════════════════════════

export const exportMomentsAsText = (moments) => {
  if (!moments || moments.length === 0) return '';
  return moments
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(m => {
      const date = new Date(m.timestamp).toLocaleDateString('pl-PL', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      return `📅 ${date}\n\n${m.text}`;
    })
    .join('\n\n───────────\n\n');
};

export const exportMomentsAsJSON = (moments) => {
  return JSON.stringify(moments, null, 2);
};

// ═══════════════════════════════════════════
// SPRAWDZACZ AKTUALIZACJI (GitHub API)
// ═══════════════════════════════════════════

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const shouldCheckUpdates = async () => {
  try {
    const last = await AsyncStorage.getItem(STORAGE_KEYS.lastUpdateCheck);
    if (!last) return true;
    const lastTime = parseInt(last, 10);
    return Date.now() - lastTime > ONE_DAY_MS;
  } catch (e) {
    return false;
  }
};

const markUpdateChecked = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.lastUpdateCheck, String(Date.now()));
  } catch (e) {
    // ignorujemy
  }
};

export const checkForUpdates = async () => {
  try {
    const should = await shouldCheckUpdates();
    if (!should) {
      return { hasUpdate: false, reason: 'recently_checked' };
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );

    if (!response.ok) {
      await markUpdateChecked();
      return { hasUpdate: false, reason: 'api_error' };
    }

    const data = await response.json();
    await markUpdateChecked();

    if (!data || !data.tag_name) {
      return { hasUpdate: false, reason: 'no_data' };
    }

    const latestVersion = data.tag_name.replace(/^v/, '');
    if (latestVersion === VERSION) {
      return { hasUpdate: false };
    }

    // Porównanie wersji (proste — string compare po kropkach)
    const latestParts = latestVersion.split('.').map(Number);
    const currentParts = VERSION.split('.').map(Number);
    let isNewer = false;
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) { isNewer = true; break; }
      if (l < c) break;
    }

    if (isNewer) {
      return {
        hasUpdate: true,
        latestVersion,
        url: data.html_url,
        releaseName: data.name || `Wersja ${latestVersion}`,
      };
    }

    return { hasUpdate: false };
  } catch (e) {
    console.error('checkForUpdates', e);
    return { hasUpdate: false, reason: 'network_error' };
  }
};

// ═══════════════════════════════════════════
// WALIDACJA
// ═══════════════════════════════════════════

export const isMomentTextValid = (text) => {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > MAX_TEXT_LENGTH) return false;
  return true;
};