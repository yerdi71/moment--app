import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  TextInput, Platform, StatusBar, KeyboardAvoidingView,
  SectionList, Alert, Modal, ScrollView, Image, Share, useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  VERSION, INITIAL_VISIBLE, LOAD_STEP, STORAGE_KEYS,
  EMOTIONS, SAMPLE_IMAGES, UI_THEMES, LIGHT_THEMES, CARD_BACKGROUNDS,
  ACHIEVEMENTS_LIST, DAILY_PROMPTS, DAILY_AFFIRMATIONS, DAILY_QUOTES,
} from './src/constants';

import {
  formatDateToKey, vibrate, getDayOfYear, buildMoment, calculateStreak,
  buildSections, paginateSections, computeWeeklyReport, computeLast7Days,
  computeTopWords, computeStats, computeMoodRecommendation, computeNostalgiaBuckets,
} from './src/utils';

import { styles } from './src/styles';
import { Toast, MomentCard, WeekChart, PixelYear } from './src/components';

export default function App() {
  const systemScheme = useColorScheme();
  const [moments, setMoments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMomentId, setEditingMomentId] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);

  const [savedPin, setSavedPin] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [pinLockTimer, setPinLockTimer] = useState(0);

  const [currentTab, setCurrentTab] = useState('home');
  const [currentViewMode, setCurrentViewMode] = useState('list');
  const [returnTab, setReturnTab] = useState(null);

  const [momentText, setMomentText] = useState('');
  const [momentImage, setMomentImage] = useState(null);
  const [momentMood, setMomentMood] = useState('😊');
  const [momentAudio, setMomentAudio] = useState(null);
  const [momentLocation, setMomentLocation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isThemePickerVisible, setIsThemePickerVisible] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState('system');
  const [notifHour, setNotifHour] = useState('20');
  const [notifMinute, setNotifMinute] = useState('00');

  const [selectedCalendarMoment, setSelectedCalendarMoment] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);

  const [cardMoment, setCardMoment] = useState(null);
  const [selectedCardBg, setSelectedCardBg] = useState(CARD_BACKGROUNDS[0]);

  const [isWeeklyReportVisible, setIsWeeklyReportVisible] = useState(false);
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);
  const [isPixelYearVisible, setIsPixelYearVisible] = useState(false);
  const [isNostalgiaVisible, setIsNostalgiaVisible] = useState(false);
  const [isCapsuleModalVisible, setIsCapsuleModalVisible] = useState(false);
  const [isZenVisible, setIsZenVisible] = useState(false);
  const [isAchievementsVisible, setIsAchievementsVisible] = useState(false);
  const [isTestPanelVisible, setIsTestPanelVisible] = useState(false);
  const [zenMoment, setZenMoment] = useState(null);
  const [actionMoment, setActionMoment] = useState(null);
  const [randomMoment, setRandomMoment] = useState(null);

  const [capsules, setCapsules] = useState([]);
  const [capsuleText, setCapsuleText] = useState('');
  const [capsuleDays, setCapsuleDays] = useState('30');
  const [unlockedCapsule, setUnlockedCapsule] = useState(null);

  const [showAffirmation, setShowAffirmation] = useState(false);
  const [todayAffirmation, setTodayAffirmation] = useState('');

  const [pendingUndo, setPendingUndo] = useState(null);
  const undoTimeout = useRef(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastAction, setToastAction] = useState(null);
  const toastTimer = useRef(null);

  const hasShownBetaAlert = useRef(false);

  const todayCode = useMemo(() => formatDateToKey(new Date()), []);
  const todayPrompt = useMemo(() => DAILY_PROMPTS[getDayOfYear() % DAILY_PROMPTS.length], []);
  const todayQuote = useMemo(() => DAILY_QUOTES[getDayOfYear() % DAILY_QUOTES.length], []);

  const todaysMoment = useMemo(() => {
    return moments.find(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === todayCode) || null;
  }, [moments, todayCode]);
  const hasMomentToday = !!todaysMoment;

  const theme = useMemo(() => {
    if (currentThemeId === 'system') {
      return systemScheme === 'light' ? UI_THEMES['soft-minimal'] : UI_THEMES['minimal-dark'];
    }
    return UI_THEMES[currentThemeId] || UI_THEMES['minimal-dark'];
  }, [currentThemeId, systemScheme]);

  const themeList = useMemo(() => Object.values(UI_THEMES), []);

  const showToast = useCallback((msg, actionLabel, onAction) => {
    setToastMessage(msg);
    setToastAction(actionLabel ? { label: actionLabel, fn: onAction } : null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, actionLabel ? 5000 : 2200);
  }, []);

  const currentStreak = useMemo(() => calculateStreak(moments), [moments]);

  const loadAppData = useCallback(async () => {
    try {
      const [storedMoments, onboardingStatus, storedSettings, storedPin, storedCapsules] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.moments),
        AsyncStorage.getItem(STORAGE_KEYS.onboarding),
        AsyncStorage.getItem(STORAGE_KEYS.settings),
        AsyncStorage.getItem(STORAGE_KEYS.appPin),
        AsyncStorage.getItem(STORAGE_KEYS.capsules),
      ]);
      if (storedMoments) setMoments(JSON.parse(storedMoments));
      if (storedCapsules) setCapsules(JSON.parse(storedCapsules));
      setHasCompletedOnboarding(onboardingStatus === 'true');
      if (storedPin) { setSavedPin(storedPin); setIsLocked(true); }
      if (storedSettings) {
        const s = JSON.parse(storedSettings);
        if (s.themeId && UI_THEMES[s.themeId]) setCurrentThemeId(s.themeId);
        if (s.notifHour) setNotifHour(s.notifHour);
        if (s.notifMinute) setNotifMinute(s.notifMinute);
      }
      const lastSeen = await AsyncStorage.getItem(STORAGE_KEYS.affirmationSeen);
      if (lastSeen !== todayCode) {
        const idx = getDayOfYear() % DAILY_AFFIRMATIONS.length;
        setTodayAffirmation(DAILY_AFFIRMATIONS[idx]);
        setShowAffirmation(true);
      }
      if (!hasShownBetaAlert.current) {
        hasShownBetaAlert.current = true;
        Alert.alert(`Wersja ${VERSION} ✨`, 'Kod podzielony na pliki. Aplikacja działa tak samo.', [{ text: 'OK' }]);
      }
    } catch (e) { console.error(e); }
  }, [todayCode]);

  useEffect(() => {
    StatusBar.setHidden(false);
    StatusBar.setBarStyle(LIGHT_THEMES.includes(theme.id) ? 'dark-content' : 'light-content');
    loadAppData();
  }, [loadAppData, theme.id]);

  useEffect(() => {
    let interval = null;
    if (isRecording) interval = setInterval(() => setRecordingSeconds(p => p + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (pinLockedUntil <= Date.now()) { setPinLockTimer(0); return; }
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil((pinLockedUntil - Date.now()) / 1000));
      setPinLockTimer(left);
      if (left === 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [pinLockedUntil]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [searchQuery, selectedMoodFilter, selectedTagFilter, selectedLocationFilter, onlyFavorites]);

  const rotateBackup = useCallback(async (newMoments) => {
    try {
      const key = STORAGE_KEYS.backupPrefix + Date.now();
      await AsyncStorage.setItem(key, JSON.stringify(newMoments.slice(0, 200)));
      const allKeys = await AsyncStorage.getAllKeys();
      const backupKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.backupPrefix)).sort();
      if (backupKeys.length > 5) {
        const toRemove = backupKeys.slice(0, backupKeys.length - 5);
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (e) { console.error('backup', e); }
  }, []);

  const persistMoments = useCallback(async (updated) => {
    setMoments(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.moments, JSON.stringify(updated));
    const newStreak = calculateStreak(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.lastStreak, newStreak.toString());
    rotateBackup(updated);
  }, [rotateBackup]);

  const saveSettings = useCallback(async (newThemeId, newHour, newMinute) => {
    const settings = {
      themeId: newThemeId || currentThemeId,
      notifHour: newHour || notifHour,
      notifMinute: newMinute || notifMinute,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [currentThemeId, notifHour, notifMinute]);

  const changeTheme = useCallback((themeId) => {
    setCurrentThemeId(themeId);
    saveSettings(themeId, notifHour, notifMinute);
    setIsThemePickerVisible(false);
    vibrate(15);
  }, [notifHour, notifMinute, saveSettings]);

  const handleSaveNotifTime = async () => {
    const h = parseInt(notifHour, 10);
    const m = parseInt(notifMinute, 10);
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Błąd', 'Wprowadź poprawną godzinę i minuty.');
      return;
    }
    await saveSettings(currentThemeId, notifHour, notifMinute);
    vibrate(30);
    showToast('Godzina zapisana ✓');
  };

  const exportDataJSON = async () => {
    if (moments.length === 0) return Alert.alert('Brak danych', 'Brak wpisów do eksportu.');
    await Share.share({ message: JSON.stringify(moments, null, 2) });
  };

  const exportDataText = async () => {
    if (moments.length === 0) return Alert.alert('Brak danych', 'Brak wpisów do eksportu.');
    const txt = moments.map(m => {
      const loc = m.location ? ` 📍 ${m.location}` : '';
      const fav = m.isFavorite ? ' ⭐' : '';
      return `📅 ${m.date}  ${m.mood}${fav}${loc}\n${m.text}`;
    }).join('\n\n─────\n\n');
    await Share.share({ message: txt });
  };

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'true');
    setHasCompletedOnboarding(true);
    vibrate(30);
  }, []);

  const resetApp = useCallback(() => {
    Alert.alert('Reset aplikacji', 'Czy chcesz usunąć wszystkie dane?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Resetuj', style: 'destructive', onPress: async () => {
          const allKeys = await AsyncStorage.getAllKeys();
          const backupKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.backupPrefix));
          await AsyncStorage.multiRemove([...Object.values(STORAGE_KEYS), ...backupKeys]);
          setMoments([]); setCapsules([]);
          setHasCompletedOnboarding(false); setSavedPin(null); setIsLocked(false);
          setIsSettingsVisible(false); setCurrentThemeId('system'); setCurrentTab('home');
          vibrate([0, 40, 40, 40]);
        }
      }
    ]);
  }, []);

  const pickImage = () => {
    setMomentImage(SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)]);
    vibrate(15);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setMomentAudio({ duration: recordingSeconds });
      vibrate(20);
    } else {
      setRecordingSeconds(0);
      setIsRecording(true);
      vibrate(10);
    }
  };

  const handleSaveMoment = useCallback(async () => {
    if (!momentText.trim() && !momentImage && !momentAudio) return;

    if (!editingMomentId) {
      const existingToday = moments.find(m =>
        (m.dateKey || formatDateToKey(new Date(m.timestamp))) === todayCode
      );
      if (existingToday) {
        vibrate([0, 60, 60, 60]);
        Alert.alert(
          'Moment już zapisany 📖',
          'Dziś masz już swój Jeden Moment. Możesz go edytować lub usunąć, aby napisać nowy. Wróć jutro po kolejny! 🌅',
          [{ text: 'Rozumiem' }]
        );
        return;
      }
    }

    let updated;
    if (editingMomentId) {
      updated = moments.map(m => m.id === editingMomentId
        ? { ...m, text: momentText.trim(), mood: momentMood, imageUri: momentImage, audioNote: momentAudio, location: momentLocation.trim() }
        : m);
    } else {
      updated = [buildMoment(momentText, momentMood, momentImage, momentAudio, momentLocation), ...moments];
    }
    await persistMoments(updated);
    setIsEditing(false); setEditingMomentId(null);
    setMomentText(''); setMomentImage(null); setMomentAudio(null);
    setMomentMood('😊'); setMomentLocation('');
    vibrate(35);
    showToast(editingMomentId ? 'Wpis zaktualizowany ✓' : 'Twój Jeden Moment na dziś zapisany ✓');
  }, [momentText, momentImage, momentAudio, momentMood, momentLocation, editingMomentId, moments, persistMoments, showToast, todayCode]);

  const startEditingMoment = useCallback((item) => {
    if (currentTab !== 'home' && !isEditing) setReturnTab(currentTab);
    setEditingMomentId(item.id);
    setMomentText(item.text);
    setMomentMood(item.mood || '😊');
    setMomentImage(item.imageUri || null);
    setMomentAudio(item.audioNote || null);
    setMomentLocation(item.location || '');
    setIsEditing(true);
    setSelectedCalendarMoment(null);
    setCurrentTab('home');
    setCurrentViewMode('list');
  }, [currentTab, isEditing]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false); setEditingMomentId(null);
    setMomentImage(null); setMomentAudio(null); setMomentLocation('');
    if (returnTab) { setCurrentTab(returnTab); setReturnTab(null); }
  }, [returnTab]);

  const deleteMoment = useCallback(async (id) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const current = raw ? JSON.parse(raw) : [];
    const removed = current.find(m => m.id === id);
    if (!removed) return;
    const updated = current.filter(m => m.id !== id);
    await persistMoments(updated);
    setPendingUndo(removed);
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    undoTimeout.current = setTimeout(() => setPendingUndo(null), 5000);
    vibrate([0, 20, 40, 20]);
    showToast('Wpis usunięty', 'COFNIJ', async () => {
      try {
        const raw2 = await AsyncStorage.getItem(STORAGE_KEYS.moments);
        const curr = raw2 ? JSON.parse(raw2) : [];
        if (curr.some(m => m.id === removed.id)) return;
        const restored = [removed, ...curr].sort((a, b) => b.timestamp - a.timestamp);
        await persistMoments(restored);
        setPendingUndo(null);
        if (undoTimeout.current) clearTimeout(undoTimeout.current);
        vibrate(30);
        showToast('Przywrócono ✓');
      } catch (e) { console.error('undo', e); }
    });
  }, [persistMoments, showToast]);

  const confirmDeleteItem = useCallback((id) => {
    Alert.alert('Usuń wpis', 'Czy na pewno chcesz usunąć ten wpis?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => { deleteMoment(id); setSelectedCalendarMoment(null); } }
    ]);
  }, [deleteMoment]);

  const toggleFavorite = useCallback(async (id) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const current = raw ? JSON.parse(raw) : [];
    const updated = current.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m);
    await persistMoments(updated);
    vibrate(15);
    const m = updated.find(x => x.id === id);
    showToast(m?.isFavorite ? 'Dodano do ulubionych ⭐' : 'Usunięto z ulubionych');
  }, [persistMoments, showToast]);

  const handleUnlockPin = () => {
    if (pinLockedUntil > Date.now()) { showToast(`Poczekaj ${pinLockTimer}s`); return; }
    if (enteredPin === savedPin) {
      vibrate(30);
      setIsLocked(false); setEnteredPin(''); setPinAttempts(0);
    } else {
      const attempts = pinAttempts + 1;
      setPinAttempts(attempts);
      vibrate([0, 60, 60, 60]);
      setEnteredPin('');
      if (attempts >= 5) {
        const until = Date.now() + 60000;
        setPinLockedUntil(until); setPinAttempts(0);
        Alert.alert('Zablokowano', 'Zbyt wiele prób. Odczekaj 60 sekund.');
      } else {
        Alert.alert('Błąd', `Nieprawidłowy PIN. Pozostało prób: ${5 - attempts}`);
      }
    }
  };

  const handleSetNewPin = async () => {
    if (newPinInput.length < 4) return Alert.alert('Błąd', 'PIN musi mieć co najmniej 4 cyfry.');
    await AsyncStorage.setItem(STORAGE_KEYS.appPin, newPinInput);
    setSavedPin(newPinInput); setNewPinInput(''); setIsPinModalVisible(false);
    vibrate(40); showToast('PIN ustawiony ✓');
  };

  const handleRemovePin = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.appPin);
    setSavedPin(null); setIsPinModalVisible(false);
    showToast('PIN usunięty');
  };

  const createCapsule = async () => {
    if (!capsuleText.trim()) return Alert.alert('Puste', 'Napisz wiadomość do przyszłego siebie.');
    const days = parseInt(capsuleDays, 10);
    if (isNaN(days) || days < 1) return Alert.alert('Błąd', 'Podaj liczbę dni (min. 1).');
    const unlockAt = Date.now() + days * 86400000;
    const capsule = { id: `cap_${Date.now()}`, text: capsuleText.trim(), createdAt: Date.now(), unlockAt };
    const updated = [capsule, ...capsules];
    setCapsules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.capsules, JSON.stringify(updated));
    setCapsuleText(''); setCapsuleDays('30');
    vibrate(30);
    showToast('Kapsuła zapisana 🔒');
  };

  const openCapsule = (c) => {
    if (c.unlockAt > Date.now()) {
      const days = Math.ceil((c.unlockAt - Date.now()) / 86400000);
      showToast(`Otworzy się za ${days} dni 🔒`);
      return;
    }
    setUnlockedCapsule(c);
    vibrate(40);
  };

  const deleteCapsule = async (id) => {
    const updated = capsules.filter(c => c.id !== id);
    setCapsules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.capsules, JSON.stringify(updated));
    setUnlockedCapsule(null);
    showToast('Kapsuła usunięta');
  };

  const openCardGenerator = useCallback((m) => setCardMoment(m), []);
  const openActionMenu = useCallback((m) => { vibrate(15); setActionMoment(m); }, []);

  const openRandomMoment = useCallback(() => {
    if (moments.length === 0) return showToast('Brak wpisów do wspomnień');
    setRandomMoment(moments[Math.floor(Math.random() * moments.length)]);
    vibrate(15);
  }, [moments, showToast]);

  const openZenMoment = useCallback(() => {
    if (moments.length === 0) return showToast('Brak wpisów');
    setZenMoment(moments[Math.floor(Math.random() * moments.length)]);
    setIsZenVisible(true);
    vibrate(20);
  }, [moments, showToast]);

  const shareGeneratedCard = useCallback(async () => {
    if (!cardMoment) return;
    try {
      const txt = `╔═════════ ✨ ═════════╗\n   JEDEN MOMENT\n\n„${cardMoment.text}”\n${cardMoment.mood}\n\n🗓️ ${cardMoment.date}\n╚══════════════════════╝`;
      await Share.share({ message: txt });
    } catch (e) { console.error(e); }
  }, [cardMoment]);

  const shareAnonymousCard = useCallback(async () => {
    if (!cardMoment) return;
    try {
      const txt = `╔════ 🕊️ CICHY ANIOŁ ════╗\n\nKtoś pomyślał o Tobie\nz wdzięcznością:\n\n„${cardMoment.text}”\n${cardMoment.mood}\n\nTo wiadomość od kogoś,\nkto docenia, że jesteś. ✨\n╚════════════════════════╝`;
      await Share.share({ message: txt });
    } catch (e) { console.error(e); }
  }, [cardMoment]);

  const handleSimulateStreakDays = async (target) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    const newMoments = [...existing];
    const base = new Date();
    let existingConsecutive = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(base); d.setDate(d.getDate() - i);
      const key = formatDateToKey(d);
      if (newMoments.some(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === key)) existingConsecutive++;
      else break;
    }
    for (let i = 0; i < target; i++) {
      const offset = existingConsecutive + i + 1;
      const d = new Date(base); d.setDate(d.getDate() - offset);
      const key = formatDateToKey(d);
      const mock = {
        ...buildMoment(`Symulowany wpis passy #symulacja`, EMOTIONS[offset % EMOTIONS.length], null, null, ''),
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: d.getTime(), dateKey: key,
        date: d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      newMoments.push(mock);
    }
    await persistMoments(newMoments);
    vibrate(30);
    showToast(`Dodano ${target} dni passy 🧪`);
  };

  const handleSimulateMockMomentWithPhotoAndAudio = async () => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const key = formatDateToKey(y);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    if (existing.some(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === key)) {
      showToast('Wczoraj już ma wpis 🧪');
      return;
    }
    const m = {
      ...buildMoment('Testowy moment #test wdzięczności 🚀', '⚡', SAMPLE_IMAGES[0], { duration: 5 }, 'Testowe miejsce'),
      timestamp: y.getTime(), dateKey: key,
      date: y.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    await persistMoments([m, ...existing]);
    vibrate(30);
    showToast('Dodano testowy moment (wczoraj) 📷🎙️');
  };

  const availableTags = useMemo(() => {
    const set = new Set();
    moments.forEach(m => {
      const matches = m.text.match(/#[a-zA-Z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+/g);
      if (matches) matches.forEach(t => set.add(t.toLowerCase()));
    });
    return Array.from(set);
  }, [moments]);

  const availableLocations = useMemo(() => {
    const set = new Set();
    moments.forEach(m => { if (m.location) set.add(m.location); });
    return Array.from(set);
  }, [moments]);

  const actionChallenge = useMemo(() => {
    const ago = Date.now() - 7 * 86400000;
    const recent = moments.filter(m => m.timestamp >= ago);
    const counts = {};
    recent.forEach(m => {
      const matches = m.text.match(/#[a-zA-Z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+/g);
      if (matches) matches.forEach(t => {
        const lt = t.toLowerCase();
        counts[lt] = (counts[lt] || 0) + 1;
      });
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top && top[1] >= 2 ? { tag: top[0], count: top[1] } : null;
  }, [moments]);

  const filteredMoments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return moments.filter(m => {
      if (onlyFavorites && !m.isFavorite) return false;
      if (selectedMoodFilter && m.mood !== selectedMoodFilter) return false;
      if (selectedTagFilter && !m.text.toLowerCase().includes(selectedTagFilter.toLowerCase())) return false;
      if (selectedLocationFilter && m.location !== selectedLocationFilter) return false;
      if (q && !m.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [moments, searchQuery, selectedMoodFilter, selectedTagFilter, selectedLocationFilter, onlyFavorites]);

  const allSections = useMemo(() => buildSections(filteredMoments), [filteredMoments]);
  const sections = useMemo(() => paginateSections(allSections, visibleCount), [allSections, visibleCount]);

  const loadMore = useCallback(() => {
    const total = filteredMoments.length;
    if (visibleCount >= total) return;
    setVisibleCount(prev => Math.min(prev + LOAD_STEP, total));
    vibrate(10);
  }, [visibleCount, filteredMoments.length]);

  const scrollToTop = useCallback(() => {
    try {
      listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewOffset: 0 });
    } catch (_error) {
      // scrollToLocation może rzucić, gdy sekcja jest pusta
    }
    vibrate(15);
  }, []);

  const onListScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    const threshold = 3 * 180;
    if (y > threshold && !showScrollTop) setShowScrollTop(true);
    else if (y <= threshold && showScrollTop) setShowScrollTop(false);
  }, [showScrollTop]);

  const weeklyReport = useMemo(() => computeWeeklyReport(moments), [moments]);
  const last7DaysStats = useMemo(() => computeLast7Days(moments), [moments]);
  const topWords = useMemo(() => computeTopWords(moments), [moments]);
  const moodRecommendation = useMemo(() => computeMoodRecommendation(moments, weeklyReport), [moments, weeklyReport]);
  const nostalgiaBuckets = useMemo(() => computeNostalgiaBuckets(moments), [moments]);
  const stats = useMemo(() => computeStats(moments, currentStreak), [moments, currentStreak]);

  const dynamicStyles = useMemo(() => ({
    card: {
      backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth,
      borderRadius: theme.borderRadius, padding: 16, marginBottom: 16,
    },
    button: {
      backgroundColor: theme.accent,
      borderRadius: theme.id === 'neo-brutalism' ? 0 : theme.borderRadius,
      borderWidth: theme.id === 'neo-brutalism' ? 3 : 0, borderColor: '#000',
    },
  }), [theme]);

  const calendarGridElements = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstIdx = new Date(year, month, 1).getDay();
    const adjFirst = firstIdx === 0 ? 6 : firstIdx - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const map = {};
    moments.forEach(m => {
      const k = m.dateKey || formatDateToKey(new Date(m.timestamp));
      if (k) map[k] = m;
    });
    const cells = [];
    for (let i = 0; i < adjFirst; i++) cells.push(<View key={`e-${i}`} style={[styles.calendarDayBox, { opacity: 0 }]} />);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = formatDateToKey(d);
      const mm = map[key];
      const isToday = key === todayCode;
      cells.push(
        <TouchableOpacity key={i}
          style={[styles.calendarDayBox, {
            backgroundColor: isToday ? theme.accent + '22' : (mm ? theme.accent + '11' : theme.card),
            borderColor: isToday ? theme.accent : theme.border,
            borderWidth: isToday ? 2 : (theme.borderWidth || 1),
          }]}
          onPress={() => mm ? setSelectedCalendarMoment(mm) : showToast(`Dzień ${i} – brak wpisu`)}
        >
          <Text style={{ color: isToday ? theme.accent : theme.text, fontWeight: isToday ? '900' : 'bold' }}>{i}</Text>
          {mm ? <Text style={{ fontSize: 12, marginTop: 2 }}>{mm.mood || '😊'}</Text> : <View style={{ height: 14 }} />}
        </TouchableOpacity>
      );
    }
    return cells;
  }, [calendarDate, moments, todayCode, theme, showToast]);

  const renderCalendarView = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginBottom: 16 }}>
          <WeekChart data={last7DaysStats} theme={theme} onPress={() => setIsWeeklyReportVisible(true)} title="Wgląd w tydzień" />
        </View>

        <View style={[dynamicStyles.card, { paddingBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' }}>{monthName}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setCalendarDate(new Date(year, month - 1, 1))} style={[styles.iconButton, { paddingHorizontal: 10 }]}>
                <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCalendarDate(new Date(year, month + 1, 1))} style={[styles.iconButton, { paddingHorizontal: 10 }]}>
                <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            {weekDays.map(d => <Text key={d} style={{ width: '13%', textAlign: 'center', color: theme.subtext, fontSize: 11, fontWeight: 'bold' }}>{d}</Text>)}
          </View>
          <View style={styles.calendarGrid}>{calendarGridElements}</View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.subtext }]}>📊 Wgląd w przeszłość</Text>

        <TouchableOpacity
          style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2 }]}
          onPress={() => setIsPixelYearVisible(true)}
        >
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 }}>📆 Rok w pikselach</Text>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>Zobacz cały rok {new Date().getFullYear()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.card} onPress={() => setIsNostalgiaVisible(true)}>
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 }}>⏪ Nostalgia</Text>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>Co robiłeś tydzień / miesiąc / rok temu?</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderMomentItem = useCallback(({ item }) => (
    <MomentCard item={item} theme={theme} cardStyle={dynamicStyles.card} onMenu={openActionMenu} />
  ), [theme, dynamicStyles.card, openActionMenu]);

  if (isLocked) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.bg }]}>
        <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 10 }}>🔒</Text>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 }}>Podaj kod PIN</Text>
          {pinLockedUntil > Date.now() && (
            <Text style={{ color: 'red', textAlign: 'center', marginBottom: 6, fontWeight: 'bold' }}>Zablokowane — {pinLockTimer}s</Text>
          )}
          <TextInput
            style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
            secureTextEntry keyboardType="number-pad" maxLength={6}
            value={enteredPin} onChangeText={setEnteredPin}
            placeholder="••••" placeholderTextColor={theme.subtext} autoFocus
          />
          <TouchableOpacity
            style={[styles.mainButton, dynamicStyles.button, { marginTop: 16, opacity: pinLockedUntil > Date.now() ? 0.5 : 1 }]}
            onPress={handleUnlockPin}
          >
            <Text style={{ color: theme.id === 'neo-brutalism' ? '#000' : '#FFF', fontWeight: 'bold' }}>Odblokuj</Text>
          </TouchableOpacity>
        </View>
        <Toast message={toastMessage} theme={theme} actionLabel={toastAction?.label} onAction={toastAction?.fn} />
      </SafeAreaView>
    );
  }

  if (hasCompletedOnboarding === false) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.bg }]}>
        <View style={dynamicStyles.card}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>✨</Text>
          <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: 8 }]}>Jeden Moment</Text>
          <Text style={{ color: theme.subtext, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
            Codziennie zapisujesz JEDEN moment wdzięczności. Nie więcej — to jest siła tej praktyki.
          </Text>
          <Text style={{ color: theme.subtext, textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 20, fontStyle: 'italic' }}>
            Wróć jutro po kolejny 🌅
          </Text>
          <TouchableOpacity style={[styles.mainButton, dynamicStyles.button]} onPress={completeOnboarding}>
            <Text style={{ color: theme.id === 'neo-brutalism' ? '#000' : '#FFF', fontWeight: 'bold', fontSize: 16 }}>Rozpocznij przygodę</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalFiltered = filteredMoments.length;
  const hasMore = visibleCount < totalFiltered;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.innerContainer}>

          <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 10 }]}>
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: theme.text }]}>
                Jeden <Text style={{ color: theme.accent }}>Moment</Text>
              </Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.streakPillSmall, { borderColor: theme.border, backgroundColor: theme.card }]}
                  onPress={() => { vibrate(15); setIsStreakModalVisible(true); }}
                >
                  <Text style={{ fontSize: 13 }}>🔥</Text>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold', marginLeft: 3 }}>{currentStreak}</Text>
                </TouchableOpacity>
                {currentTab === 'home' && (
                  <TouchableOpacity
                    style={[styles.iconButton, { marginRight: 8, marginLeft: 8 }]}
                    onPress={() => { vibrate(10); setCurrentViewMode(p => p === 'list' ? 'calendar' : 'list'); }}
                  >
                    <Text style={{ fontSize: 16 }}>{currentViewMode === 'list' ? '📅' : '📋'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.iconButton}>
                  <Text style={{ fontSize: 18, color: theme.text }}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.content}>

            {currentTab === 'home' && (
              currentViewMode === 'calendar' ? renderCalendarView()
              : isEditing ? (
                <View style={dynamicStyles.card}>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                    {editingMomentId ? 'Edytuj wpis' : 'Twój Jeden Moment na dziś'}
                  </Text>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {momentImage && (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: momentImage }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => setMomentImage(null)}>
                          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder="Napisz swój moment... (użyj #tagów)"
                      placeholderTextColor={theme.subtext}
                      multiline maxLength={150}
                      value={momentText} onChangeText={setMomentText}
                      autoFocus={!momentImage}
                    />
                    <Text style={{ color: theme.subtext, fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                      {momentText.length}/150
                    </Text>
                    <TextInput
                      style={[styles.locationInput, { color: theme.text, borderColor: theme.border }]}
                      placeholder="📍 Miejsce (np. Kraków, Dom)"
                      placeholderTextColor={theme.subtext}
                      value={momentLocation} onChangeText={setMomentLocation}
                      maxLength={40}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                      <TouchableOpacity onPress={pickImage} style={[styles.mediaBtn, { borderColor: theme.border }]}>
                        <Text style={{ fontSize: 16 }}>📷 Zdjęcie</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={toggleRecording}
                        style={[styles.mediaBtn, { borderColor: isRecording ? 'red' : theme.border, backgroundColor: isRecording ? '#FEE2E2' : 'transparent' }]}>
                        <Text style={{ fontSize: 16, color: isRecording ? 'red' : theme.text }}>
                          {isRecording ? `🔴 ${recordingSeconds}s (Stop)` : '🎙️ Głos'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {momentAudio && !isRecording && (
                      <View style={[styles.audioPill, { backgroundColor: theme.border, marginTop: 10 }]}>
                        <Text style={{ color: theme.text, fontSize: 12 }}>✓ Nagrano ({momentAudio.duration}s)</Text>
                        <TouchableOpacity onPress={() => setMomentAudio(null)}>
                          <Text style={{ color: 'red', fontWeight: 'bold', marginLeft: 8 }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 }}>
                      <View style={styles.row}>
                        {EMOTIONS.map(e => (
                          <TouchableOpacity key={e} onPress={() => { setMomentMood(e); vibrate(10); }}
                            style={[styles.moodBtn, momentMood === e && { backgroundColor: theme.border }]}>
                            <Text style={{ fontSize: 20 }}>{e}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={{ padding: 10 }} onPress={cancelEditing}>
                      <Text style={{ color: theme.subtext, fontWeight: 'bold' }}>Anuluj</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveButton, dynamicStyles.button]} onPress={handleSaveMoment}>
                      <Text style={{ color: theme.id === 'neo-brutalism' ? '#000' : '#FFF', fontWeight: 'bold' }}>Zapisz</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <SectionList
                    ref={listRef}
                    sections={sections}
                    keyExtractor={item => item.id}
                    renderItem={renderMomentItem}
                    renderSectionHeader={({ section: { title } }) => (
                      <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginTop: 8, marginBottom: 8, letterSpacing: 1 }}>
                        {title}
                      </Text>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    removeClippedSubviews={Platform.OS === 'android'}
                    keyboardShouldPersistTaps="handled"
                    stickySectionHeadersEnabled={false}
                    onScroll={onListScroll}
                    scrollEventThrottle={16}
                    ListHeaderComponent={
                      <View>
                        <View style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accent + '10' }]}>
                          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 }}>📖 Cytat dnia</Text>
                          <Text style={{ color: theme.text, fontSize: 15, fontStyle: 'italic', lineHeight: 23, fontWeight: '500' }}>
                            „{todayQuote.text}"
                          </Text>
                          <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 8, textAlign: 'right', fontWeight: '600' }}>— {todayQuote.author}</Text>
                        </View>

                        {showAffirmation && (
                          <View style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accent + '12' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>🕊️ Cichy Anioł</Text>
                              <TouchableOpacity onPress={async () => { setShowAffirmation(false); await AsyncStorage.setItem(STORAGE_KEYS.affirmationSeen, todayCode); }}>
                                <Text style={{ color: theme.subtext, fontWeight: 'bold' }}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={{ color: theme.text, fontSize: 15, marginTop: 8, fontStyle: 'italic', lineHeight: 22 }}>
                              „{todayAffirmation}"
                            </Text>
                          </View>
                        )}

                        {actionChallenge && (
                          <View style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accent + '15' }]}>
                            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 }}>✨ Wdzięczność w akcji</Text>
                            <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
                              Wspomniałeś o <Text style={{ fontWeight: 'bold' }}>{actionChallenge.tag}</Text> aż {actionChallenge.count} razy w tym tygodniu.
                            </Text>
                          </View>
                        )}

                        <View style={dynamicStyles.card}>
                          {hasMomentToday ? (
                            <>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 20, marginRight: 8 }}>✅</Text>
                                <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold' }}>Dzisiejszy moment zapisany</Text>
                              </View>
                              <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 19, marginBottom: 12, fontStyle: 'italic' }}>
                                Wróć jutro po kolejny Jeden Moment 🌅
                              </Text>
                              <TouchableOpacity
                                style={[styles.mainButton, { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.accent }]}
                                onPress={() => startEditingMoment(todaysMoment)}
                              >
                                <Text style={{ color: theme.accent, fontWeight: 'bold' }}>✏️ Edytuj dzisiejszy moment</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold', marginBottom: 6 }}>Za co jesteś dziś wdzięczny?</Text>
                              <Text style={{ color: theme.subtext, fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}>💡 {todayPrompt}</Text>
                              <TouchableOpacity
                                style={[styles.mainButton, dynamicStyles.button]}
                                onPress={() => {
                                  setEditingMomentId(null); setMomentText('');
                                  setMomentImage(null); setMomentAudio(null); setMomentLocation('');
                                  setIsEditing(true); vibrate(10);
                                }}
                              >
                                <Text style={{ color: theme.id === 'neo-brutalism' ? '#000' : '#FFF', fontWeight: 'bold' }}>Napisz swój moment...</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            {moments.length > 0 && (
                              <TouchableOpacity
                                style={[styles.mainButton, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }]}
                                onPress={openRandomMoment}
                              >
                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 12 }}>🎁 Wspomnienie</Text>
                              </TouchableOpacity>
                            )}
                            {moments.length > 0 && (
                              <TouchableOpacity
                                style={[styles.mainButton, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }]}
                                onPress={openZenMoment}
                              >
                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 12 }}>🧘 Moment Zen</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        <View style={{ marginBottom: 12 }}>
                          <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.card }]}>
                            <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
                            <TextInput
                              style={{ flex: 1, color: theme.text, paddingVertical: 6, fontSize: 14 }}
                              placeholder="Szukaj we wpisach..."
                              placeholderTextColor={theme.subtext}
                              value={searchQuery} onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                              <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Text style={{ color: theme.subtext, fontWeight: 'bold' }}>✕</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                            <TouchableOpacity
                              onPress={() => setOnlyFavorites(p => !p)}
                              style={[styles.filterPill, { backgroundColor: onlyFavorites ? theme.accent : theme.card, borderColor: theme.border }]}
                            >
                              <Text style={{ color: onlyFavorites ? '#FFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>⭐ Ulubione</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => { setSelectedMoodFilter(null); setSelectedTagFilter(null); setSelectedLocationFilter(null); }}
                              style={[styles.filterPill, {
                                backgroundColor: (!selectedMoodFilter && !selectedTagFilter && !selectedLocationFilter) ? theme.accent : theme.card,
                                borderColor: theme.border,
                              }]}
                            >
                              <Text style={{ color: (!selectedMoodFilter && !selectedTagFilter && !selectedLocationFilter) ? '#FFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>Wszystkie</Text>
                            </TouchableOpacity>
                            {EMOTIONS.map(e => (
                              <TouchableOpacity key={e}
                                onPress={() => setSelectedMoodFilter(p => p === e ? null : e)}
                                style={[styles.filterPill, { backgroundColor: selectedMoodFilter === e ? theme.accent : theme.card, borderColor: theme.border }]}
                              >
                                <Text style={{ fontSize: 12 }}>{e}</Text>
                              </TouchableOpacity>
                            ))}
                            {availableTags.map(tag => (
                              <TouchableOpacity key={tag}
                                onPress={() => setSelectedTagFilter(p => p === tag ? null : tag)}
                                style={[styles.filterPill, { backgroundColor: selectedTagFilter === tag ? theme.accent : theme.accent + '22', borderColor: theme.border }]}
                              >
                                <Text style={{ color: selectedTagFilter === tag ? '#FFF' : theme.accent, fontSize: 12, fontWeight: 'bold' }}>{tag}</Text>
                              </TouchableOpacity>
                            ))}
                            {availableLocations.map(loc => (
                              <TouchableOpacity key={loc}
                                onPress={() => setSelectedLocationFilter(p => p === loc ? null : loc)}
                                style={[styles.filterPill, { backgroundColor: selectedLocationFilter === loc ? theme.accent : theme.card, borderColor: theme.border }]}
                              >
                                <Text style={{ color: selectedLocationFilter === loc ? '#FFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>📍 {loc}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                          {totalFiltered === moments.length ? 'Twoje momenty' : `Wyniki (${totalFiltered})`}
                        </Text>
                        <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 8 }}>
                          Pokazano: {Math.min(visibleCount, totalFiltered)} / {totalFiltered}
                        </Text>
                      </View>
                    }
                    ListEmptyComponent={<Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 40 }}>Brak pasujących wpisów.</Text>}
                    ListFooterComponent={
                      totalFiltered === 0 ? null : hasMore ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={loadMore}
                            style={[styles.mainButton, {
                              borderWidth: 2, borderColor: theme.accent,
                              backgroundColor: theme.accent + '15',
                              paddingVertical: 14,
                            }]}
                          >
                            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 14 }}>
                              ⬇️ Pokaż więcej ({visibleCount} / {totalFiltered})
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                          <Text style={{ color: theme.subtext, fontSize: 12, fontStyle: 'italic' }}>
                            ✨ Koniec listy — {totalFiltered} {totalFiltered === 1 ? 'wpis' : 'wpisów'}
                          </Text>
                        </View>
                      )
                    }
                  />

                  {showScrollTop && (
                    <TouchableOpacity
                      style={[styles.scrollTopBtn, {
                        backgroundColor: theme.accent,
                        shadowColor: theme.accent,
                      }]}
                      onPress={scrollToTop}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: -2 }}>↑</Text>
                    </TouchableOpacity>
                  )}
                </>
              )
            )}

            {currentTab === 'stats' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>Twoje statystyki</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <View style={[dynamicStyles.card, { flex: 1, marginBottom: 0, alignItems: 'center', paddingVertical: 18 }]}>
                    <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '900' }}>{stats.totalEntries}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' }}>Dni</Text>
                  </View>
                  <View style={[dynamicStyles.card, { flex: 1, marginBottom: 0, alignItems: 'center', paddingVertical: 18 }]}>
                    <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '900' }}>{currentStreak}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' }}>Passa</Text>
                  </View>
                  <View style={[dynamicStyles.card, { flex: 1, marginBottom: 0, alignItems: 'center', paddingVertical: 18 }]}>
                    <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '900' }}>{stats.unlockedCount}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' }}>Odznak</Text>
                  </View>
                </View>

                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>💫 Twój klimat</Text>
                <View style={dynamicStyles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 36, marginRight: 12 }}>{stats.dominantMood}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>Dominująca emocja</Text>
                      <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>{stats.vibe?.title || 'Zrównoważony'}</Text>
                    </View>
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>{stats.vibe?.desc}</Text>
                  {EMOTIONS.map(e => {
                    const count = stats.emotionCounts[e];
                    const pct = stats.totalEntries > 0 ? (count / stats.totalEntries) * 100 : 0;
                    return (
                      <View key={e} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 14 }}>{e} <Text style={{ color: theme.text, fontWeight: '600' }}>{count}</Text></Text>
                          <Text style={{ color: theme.subtext, fontSize: 11 }}>{pct.toFixed(0)}%</Text>
                        </View>
                        <View style={{ width: '100%', height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: e === stats.dominantMood ? theme.accent : theme.subtext }} />
                        </View>
                      </View>
                    );
                  })}
                </View>

                {topWords.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: theme.subtext }]}>🔤 Wzorce słowne</Text>
                    <View style={dynamicStyles.card}>
                      {topWords.map(([w, c], i) => (
                        <View key={w} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: theme.subtext, fontSize: 12, width: 20, fontWeight: 'bold' }}>#{i + 1}</Text>
                          <Text style={{ color: theme.text, fontSize: 14, flex: 1, fontWeight: '600' }}>{w}</Text>
                          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }}>{c}×</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {moodRecommendation && (
                  <>
                    <Text style={[styles.sectionLabel, { color: theme.subtext }]}>💡 Wskazówka</Text>
                    <View style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2 }]}>
                      <Text style={{ color: theme.text, fontSize: 14, lineHeight: 21 }}>{moodRecommendation}</Text>
                    </View>
                  </>
                )}

                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>🏆 Osiągnięcia</Text>
                <TouchableOpacity
                  style={[dynamicStyles.card, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => setIsAchievementsVisible(true)}
                >
                  <Text style={{ fontSize: 32, marginRight: 14 }}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold' }}>
                      {stats.unlockedCount} / {stats.totalAchievements} odznak
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}>Zobacz pełną listę</Text>
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 20 }}>›</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>⏳ Kapsuła czasu</Text>
                <TouchableOpacity
                  style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2 }]}
                  onPress={() => setIsCapsuleModalVisible(true)}
                >
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>Wiadomości do przyszłego siebie</Text>
                  <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 4 }}>{capsules.length} kapsuł</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[dynamicStyles.card, { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: theme.subtext, marginTop: 8 }]}
                  onPress={() => setIsTestPanelVisible(true)}
                >
                  <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>🧪 Panel testowy</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {currentTab === 'tree' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}>
                <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', marginBottom: 8, alignSelf: 'flex-start' }}>Twój Ogród</Text>
                <Text style={{ color: theme.subtext, fontSize: 14, marginBottom: 30, alignSelf: 'flex-start', lineHeight: 22 }}>
                  Każdy moment wdzięczności podlewa Twój ekosystem.
                </Text>
                <View style={[dynamicStyles.card, { width: '100%', alignItems: 'center', paddingVertical: 40 }]}>
                  <Text style={{ fontSize: 100, marginBottom: 20 }}>{stats.currentTree.icon}</Text>
                  <Text style={{ color: theme.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{stats.currentTree.name}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 }}>{stats.currentTree.desc}</Text>
                </View>
                {stats.nextTree && (
                  <View style={[dynamicStyles.card, { width: '100%' }]}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                      Do kolejnego etapu ({stats.nextTree.icon}): <Text style={{ color: theme.accent }}>{stats.totalEntries} / {stats.nextTree.min}</Text>
                    </Text>
                    <View style={{ width: '100%', height: 10, backgroundColor: theme.border, borderRadius: 5, overflow: 'hidden' }}>
                      <View style={{ width: `${stats.treeProgress * 100}%`, height: '100%', backgroundColor: theme.accent }} />
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

          </View>

          <View style={[
            styles.bottomNavBar,
            { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: Platform.OS === 'android' ? 26 : 12 }
          ]}>
            <TouchableOpacity style={styles.navItem} onPress={() => { vibrate(8); setCurrentTab('home'); }}>
              <Text style={{ fontSize: 20, opacity: currentTab === 'home' ? 1 : 0.4 }}>🏠</Text>
              <Text style={{ color: currentTab === 'home' ? theme.text : theme.subtext, fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { vibrate(8); setCurrentTab('stats'); }}>
              <Text style={{ fontSize: 20, opacity: currentTab === 'stats' ? 1 : 0.4 }}>🏆</Text>
              <Text style={{ color: currentTab === 'stats' ? theme.text : theme.subtext, fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>Statystyki</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { vibrate(8); setCurrentTab('tree'); }}>
              <Text style={{ fontSize: 20, opacity: currentTab === 'tree' ? 1 : 0.4 }}>🌳</Text>
              <Text style={{ color: currentTab === 'tree' ? theme.text : theme.subtext, fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>Ogród</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>

      <Toast message={toastMessage} theme={theme} actionLabel={toastAction?.label} onAction={toastAction?.fn} />

      <Modal visible={!!actionMoment} transparent animationType="fade" onRequestClose={() => setActionMoment(null)}>
        <TouchableOpacity style={styles.modalOverlayCenter} activeOpacity={1} onPress={() => setActionMoment(null)}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}
            onStartShouldSetResponder={() => true}>
            <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '900', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase' }}>
              {actionMoment?.date}
            </Text>
            <Text style={{ color: theme.text, fontSize: 14, textAlign: 'center', marginBottom: 16 }} numberOfLines={3}>
              "{actionMoment?.text}"
            </Text>
            <TouchableOpacity
              style={[styles.actionRowBtn, { borderColor: actionMoment?.isFavorite ? theme.accent : theme.border }]}
              onPress={() => { const id = actionMoment?.id; setActionMoment(null); if (id) toggleFavorite(id); }}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                {actionMoment?.isFavorite ? '★ Usuń z ulubionych' : '⭐ Dodaj do ulubionych'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionRowBtn, { borderColor: theme.border }]}
              onPress={() => { const m = actionMoment; setActionMoment(null); openCardGenerator(m); }}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>🎨 Stwórz kartę</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionRowBtn, { borderColor: theme.border }]}
              onPress={() => { const m = actionMoment; setActionMoment(null); startEditingMoment(m); }}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>✏️ Edytuj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionRowBtn, { borderColor: 'red' }]}
              onPress={() => { const id = actionMoment?.id; setActionMoment(null); if (id) confirmDeleteItem(id); }}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>🗑️ Usuń</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, padding: 8 }} onPress={() => setActionMoment(null)}>
              <Text style={{ color: theme.subtext, fontWeight: 'bold', textAlign: 'center' }}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isAchievementsVisible} transparent animationType="slide" onRequestClose={() => setIsAchievementsVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth, maxHeight: '85%' }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>🏆 Odznaki</Text>
            <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
              {stats.unlockedCount} z {stats.totalAchievements} odblokowanych
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ACHIEVEMENTS_LIST.map(a => {
                const unlocked = a.check(moments, currentStreak);
                return (
                  <View key={a.id} style={[styles.achievementRow, { borderBottomColor: theme.border }]}>
                    <Text style={{ fontSize: 24, marginRight: 12, opacity: unlocked ? 1 : 0.3 }}>{a.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: unlocked ? theme.text : theme.subtext, fontWeight: 'bold', fontSize: 14 }}>{a.title}</Text>
                      <Text style={{ color: theme.subtext, fontSize: 12 }}>{a.desc}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: unlocked ? theme.accent : theme.subtext }}>{unlocked ? '✓' : '•'}</Text>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent, marginTop: 12 }]} onPress={() => setIsAchievementsVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isTestPanelVisible} transparent animationType="fade" onRequestClose={() => setIsTestPanelVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 16 }}>🧪 Panel Testowy</Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.border }]} onPress={() => handleSimulateStreakDays(3)}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ 3 dni passy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.border }]} onPress={() => handleSimulateStreakDays(7)}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ 7 dni passy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.border }]} onPress={handleSimulateMockMomentWithPhotoAndAudio}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ Foto i Głos (wczoraj)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: 12, padding: 8 }} onPress={() => setIsTestPanelVisible(false)}>
              <Text style={{ color: theme.subtext, fontWeight: 'bold', textAlign: 'center' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isZenVisible} animationType="fade" onRequestClose={() => setIsZenVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 30 }}
          activeOpacity={1} onPress={() => setIsZenVisible(false)}
        >
          <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 2 }}>Moment Zen</Text>
          <Text style={{ color: '#FFF', fontSize: 22, lineHeight: 32, textAlign: 'center', fontStyle: 'italic', fontWeight: '300' }}>
            „{zenMoment?.text}"
          </Text>
          <Text style={{ fontSize: 44, marginTop: 30 }}>{zenMoment?.mood}</Text>
          <Text style={{ color: '#8B949E', fontSize: 12, marginTop: 30 }}>Dotknij, aby zamknąć</Text>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isPixelYearVisible} transparent animationType="fade" onRequestClose={() => setIsPixelYearVisible(false)}>
        <PixelYear moments={moments} year={new Date().getFullYear()} theme={theme} onClose={() => setIsPixelYearVisible(false)} />
      </Modal>

      <Modal visible={isNostalgiaVisible} transparent animationType="slide" onRequestClose={() => setIsNostalgiaVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth, maxHeight: '85%' }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>⏪ Nostalgia</Text>
            <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>Co robiłeś w przeszłości?</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Tydzień temu', data: nostalgiaBuckets.week },
                { label: 'Miesiąc temu', data: nostalgiaBuckets.month },
                { label: 'Rok temu', data: nostalgiaBuckets.year },
              ].map(group => (
                <View key={group.label} style={{ marginBottom: 16 }}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 }}>{group.label}</Text>
                  {group.data.length === 0 ? (
                    <Text style={{ color: theme.subtext, fontSize: 13, fontStyle: 'italic' }}>Brak wpisów.</Text>
                  ) : (
                    group.data.map(m => (
                      <View key={m.id} style={{ backgroundColor: theme.bg, padding: 12, borderRadius: 10, marginBottom: 6 }}>
                        <Text style={{ color: theme.text, fontSize: 13 }}>{m.mood} {m.text}</Text>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent, marginTop: 12 }]} onPress={() => setIsNostalgiaVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isCapsuleModalVisible} transparent animationType="slide" onRequestClose={() => setIsCapsuleModalVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth, maxHeight: '85%' }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>⏳ Kapsuła Czasu</Text>
            <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>Wiadomość do przyszłego siebie</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 10 }]}
                placeholder="Co chcesz powiedzieć sobie za jakiś czas?"
                placeholderTextColor={theme.subtext}
                multiline maxLength={300}
                value={capsuleText} onChangeText={setCapsuleText}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: theme.text, fontSize: 13 }}>Otwórz za</Text>
                <TextInput
                  style={{ color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 6, width: 60, marginHorizontal: 8, textAlign: 'center' }}
                  value={capsuleDays} onChangeText={setCapsuleDays} keyboardType="number-pad" maxLength={4}
                />
                <Text style={{ color: theme.text, fontSize: 13 }}>dni</Text>
              </View>
              <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent, marginTop: 12 }]} onPress={createCapsule}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zapisz kapsułę 🔒</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>Twoje kapsuły</Text>
              {capsules.length === 0 && <Text style={{ color: theme.subtext, fontStyle: 'italic' }}>Jeszcze nic tu nie ma.</Text>}
              {capsules.map(c => {
                const locked = c.unlockAt > Date.now();
                const days = Math.ceil((c.unlockAt - Date.now()) / 86400000);
                return (
                  <TouchableOpacity key={c.id} onPress={() => openCapsule(c)}
                    style={{ backgroundColor: theme.bg, padding: 12, borderRadius: 10, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>
                        {locked ? `🔒 Za ${days} dni` : '🔓 Otwórz'}
                      </Text>
                      <TouchableOpacity onPress={() => deleteCapsule(c.id)}>
                        <Text style={{ color: 'red', fontSize: 12 }}>usuń</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                      {locked ? '••••••••' : c.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border, marginTop: 12 }]} onPress={() => setIsCapsuleModalVisible(false)}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!unlockedCapsule} transparent animationType="fade" onRequestClose={() => setUnlockedCapsule(null)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 2 }]}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔓</Text>
            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 }}>Wiadomość z przeszłości</Text>
            <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24, fontStyle: 'italic', textAlign: 'center', marginBottom: 16 }}>
              „{unlockedCapsule?.text}"
            </Text>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent }]} onPress={() => setUnlockedCapsule(null)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Dziękuję</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!randomMoment} transparent animationType="fade" onRequestClose={() => setRandomMoment(null)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🎁</Text>
            <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 }}>
              Wspomnienie z {randomMoment?.date}
            </Text>
            <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24, fontStyle: 'italic', textAlign: 'center', marginBottom: 16 }}>
              „{randomMoment?.text}"
            </Text>
            <Text style={{ fontSize: 30, textAlign: 'center', marginBottom: 16 }}>{randomMoment?.mood}</Text>
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button]} onPress={() => setRandomMoment(null)}>
              <Text style={{ color: theme.id === 'neo-brutalism' ? '#000' : '#FFF', fontWeight: 'bold' }}>Dziękuję</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isStreakModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth, alignItems: 'center' }]}>
            <Text style={{ fontSize: 50, marginBottom: 10 }}>🔥</Text>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>Aktualna Passa</Text>
            <Text style={{ color: theme.accent, fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>{currentStreak} dni</Text>
            <Text style={{ color: theme.subtext, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
              {currentStreak > 0 ? 'Świetna robota!' : 'Rozpocznij passę, dodając pierwszy wpis!'}
            </Text>
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button]} onPress={() => setIsStreakModalVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Rozumiem</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isWeeklyReportVisible} transparent animationType="slide">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 }}>Podsumowanie Tygodnia 📊</Text>
            <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>Ostatnie 7 dni</Text>

            <View style={{ backgroundColor: theme.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 70, justifyContent: 'space-around' }}>
                {last7DaysStats.map(d => {
                  const h = Math.max(4, d.count * 14);
                  return (
                    <View key={d.key} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 20, height: h, borderRadius: 4,
                        backgroundColor: d.isToday ? theme.accent : (d.count > 0 ? theme.accent + 'AA' : theme.border),
                      }} />
                      <Text style={{ color: d.isToday ? theme.accent : theme.subtext, fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>{d.dayLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ backgroundColor: theme.bg, padding: 16, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginBottom: 6 }}>Zapisane: {weeklyReport.count} dni</Text>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginBottom: 6 }}>Główna emocja: {weeklyReport.topMood}</Text>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>📸 {weeklyReport.hasImageCount}  |  🎙️ {weeklyReport.hasAudioCount}</Text>
            </View>
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button]} onPress={() => setIsWeeklyReportVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!cardMoment} transparent animationType="slide">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>Udostępnij Kartę 📸</Text>
            <View style={[styles.socialPostContainer, { backgroundColor: selectedCardBg.bg, borderColor: selectedCardBg.border }]}>
              <View style={styles.socialHeader}>
                <View style={styles.avatarCircle}><Text style={{ fontSize: 12 }}>✨</Text></View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: selectedCardBg.text, fontSize: 12, fontWeight: 'bold' }}>Jeden Moment</Text>
                  <Text style={{ color: selectedCardBg.sub, fontSize: 10 }}>Dziennik Wdzięczności</Text>
                </View>
                <Text style={{ color: selectedCardBg.sub, fontSize: 10, fontWeight: 'bold' }}>{cardMoment?.date}</Text>
              </View>
              <View style={styles.socialBody}>
                <Text style={{ color: selectedCardBg.text, fontSize: 18, lineHeight: 26, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' }}>
                  „{cardMoment?.text}"
                </Text>
                <Text style={{ fontSize: 32, marginTop: 14, textAlign: 'center' }}>{cardMoment?.mood}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }}>
              {CARD_BACKGROUNDS.map(bg => (
                <TouchableOpacity key={bg.id} onPress={() => setSelectedCardBg(bg)}
                  style={[styles.colorChip, { backgroundColor: bg.bg, borderColor: selectedCardBg.id === bg.id ? theme.accent : 'transparent', borderWidth: 2 }]} />
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button, { marginBottom: 10 }]} onPress={shareGeneratedCard}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Udostępnij jako Karta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border, marginBottom: 12 }]} onPress={shareAnonymousCard}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>🕊️ Cichy Anioł (anonimowo)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 6 }} onPress={() => setCardMoment(null)}>
              <Text style={{ color: theme.subtext, textAlign: 'center', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isSettingsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.title, { color: theme.text, fontSize: 20 }]}>Ustawienia</Text>
              <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                <Text style={{ color: theme.subtext, fontSize: 20, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[dynamicStyles.card, { paddingVertical: 12, marginBottom: 12 }]}>
                <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 8 }}>Godzina przypomnienia</Text>
                <View style={styles.row}>
                  <TextInput style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]} value={notifHour} onChangeText={setNotifHour} keyboardType="number-pad" maxLength={2} />
                  <Text style={{ color: theme.text, fontSize: 18, marginHorizontal: 4 }}>:</Text>
                  <TextInput style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]} value={notifMinute} onChangeText={setNotifMinute} keyboardType="number-pad" maxLength={2} />
                  <TouchableOpacity style={[styles.saveTimeBtn, { backgroundColor: theme.accent, marginLeft: 10 }]} onPress={handleSaveNotifTime}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Zapisz</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12 }]} onPress={() => setIsPinModalVisible(true)}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Zabezpieczenie PIN</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>{savedPin ? 'PIN aktywny' : 'Brak blokady'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12 }]} onPress={() => setIsThemePickerVisible(true)}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Motyw UI</Text>
                <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{theme.name} ▾</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 12, marginBottom: 8 }]} onPress={exportDataJSON}>
                <Text style={{ color: theme.accent, textAlign: 'center', fontWeight: 'bold' }}>Eksportuj jako JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 12, marginBottom: 12 }]} onPress={exportDataText}>
                <Text style={{ color: theme.accent, textAlign: 'center', fontWeight: 'bold' }}>📝 Eksportuj jako tekst</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 12, borderColor: 'red', borderWidth: 1 }]} onPress={resetApp}>
                <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>Resetuj Aplikację</Text>
              </TouchableOpacity>
              <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 12, fontSize: 10 }}>WERSJA [{VERSION}]</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isThemePickerVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', marginBottom: 16, textAlign: 'center' }}>Wybierz Motyw</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {themeList.map(t => (
                <TouchableOpacity key={t.id} onPress={() => changeTheme(t.id)} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <Text style={{ color: theme.text, fontWeight: currentThemeId === t.id ? 'bold' : 'normal' }}>
                    {t.name}{currentThemeId === t.id ? '  ✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button, { marginTop: 16 }]} onPress={() => setIsThemePickerVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isPinModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 }}>PIN</Text>
            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
              secureTextEntry keyboardType="number-pad" maxLength={6}
              value={newPinInput} onChangeText={setNewPinInput}
              placeholder="••••" placeholderTextColor={theme.subtext}
            />
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button, { marginTop: 16 }]} onPress={handleSetNewPin}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zapisz PIN</Text>
            </TouchableOpacity>
            {savedPin && (
              <TouchableOpacity style={{ marginTop: 10, padding: 8 }} onPress={handleRemovePin}>
                <Text style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>Usuń PIN</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ marginTop: 10, padding: 8 }} onPress={() => setIsPinModalVisible(false)}>
              <Text style={{ color: theme.subtext, textAlign: 'center', fontWeight: 'bold' }}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedCalendarMoment} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>{selectedCalendarMoment?.date}</Text>
            <Text style={{ color: theme.text, fontSize: 16, marginBottom: 16 }}>"{selectedCalendarMoment?.text}"</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.mainButton, { flex: 1, marginRight: 6, backgroundColor: '#EF4444' }]} onPress={() => confirmDeleteItem(selectedCalendarMoment?.id)}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Usuń</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mainButton, { flex: 1, marginLeft: 6, backgroundColor: theme.accent }]} onPress={() => startEditingMoment(selectedCalendarMoment)}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Edytuj</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: 12, padding: 8 }} onPress={() => setSelectedCalendarMoment(null)}>
              <Text style={{ color: theme.subtext, textAlign: 'center', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}