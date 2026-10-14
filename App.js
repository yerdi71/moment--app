import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  TextInput, Platform, StatusBar, KeyboardAvoidingView,
  SectionList, Alert, Modal, ScrollView, Image, Share, useColorScheme,
  Vibration, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  VERSION, INITIAL_VISIBLE, LOAD_STEP, STORAGE_KEYS,
  EMOTIONS, SAMPLE_IMAGES, UI_THEMES, LIGHT_THEMES, CARD_BACKGROUNDS,
  ACHIEVEMENTS_LIST, GARDEN_ACHIEVEMENTS, DAILY_PROMPTS, DAILY_AFFIRMATIONS, DAILY_QUOTES,
  BETA_MESSAGE, TEST_MODE_WARNING,
} from './src/constants';

import {
  formatDateToKey, vibrate, getDayOfYear, buildMoment, calculateStreak,
  buildSections, paginateSections, computeWeeklyReport, computeLast7Days,
  computeTopWords, computeStats, computeMoodRecommendation, computeNostalgiaBuckets,
  computeGardenGrowth, computeGardenState, isWateredToday, computeWateringStreak,
  getCurrentTreeStage, getNextTreeStage, getDaysSinceLastEntry,
} from './src/utils';

import { styles } from './src/styles';
import { Toast, MomentCard, WeekChart, PixelYear } from './src/components';
import SearchModal from './src/SearchModal';
import Garden from './src/Garden';
import TestPanel from './src/TestPanel';
import ExportModal from './src/ExportModal';
import { CHANGELOG, CURRENT_VERSION } from './src/changelog';

import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  disableDailyReminder,
  isDailyReminderEnabled,
  getSavedReminderTime,
  setupNotificationChannel,
  addNotificationResponseListener,
  getNotificationStatus,
  scheduleCapsuleNotification,
  scheduleStreakNotification,
  cancelAllNotifications,
} from './src/notifications';

// ═══════════════════════════════════════════
// GŁÓWNY KOMPONENT
// ═══════════════════════════════════════════
export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // ─── Stan główny ───
  const [moments, setMoments] = useState([]);
  const [waterings, setWaterings] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMomentId, setEditingMomentId] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);

  // ─── PIN + biometria ───
  const [savedPin, setSavedPin] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [pinLockTimer, setPinLockTimer] = useState(0);

  // ─── Nawigacja ───
  const [currentTab, setCurrentTab] = useState('home');
  const [currentViewMode, setCurrentViewMode] = useState('list');
  const [returnTab, setReturnTab] = useState(null);

  // ─── Edycja momentu ───
  const [momentText, setMomentText] = useState('');
  const [momentImage, setMomentImage] = useState(null);
  const [momentMood, setMomentMood] = useState('😊');
  const [momentAudio, setMomentAudio] = useState(null);
  const [momentLocation, setMomentLocation] = useState('');
  const [momentSource, setMomentSource] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recording, setRecording] = useState(null);
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  // ─── Ustawienia ───
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isThemePickerVisible, setIsThemePickerVisible] = useState(false);
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);
  const [isTestPanelVisible, setIsTestPanelVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState('minimal-dark');
  const [notifHour, setNotifHour] = useState('20');
  const [notifMinute, setNotifMinute] = useState('00');
  const [notifPermission, setNotifPermission] = useState('unknown');
  const [dailyNotifEnabled, setDailyNotifEnabled] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [hideSystemBar, setHideSystemBar] = useState(false);

  // ─── Kalendarz ───
  const [selectedCalendarMoment, setSelectedCalendarMoment] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // ─── Filtry ───
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // ─── Paginacja ───
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);

  // ─── Karty ───
  const [cardMoment, setCardMoment] = useState(null);
  const [selectedCardBg, setSelectedCardBg] = useState(CARD_BACKGROUNDS[0]);

  // ─── Modale ───
  const [isWeeklyReportVisible, setIsWeeklyReportVisible] = useState(false);
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);
  const [isPixelYearVisible, setIsPixelYearVisible] = useState(false);
  const [isNostalgiaVisible, setIsNostalgiaVisible] = useState(false);
  const [isCapsuleModalVisible, setIsCapsuleModalVisible] = useState(false);
  const [isZenVisible, setIsZenVisible] = useState(false);
  const [isAchievementsVisible, setIsAchievementsVisible] = useState(false);
  const [zenMoment, setZenMoment] = useState(null);
  const [actionMoment, setActionMoment] = useState(null);
  const [randomMoment, setRandomMoment] = useState(null);

  // ─── Kapsuły ───
  const [capsules, setCapsules] = useState([]);
  const [capsuleText, setCapsuleText] = useState('');
  const [capsuleDays, setCapsuleDays] = useState('30');
  const [unlockedCapsule, setUnlockedCapsule] = useState(null);

  // ─── Codzienne treści ───
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [todayAffirmation, setTodayAffirmation] = useState('');

  // ─── Toast / Undo ───
  const [pendingUndo, setPendingUndo] = useState(null);
  const undoTimeout = useRef(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastAction, setToastAction] = useState(null);
  const toastTimer = useRef(null);

  const hasShownBetaAlert = useRef(false);

  // ─── Derywacje ───
  const todayCode = useMemo(() => formatDateToKey(new Date()), []);
  const todayPrompt = useMemo(() => DAILY_PROMPTS[getDayOfYear() % DAILY_PROMPTS.length], []);
  const todayQuote = useMemo(() => DAILY_QUOTES[getDayOfYear() % DAILY_QUOTES.length], []);

  const todaysMoment = useMemo(() => {
    return moments.find(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === todayCode) || null;
  }, [moments, todayCode]);
  const hasMomentToday = !!todaysMoment;

  const theme = useMemo(() => {
    return UI_THEMES[currentThemeId] || UI_THEMES['minimal-dark'];
  }, [currentThemeId]);

  const themeList = useMemo(() => Object.values(UI_THEMES), []);
  const currentStreak = useMemo(() => calculateStreak(moments), [moments]);

  const gardenGrowth = useMemo(() => computeGardenGrowth(moments), [moments]);
  const gardenState = useMemo(() => computeGardenState(moments), [moments]);
  const wateringStreak = useMemo(() => computeWateringStreak(waterings), [waterings]);
  const wateredToday = useMemo(() => isWateredToday(waterings), [waterings]);

  // ─── Toast ───
  const showToast = useCallback((msg, actionLabel, onAction) => {
    setToastMessage(msg);
    setToastAction(actionLabel ? { label: actionLabel, fn: onAction } : null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, actionLabel ? 5000 : 2200);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedMoodFilter) count++;
    if (selectedTagFilter) count++;
    if (selectedLocationFilter) count++;
    if (onlyFavorites) count++;
    return count;
  }, [searchQuery, selectedMoodFilter, selectedTagFilter, selectedLocationFilter, onlyFavorites]);

  // ⭐ Motyw: przełączanie (naprawione — bez wyrzucania do PIN)
  const toggleTheme = useCallback(() => {
    const nextId = currentThemeId === 'soft-minimal' ? 'minimal-dark' : 'soft-minimal';
    setCurrentThemeId(nextId);
    vibrate(15);
    showToast(`Motyw: ${UI_THEMES[nextId].name}`);
    AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
      themeId: nextId, notifHour, notifMinute,
    })).catch(e => console.error('save theme', e));
    // NIE zmieniamy stanu `isLocked`
  }, [currentThemeId, notifHour, notifMinute, showToast]);

  // ─── Biometria ───
  const tryBiometricUnlock = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return false;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Odblokuj Jeden Moment',
        fallbackLabel: 'Użyj PIN',
        cancelLabel: 'Anuluj',
        disableDeviceFallback: false,
      });
      if (result.success) {
        vibrate(30);
        setIsLocked(false);
        setEnteredPin('');
        return true;
      }
      return false;
    } catch (e) {
      console.error('biometric', e);
      return false;
    }
  }, []);

  // ─── Ukryj pasek systemowy ───
  useEffect(() => {
    if (hideSystemBar) {
      StatusBar.setHidden(true, 'fade');
    } else {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle(theme.isLight ? 'dark-content' : 'light-content');
    }
  }, [hideSystemBar, theme.isLight]);

  // ─── Ładowanie danych ───
  const loadAppData = useCallback(async () => {
    try {
      const [
        storedMoments, onboardingStatus, storedSettings, storedPin, storedCapsules,
        storedBiometric, storedWaterings, storedTestMode, storedBetaSeen, storedHideBar,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.moments),
        AsyncStorage.getItem(STORAGE_KEYS.onboarding),
        AsyncStorage.getItem(STORAGE_KEYS.settings),
        AsyncStorage.getItem(STORAGE_KEYS.appPin),
        AsyncStorage.getItem(STORAGE_KEYS.capsules),
        AsyncStorage.getItem(STORAGE_KEYS.biometricEnabled),
        AsyncStorage.getItem(STORAGE_KEYS.waterings),
        AsyncStorage.getItem(STORAGE_KEYS.testModeEnabled),
        AsyncStorage.getItem(STORAGE_KEYS.betaMessageSeen),
        AsyncStorage.getItem(STORAGE_KEYS.hideSystemBar),
      ]);

      if (storedMoments) setMoments(JSON.parse(storedMoments));
      if (storedCapsules) setCapsules(JSON.parse(storedCapsules));
      if (storedWaterings) setWaterings(JSON.parse(storedWaterings));
      setHasCompletedOnboarding(onboardingStatus === 'true');
      setTestModeEnabled(storedTestMode === 'true');
      setHideSystemBar(storedHideBar === 'true');

      if (storedPin) {
        setSavedPin(storedPin);
        setIsLocked(true);
      }

      const bioEnabled = storedBiometric === 'true';
      setBiometricEnabled(bioEnabled);

      if (storedSettings) {
        const s = JSON.parse(storedSettings);
        if (s.themeId && UI_THEMES[s.themeId]) setCurrentThemeId(s.themeId);
        else setCurrentThemeId(systemScheme === 'light' ? 'soft-minimal' : 'minimal-dark');
        if (s.notifHour) setNotifHour(s.notifHour);
        if (s.notifMinute) setNotifMinute(s.notifMinute);
      } else {
        setCurrentThemeId(systemScheme === 'light' ? 'soft-minimal' : 'minimal-dark');
      }

      const notifStatus = await getNotificationStatus();
      setNotifPermission(notifStatus.permission);
      setDailyNotifEnabled(notifStatus.dailyEnabled);
      if (notifStatus.hour !== undefined) setNotifHour(String(notifStatus.hour));
      if (notifStatus.minute !== undefined) setNotifMinute(String(notifStatus.minute).padStart(2, '0'));

      await setupNotificationChannel();

      // Codzienna afirmacja
      const lastSeen = await AsyncStorage.getItem(STORAGE_KEYS.affirmationSeen);
      if (lastSeen !== todayCode) {
        const idx = getDayOfYear() % DAILY_AFFIRMATIONS.length;
        setTodayAffirmation(DAILY_AFFIRMATIONS[idx]);
        setShowAffirmation(true);
      }

      // Auto-biometria
      if (storedPin && bioEnabled) {
        setTimeout(() => { tryBiometricUnlock(); }, 500);
      }

      // ⭐ Komunikat Beta — przy KAŻDYM wejściu
      if (!hasShownBetaAlert.current && onboardingStatus === 'true') {
        hasShownBetaAlert.current = true;
        setTimeout(() => {
          Alert.alert(
            BETA_MESSAGE.title,
            BETA_MESSAGE.body,
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Zgłoś problem',
                onPress: () => {
                  Alert.alert(
                    'Zgłoś problem',
                    'Napisz do mnie na GitHub:\ngithub.com/yerdi71/moment--app/issues\n\nZ podaniem wersji: ' + VERSION,
                    [{ text: 'OK' }]
                  );
                },
              },
            ]
          );
        }, 1000);
      }
    } catch (e) { console.error(e); }
  }, [todayCode, systemScheme, tryBiometricUnlock]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // ─── Notification listener ───
  useEffect(() => {
    const sub = addNotificationResponseListener((data) => {
      console.log('Notification clicked:', data);
    });
    return () => { if (sub && sub.remove) sub.remove(); };
  }, []);

  // ─── Timer nagrywania ───
  useEffect(() => {
    let interval = null;
    if (isRecording) interval = setInterval(() => setRecordingSeconds(p => p + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isRecording]);

  // ─── PIN lock timer ───
  useEffect(() => {
    if (pinLockedUntil <= Date.now()) { setPinLockTimer(0); return; }
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil((pinLockedUntil - Date.now()) / 1000));
      setPinLockTimer(left);
      if (left === 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [pinLockedUntil]);

  // ─── Reset paginacji ───
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [searchQuery, selectedMoodFilter, selectedTagFilter, selectedLocationFilter, onlyFavorites]);

  // ─── Backup ───
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

  const persistWaterings = useCallback(async (updated) => {
    setWaterings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.waterings, JSON.stringify(updated));
  }, []);

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

  // ─── Powiadomienia: zapis godziny ───
  const handleSaveNotifTime = async () => {
    const h = parseInt(notifHour, 10);
    const m = parseInt(notifMinute, 10);
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Błąd', 'Wprowadź poprawną godzinę i minuty.');
      return;
    }
    await saveSettings(currentThemeId, notifHour, notifMinute);

    if (dailyNotifEnabled) {
      const result = await scheduleDailyReminder(h, m);
      if (result.success) showToast(`Przypomnienie: ${notifHour}:${notifMinute} ✓`);
      else showToast('Nie udało się ustawić przypomnienia');
    } else {
      showToast('Godzina zapisana ✓');
    }
    vibrate(30);
  };

  const toggleDailyNotifications = async () => {
    if (!dailyNotifEnabled) {
      const granted = await requestNotificationPermissions();
      setNotifPermission(granted ? 'granted' : 'denied');
      if (!granted) {
        Alert.alert('Brak uprawnień', 'Włącz powiadomienia w ustawieniach systemowych.');
        return;
      }
      const h = parseInt(notifHour, 10);
      const m = parseInt(notifMinute, 10);
      const result = await scheduleDailyReminder(h, m);
      if (result.success) {
        setDailyNotifEnabled(true);
        vibrate(30);
        showToast('Powiadomienia włączone 🔔');
      }
    } else {
      await disableDailyReminder();
      setDailyNotifEnabled(false);
      vibrate(20);
      showToast('Powiadomienia wyłączone');
    }
  };

  // ─── Ukrywanie paska systemowego ───
  const toggleHideSystemBar = async () => {
    const newVal = !hideSystemBar;
    setHideSystemBar(newVal);
    await AsyncStorage.setItem(STORAGE_KEYS.hideSystemBar, newVal ? 'true' : 'false');
    vibrate(20);
    showToast(newVal ? 'Pasek systemowy ukryty' : 'Pasek systemowy widoczny');
  };

  // ─── Test mode ───
  const toggleTestMode = () => {
    if (!testModeEnabled) {
      Alert.alert(
        TEST_MODE_WARNING.title,
        TEST_MODE_WARNING.body,
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Włącz',
            onPress: async () => {
              setTestModeEnabled(true);
              await AsyncStorage.setItem(STORAGE_KEYS.testModeEnabled, 'true');
              vibrate(30);
              showToast('Tryb testowy włączony 🧪');
            },
          },
        ]
      );
    } else {
      setTestModeEnabled(false);
      AsyncStorage.setItem(STORAGE_KEYS.testModeEnabled, 'false');
      vibrate(20);
      showToast('Tryb testowy wyłączony');
    }
  };

  // ─── Export ───
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
          setMoments([]); setCapsules([]); setWaterings([]);
          setHasCompletedOnboarding(false); setSavedPin(null); setIsLocked(false);
          setBiometricEnabled(false); setDailyNotifEnabled(false);
          setIsSettingsVisible(false);
          setCurrentThemeId(systemScheme === 'light' ? 'soft-minimal' : 'minimal-dark');
          setCurrentTab('home');
          vibrate([0, 40, 40, 40]);
        }
      }
    ]);
  }, [systemScheme]);

  // ─── Zdjęcia ───
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak dostępu', 'Potrzebujemy dostępu do galerii.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setMomentImage(result.assets[0].uri);
        setMomentSource('gallery');
        vibrate(15);
        showToast('Zdjęcie dodane 📸');
      }
    } catch (e) {
      console.error('gallery', e);
      Alert.alert('Błąd', 'Nie udało się otworzyć galerii.');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak dostępu', 'Potrzebujemy dostępu do aparatu.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setMomentImage(result.assets[0].uri);
        setMomentSource('camera');
        vibrate(15);
        showToast('Zdjęcie zrobione 📷');
      }
    } catch (e) {
      console.error('camera', e);
      Alert.alert('Błąd', 'Nie udało się otworzyć aparatu.');
    }
  };

  const pickRandomImage = () => {
    setMomentImage(SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)]);
    setMomentSource(null);
    vibrate(15);
  };

  // ─── GPS ───
  const useCurrentLocation = async () => {
    setIsLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak dostępu', 'Potrzebujemy dostępu do lokalizacji.');
        setIsLoadingGps(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      let place = '';
      if (address) {
        place = [address.city, address.region, address.country]
          .filter(Boolean).slice(0, 2).join(', ')
          || address.name || address.street
          || `${location.coords.latitude.toFixed(3)}, ${location.coords.longitude.toFixed(3)}`;
      } else {
        place = `${location.coords.latitude.toFixed(3)}, ${location.coords.longitude.toFixed(3)}`;
      }
      setMomentLocation(place);
      setMomentSource('gps');
      vibrate(20);
      showToast(`📍 ${place}`);
    } catch (e) {
      console.error('gps', e);
      Alert.alert('Błąd GPS', 'Nie udało się pobrać lokalizacji.');
    } finally {
      setIsLoadingGps(false);
    }
  };

  // ─── Audio ───
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak dostępu', 'Potrzebujemy dostępu do mikrofonu.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordingSeconds(0);
      vibrate(10);
    } catch (e) {
      console.error('startRecording', e);
      Alert.alert('Błąd', 'Nie udało się rozpocząć nagrywania.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      const duration = recordingSeconds;
      setRecording(null);
      if (uri) {
        setMomentAudio({ uri, duration });
        vibrate(20);
        showToast(`Nagrano ${duration}s 🎙️`);
      }
    } catch (e) {
      console.error('stopRecording', e);
      Alert.alert('Błąd', 'Nie udało się zatrzymać nagrywania.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ⭐ Odtwarzanie audio z wpisu
  const playAudioFromMoment = async (moment) => {
    if (!moment?.audioNote?.uri) {
      showToast('Brak nagrania audio');
      return;
    }
    try {
      if (playingAudioId === moment.id) {
        setPlayingAudioId(null);
        return;
      }
      setPlayingAudioId(moment.id);
      vibrate(10);
      const { sound } = await Audio.Sound.createAsync({ uri: moment.audioNote.uri });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          setPlayingAudioId(null);
        }
      });
    } catch (e) {
      console.error('playAudioFromMoment', e);
      setPlayingAudioId(null);
      showToast('Nie udało się odtworzyć nagrania');
    }
  };

  const playAudio = async () => {
    if (!momentAudio?.uri) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: momentAudio.uri });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (e) {
      console.error('playAudio', e);
    }
  };

  // ─── Zapis momentu ───
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
          'Dziś masz już swój Jeden Moment. Możesz go edytować lub usunąć. Wróć jutro! 🌅',
          [{ text: 'Rozumiem' }]
        );
        return;
      }
    }

    let updated;
    if (editingMomentId) {
      updated = moments.map(m => m.id === editingMomentId
        ? { ...m, text: momentText.trim(), mood: momentMood, imageUri: momentImage, audioNote: momentAudio, location: momentLocation.trim(), source: momentSource }
        : m);
    } else {
      const newM = buildMoment(momentText, momentMood, momentImage, momentAudio, momentLocation);
      newM.source = momentSource;
      updated = [newM, ...moments];
    }
    await persistMoments(updated);
    setIsEditing(false); setEditingMomentId(null);
    setMomentText(''); setMomentImage(null); setMomentAudio(null);
    setMomentMood('😊'); setMomentLocation(''); setMomentSource(null);
    vibrate(35);
    showToast(editingMomentId ? 'Wpis zaktualizowany ✓' : 'Twój Jeden Moment zapisany ✓');

    const newStreak = calculateStreak(updated);
    if (newStreak === 7 || newStreak === 30) {
      scheduleStreakNotification(newStreak).catch(e => console.error(e));
    }
  }, [momentText, momentImage, momentAudio, momentMood, momentLocation, momentSource, editingMomentId, moments, persistMoments, showToast, todayCode]);

  const startEditingMoment = useCallback((item) => {
    if (currentTab !== 'home' && !isEditing) setReturnTab(currentTab);
    setEditingMomentId(item.id);
    setMomentText(item.text);
    setMomentMood(item.mood || '😊');
    setMomentImage(item.imageUri || null);
    setMomentAudio(item.audioNote || null);
    setMomentLocation(item.location || '');
    setMomentSource(item.source || null);
    setIsEditing(true);
    setSelectedCalendarMoment(null);
    setCurrentTab('home');
    setCurrentViewMode('list');
  }, [currentTab, isEditing]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false); setEditingMomentId(null);
    setMomentImage(null); setMomentAudio(null); setMomentLocation(''); setMomentSource(null);
    if (returnTab) { setCurrentTab(returnTab); setReturnTab(null); }
  }, [returnTab]);

  // ─── Delete + Undo ───
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

  // ─── Podlewanie ───
  const waterGarden = useCallback(async () => {
    if (wateredToday) {
      showToast('Już dziś podlane 💧 Wróć jutro!');
      return;
    }
    const todayKey = formatDateToKey(new Date());
    const updated = [...waterings, todayKey];
    await persistWaterings(updated);
    vibrate(40);
    showToast('Drzewko podlane 💧 +5% do następnego wpisu');
  }, [wateredToday, waterings, persistWaterings, showToast]);

  // ─── PIN ───
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
    await AsyncStorage.removeItem(STORAGE_KEYS.biometricEnabled);
    setSavedPin(null); setBiometricEnabled(false); setIsPinModalVisible(false);
    showToast('PIN usunięty');
  };

  const toggleBiometric = async () => {
    if (!savedPin) {
      Alert.alert('Najpierw PIN', 'Ustaw PIN, aby móc włączyć biometrię.');
      return;
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      Alert.alert('Niedostępne', 'Ten telefon nie ma skonfigurowanej biometrii.');
      return;
    }
    const newVal = !biometricEnabled;
    setBiometricEnabled(newVal);
    await AsyncStorage.setItem(STORAGE_KEYS.biometricEnabled, newVal ? 'true' : 'false');
    vibrate(30);
    showToast(newVal ? 'Biometria włączona 🔐' : 'Biometria wyłączona');
  };

  // ─── Kapsuły ───
  const createCapsule = async () => {
    if (!capsuleText.trim()) return Alert.alert('Puste', 'Napisz wiadomość do przyszłego siebie.');
    const days = parseInt(capsuleDays, 10);
    if (isNaN(days) || days < 1) return Alert.alert('Błąd', 'Podaj liczbę dni (min. 1).');
    const unlockAt = Date.now() + days * 86400000;
    const capsule = { id: `cap_${Date.now()}`, text: capsuleText.trim(), createdAt: Date.now(), unlockAt };
    const updated = [capsule, ...capsules];
    setCapsules(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.capsules, JSON.stringify(updated));
    // Zaplanuj powiadomienie o kapsule
    if (dailyNotifEnabled) {
      scheduleCapsuleNotification(capsule.id, capsule.text, unlockAt).catch(e => console.error(e));
    }
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

  // ─── Menu akcji ───
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

  // ─── Share ───
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

  const shareViaSystem = useCallback(async () => {
    if (!cardMoment) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Niedostępne', 'Udostępnianie systemowe nie jest dostępne.');
        return;
      }
      const txt = `„${cardMoment.text}”\n\n— Jeden Moment`;
      const fileUri = cardMoment.imageUri;
      if (fileUri && fileUri.startsWith('file://')) {
        await Sharing.shareAsync(fileUri);
      } else {
        await Share.share({ message: txt });
      }
    } catch (e) {
      console.error('sharing', e);
      Alert.alert('Błąd', 'Nie udało się udostępnić.');
    }
  }, [cardMoment]);

  // ─── Symulatory (dla TestPanel) ───
  const handleSimulateStreakDays = async (target) => {
    try {
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

      const addedDates = [];
      for (let i = 0; i < target; i++) {
        const offset = existingConsecutive + i;
        const d = new Date(base); d.setDate(d.getDate() - offset);
        const key = formatDateToKey(d);
        if (newMoments.some(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === key)) continue;
        const mock = {
          ...buildMoment(`Symulowany wpis passy #symulacja`, EMOTIONS[offset % EMOTIONS.length], null, null, ''),
          id: `sim-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: d.getTime(), dateKey: key,
          date: d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
        };
        newMoments.push(mock);
        addedDates.push(key);
      }

      await persistMoments(newMoments);
      vibrate(30);
      showToast(`🧪 +${addedDates.length} dni`);
    } catch (e) { console.error('simulate', e); }
  };

  const handleAddPhotoMoment = async () => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const key = formatDateToKey(y);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    if (existing.some(m => (m.dateKey || formatDateToKey(new Date(m.timestamp))) === key)) {
      showToast('Wczoraj już ma wpis 🧪');
      return;
    }
    const m = {
      ...buildMoment('Testowy moment 📸 #test', '😊', SAMPLE_IMAGES[0], null, ''),
      timestamp: y.getTime(), dateKey: key,
      date: y.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: 'gallery',
    };
    await persistMoments([m, ...existing]);
    vibrate(30);
    showToast('Dodano moment ze zdjęciem 📸');
  };

  const handleAddAudioMoment = async () => {
    const y = new Date(); y.setDate(y.getDate() - 2);
    const key = formatDateToKey(y);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    const m = {
      ...buildMoment('Testowy moment 🎙️ #test', '⚡', null, { duration: 5 }, ''),
      timestamp: y.getTime(), dateKey: key,
      date: y.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    await persistMoments([m, ...existing]);
    vibrate(30);
    showToast('Dodano moment z audio 🎙️');
  };

  const handleAddGpsMoment = async () => {
    const y = new Date(); y.setDate(y.getDate() - 3);
    const key = formatDateToKey(y);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    const m = {
      ...buildMoment('Testowy moment 📍 #test', '💡', null, null, 'Warszawa, Polska'),
      timestamp: y.getTime(), dateKey: key,
      date: y.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: 'gps',
    };
    await persistMoments([m, ...existing]);
    vibrate(30);
    showToast('Dodano moment z GPS 📍');
  };

  const handleAddFullMoment = async () => {
    const y = new Date(); y.setDate(y.getDate() - 4);
    const key = formatDateToKey(y);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    const m = {
      ...buildMoment('Pełny testowy moment ✨ #test', '❤️', SAMPLE_IMAGES[0], { duration: 3 }, 'Kraków, Polska'),
      timestamp: y.getTime(), dateKey: key,
      date: y.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: 'gallery',
    };
    await persistMoments([m, ...existing]);
    vibrate(30);
    showToast('Dodano pełny moment ✨');
  };

  const handleSimulateGardenState = async (stateId) => {
    const daysAgo = { blooming: 0, healthy: 2, thirsty: 5, sad: 10 }[stateId] || 0;
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(m => {
      const daysSince = (Date.now() - m.timestamp) / 86400000;
      return daysSince > daysAgo + 1;
    });
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const key = formatDateToKey(d);
    const mock = {
      ...buildMoment(`Stan drzewka: ${stateId} #symulacja`, '😌', null, null, ''),
      timestamp: d.getTime(), dateKey: key,
      date: d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    await persistMoments([mock, ...filtered]);
    vibrate(30);
    showToast(`🧪 Symulacja: ${stateId}`);
  };

  const handleClearMoments = async () => {
    await persistMoments([]);
    vibrate([0, 40, 40, 40]);
    showToast('🧪 Wyczyszczono momenty');
  };

  const handleClearWaterings = async () => {
    await persistWaterings([]);
    vibrate([0, 40, 40, 40]);
    showToast('🧪 Wyczyszczono podlewania');
  };

  const handleFullReset = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const backupKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.backupPrefix));
    await AsyncStorage.multiRemove([...Object.values(STORAGE_KEYS), ...backupKeys]);
    setMoments([]); setCapsules([]); setWaterings([]);
    setIsTestPanelVisible(false);
    vibrate([0, 60, 60, 60]);
    Alert.alert('Reset', 'Aplikacja zresetowana. Uruchom ponownie.');
  };

  const handleTestNotification = async () => {
    try {
      const { scheduleDailyReminder: schedule } = require('./src/notifications');
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Brak uprawnień', 'Włącz powiadomienia w ustawieniach systemowych.');
        return;
      }
      const result = await schedule(new Date().getHours(), (new Date().getMinutes() + 1) % 60);
      showToast(result.success ? '🔔 Test zaplanowany (1 min)' : 'Błąd testu');
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zaplanować testu.');
    }
  };

  const handleTestCapsuleNotification = async () => {
    try {
      const result = await scheduleCapsuleNotification('test_id', 'Testowa kapsuła', Date.now() + 60000);
      showToast(result.success ? '⏳ Test kapsuły zaplanowany' : 'Błąd testu');
    } catch (e) { console.error(e); }
  };

  const handleTestStreakNotification = async () => {
    try {
      const result = await scheduleStreakNotification(7);
      showToast(result.success ? '🔥 Test passy zaplanowany' : 'Błąd testu');
    } catch (e) { console.error(e); }
  };

  const handleCancelAllNotifications = async () => {
    await cancelAllNotifications();
    showToast('🚫 Anulowano wszystkie powiadomienia');
  };

  const handleUnlockAllAchievements = async () => {
    // Dodaje wymaganą liczbę wpisów dla wszystkich odznak
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.moments);
    const existing = raw ? JSON.parse(raw) : [];
    const needed = 50 - existing.length;
    if (needed <= 0) {
      showToast('Już masz wszystkie odznaki!');
      return;
    }
    let newMoments = [...existing];
    const base = new Date();
    for (let i = 0; i < needed; i++) {
      const d = new Date(base); d.setDate(d.getDate() - (i + 1));
      const key = formatDateToKey(d);
      const mock = {
        ...buildMoment(`Symulowany wpis #symulacja`, '😊', i < 5 ? SAMPLE_IMAGES[0] : null, i < 3 ? { duration: 3 } : null, i < 3 ? 'Warszawa' : ''),
        id: `sim-all-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: d.getTime(), dateKey: key,
        date: d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      newMoments.push(mock);
    }
    await persistMoments(newMoments);
    vibrate(30);
    showToast('🧪 Dodano wpisy dla odznak');
  };

  const handleLockAllAchievements = async () => {
    await persistMoments([]);
    vibrate(30);
    showToast('🧪 Wyczyszczono wszystkie odznaki');
  };

  // ─── Memo: filtrowanie ───
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

  // ⭐ Ukrycie sekcji z X (na stałe w stanie)
  const [hiddenSections, setHiddenSections] = useState({});
  const hideSection = (key) => {
    vibrate(10);
    setHiddenSections(prev => ({ ...prev, [key]: true }));
  };

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
      if (listRef.current && listRef.current.scrollToLocation) {
        listRef.current.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewOffset: 0, viewPosition: 0 });
      }
    } catch (_error) {
      try {
        if (listRef.current && listRef.current.scrollToOffset) {
          listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      } catch (_e2) {}
    }
    vibrate(15);
  }, []);

  const onListScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    const threshold = 3 * 180;
    if (y > threshold && !showScrollTop) setShowScrollTop(true);
    else if (y <= threshold && showScrollTop) setShowScrollTop(false);
  }, [showScrollTop]);

  // ─── Statystyki ───
  const weeklyReport = useMemo(() => computeWeeklyReport(moments), [moments]);
  const last7DaysStats = useMemo(() => computeLast7Days(moments), [moments]);
  const topWords = useMemo(() => computeTopWords(moments), [moments]);
  const moodRecommendation = useMemo(() => computeMoodRecommendation(moments, weeklyReport), [moments, weeklyReport]);
  const nostalgiaBuckets = useMemo(() => computeNostalgiaBuckets(moments), [moments]);
  const stats = useMemo(() => computeStats(moments, currentStreak), [moments, currentStreak]);

  const dynamicStyles = useMemo(() => ({
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: theme.borderWidth,
      borderRadius: theme.borderRadius,
      padding: 16,
      marginBottom: 16,
    },
    button: {
      backgroundColor: theme.accent,
      borderRadius: theme.borderRadius,
      borderWidth: 0,
      borderColor: '#000',
    },
  }), [theme]);

  // ─── Kalendarz ───
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

  // ⭐ renderMomentItem — teraz przekazujemy onPlayAudio
  const renderMomentItem = useCallback(({ item }) => (
    <MomentCard
      item={item}
      theme={theme}
      cardStyle={dynamicStyles.card}
      onMenu={openActionMenu}
      onPlayAudio={() => playAudioFromMoment(item)}
      isPlayingAudio={playingAudioId === item.id}
    />
  ), [theme, dynamicStyles.card, openActionMenu, playingAudioId]);
    // ═══════════════════════════════════════════
  // EKRAN BLOKADY PIN
  // ═══════════════════════════════════════════
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
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Odblokuj</Text>
          </TouchableOpacity>
          {biometricEnabled && (
            <TouchableOpacity
              style={[styles.mainButton, { marginTop: 10, backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.accent }]}
              onPress={tryBiometricUnlock}
            >
              <Text style={{ color: theme.accent, fontWeight: 'bold' }}>🔐 Użyj biometrii</Text>
            </TouchableOpacity>
          )}
        </View>
        <Toast message={toastMessage} theme={theme} actionLabel={toastAction?.label} onAction={toastAction?.fn} />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════
  // ONBOARDING
  // ═══════════════════════════════════════════
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
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Rozpocznij przygodę</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalFiltered = filteredMoments.length;
  const hasMore = visibleCount < totalFiltered;

  // ═══════════════════════════════════════════
  // GŁÓWNY RENDER
  // ═══════════════════════════════════════════
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
                    style={[styles.iconButton, { marginLeft: 8 }]}
                    onPress={() => { vibrate(10); setIsSearchModalVisible(true); }}
                  >
                    <View>
                      <Text style={{ fontSize: 18 }}>🔍</Text>
                      {activeFiltersCount > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: theme.accent,
                          borderRadius: 8,
                          minWidth: 16,
                          height: 16,
                          justifyContent: 'center',
                          alignItems: 'center',
                          paddingHorizontal: 4,
                        }}>
                          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                            {activeFiltersCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.iconButton, { marginLeft: 8 }]} onPress={toggleTheme}>
                  <Text style={{ fontSize: 18 }}>{theme.isLight ? '🌙' : '☀️'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={[styles.iconButton, { marginLeft: 8 }]}>
                  <Text style={{ fontSize: 18, color: theme.text }}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.content}>

            {currentTab === 'home' && (
              isEditing ? (
                <View style={dynamicStyles.card}>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                    {editingMomentId ? 'Edytuj wpis' : 'Twój Jeden Moment na dziś'}
                  </Text>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {momentImage && (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: momentImage }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setMomentImage(null); setMomentSource(null); }}>
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                      <TextInput
                        style={[styles.locationInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
                        placeholder="📍 Miejsce"
                        placeholderTextColor={theme.subtext}
                        value={momentLocation} onChangeText={setMomentLocation}
                        maxLength={40}
                      />
                      <TouchableOpacity
                        onPress={useCurrentLocation}
                        disabled={isLoadingGps}
                        style={[styles.mediaBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}
                      >
                        {isLoadingGps ? (
                          <ActivityIndicator size="small" color={theme.accent} />
                        ) : (
                          <Text style={{ fontSize: 14, color: theme.accent, fontWeight: 'bold' }}>📍 GPS</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                      <TouchableOpacity onPress={pickImageFromGallery} style={[styles.mediaBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}>
                        <Text style={{ fontSize: 14, color: theme.accent, fontWeight: 'bold' }}>📸 Galeria</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={pickImageFromCamera} style={[styles.mediaBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}>
                        <Text style={{ fontSize: 14, color: theme.accent, fontWeight: 'bold' }}>📷 Aparat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={pickRandomImage} style={[styles.mediaBtn, { borderColor: theme.border }]}>
                        <Text style={{ fontSize: 14, color: theme.text }}>🎲 Losowe</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={toggleRecording}
                        style={[styles.mediaBtn, { borderColor: isRecording ? 'red' : theme.border, backgroundColor: isRecording ? '#FEE2E2' : 'transparent' }]}>
                        <Text style={{ fontSize: 14, color: isRecording ? 'red' : theme.text }}>
                          {isRecording ? `🔴 ${recordingSeconds}s (Stop)` : '🎙️ Nagraj'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {momentAudio && !isRecording && (
                      <View style={[styles.audioPill, { backgroundColor: theme.border, marginTop: 10 }]}>
                        <TouchableOpacity onPress={playAudio} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 12 }}>▶️ Odtwórz ({momentAudio.duration}s)</Text>
                        </TouchableOpacity>
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
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zapisz</Text>
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
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
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

                        {/* Cichy Anioł — z X */}
                        {showAffirmation && !hiddenSections.affirmation && (
                          <View style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accent + '12' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>🕊️ Cichy Anioł</Text>
                              <TouchableOpacity
                                onPress={async () => {
                                  vibrate(10);
                                  setShowAffirmation(false);
                                  await AsyncStorage.setItem(STORAGE_KEYS.affirmationSeen, todayCode);
                                }}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              >
                                <Text style={{ color: theme.subtext, fontWeight: 'bold', fontSize: 18 }}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={{ color: theme.text, fontSize: 15, marginTop: 8, fontStyle: 'italic', lineHeight: 22 }}>
                              „{todayAffirmation}"
                            </Text>
                          </View>
                        )}

                        {/* Wdzięczność w akcji — z X */}
                        {actionChallenge && !hiddenSections.actionChallenge && (
                          <View style={[dynamicStyles.card, { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accent + '15' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>✨ Wdzięczność w akcji</Text>
                              <TouchableOpacity
                                onPress={() => hideSection('actionChallenge')}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              >
                                <Text style={{ color: theme.subtext, fontWeight: 'bold', fontSize: 18 }}>✕</Text>
                              </TouchableOpacity>
                            </View>
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
                                  setMomentImage(null); setMomentAudio(null); setMomentLocation(''); setMomentSource(null);
                                  setIsEditing(true); vibrate(10);
                                }}
                              >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Napisz swój moment...</Text>
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

                        {activeFiltersCount > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {searchQuery.trim() && (
                              <View style={[styles.filterPill, { backgroundColor: theme.accent, borderColor: theme.accent, flexDirection: 'row', alignItems: 'center' }]}>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold', marginRight: 6 }}>
                                  🔍 "{searchQuery}"
                                </Text>
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {selectedMoodFilter && (
                              <View style={[styles.filterPill, { backgroundColor: theme.accent, borderColor: theme.accent, flexDirection: 'row', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 12, marginRight: 6 }}>{selectedMoodFilter}</Text>
                                <TouchableOpacity onPress={() => setSelectedMoodFilter(null)}>
                                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {selectedTagFilter && (
                              <View style={[styles.filterPill, { backgroundColor: theme.accent, borderColor: theme.accent, flexDirection: 'row', alignItems: 'center' }]}>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold', marginRight: 6 }}>
                                  {selectedTagFilter}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedTagFilter(null)}>
                                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {selectedLocationFilter && (
                              <View style={[styles.filterPill, { backgroundColor: theme.accent, borderColor: theme.accent, flexDirection: 'row', alignItems: 'center' }]}>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold', marginRight: 6 }}>
                                  📍 {selectedLocationFilter}
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedLocationFilter(null)}>
                                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {onlyFavorites && (
                              <View style={[styles.filterPill, { backgroundColor: theme.accent, borderColor: theme.accent, flexDirection: 'row', alignItems: 'center' }]}>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold', marginRight: 6 }}>⭐</Text>
                                <TouchableOpacity onPress={() => setOnlyFavorites(false)}>
                                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            <TouchableOpacity
                              onPress={() => {
                                setSearchQuery('');
                                setSelectedMoodFilter(null);
                                setSelectedTagFilter(null);
                                setSelectedLocationFilter(null);
                                setOnlyFavorites(false);
                              }}
                              style={[styles.filterPill, { backgroundColor: 'transparent', borderColor: theme.border }]}
                            >
                              <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: 'bold' }}>Wyczyść</Text>
                            </TouchableOpacity>
                          </View>
                        )}

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
                              ⬇️ Pokaż więcej ({Math.min(visibleCount, totalFiltered)} / {totalFiltered})
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}>Statystyki</Text>
                  <TouchableOpacity
                    onPress={() => { vibrate(10); setCurrentTab('calendar'); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 4 }}>📅</Text>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Kalendarz</Text>
                  </TouchableOpacity>
                </View>

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

                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>📅 Wgląd w tydzień</Text>
                <WeekChart data={last7DaysStats} theme={theme} onPress={() => setIsWeeklyReportVisible(true)} title="Wgląd w tydzień" />

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
              </ScrollView>
            )}

            {currentTab === 'calendar' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900' }}>Kalendarz</Text>
                  <TouchableOpacity
                    onPress={() => { vibrate(10); setCurrentTab('stats'); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 4 }}>📊</Text>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: 'bold' }}>Statystyki</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <WeekChart data={last7DaysStats} theme={theme} onPress={() => setIsWeeklyReportVisible(true)} title="Wgląd w tydzień" />
                </View>

                <View style={[dynamicStyles.card, { paddingBottom: 16 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' }}>
                      {calendarDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                    </Text>
                    <View style={styles.row}>
                      <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} style={[styles.iconButton, { paddingHorizontal: 10 }]}>
                        <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>‹</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} style={[styles.iconButton, { paddingHorizontal: 10 }]}>
                        <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>›</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'].map(d => <Text key={d} style={{ width: '13%', textAlign: 'center', color: theme.subtext, fontSize: 11, fontWeight: 'bold' }}>{d}</Text>)}
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
            )}

            {currentTab === 'tree' && (
              <Garden
                moments={moments}
                waterings={waterings}
                theme={theme}
                styles={styles}
                dynamicStyles={dynamicStyles}
                currentStreak={currentStreak}
                onWater={waterGarden}
              />
            )}

          </View>

          {/* Pasek nawigacji z SafeAreaInsets */}
          <View style={[
            styles.bottomNavBar,
            {
              backgroundColor: theme.bg,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 12),
              paddingTop: 12,
            }
          ]}>
            <TouchableOpacity style={styles.navItem} onPress={() => { vibrate(8); setCurrentTab('home'); }}>
              <Text style={{ fontSize: 20, opacity: currentTab === 'home' ? 1 : 0.4 }}>🏠</Text>
              <Text style={{ color: currentTab === 'home' ? theme.text : theme.subtext, fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => { vibrate(8); setCurrentTab('stats'); }}>
              <Text style={{ fontSize: 20, opacity: currentTab === 'stats' ? 1 : 0.4 }}>📊</Text>
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

      {/* Modal wyszukiwania */}
      <SearchModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        theme={theme}
        allMoments={moments}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedMoodFilter={selectedMoodFilter}
        setSelectedMoodFilter={setSelectedMoodFilter}
        selectedTagFilter={selectedTagFilter}
        setSelectedTagFilter={setSelectedTagFilter}
        selectedLocationFilter={selectedLocationFilter}
        setSelectedLocationFilter={setSelectedLocationFilter}
        onlyFavorites={onlyFavorites}
        setOnlyFavorites={setOnlyFavorites}
        styles={styles}
      />

      {/* Panel testowy */}
      <TestPanel
        visible={isTestPanelVisible}
        onClose={() => setIsTestPanelVisible(false)}
        theme={theme}
        styles={styles}
        dynamicStyles={dynamicStyles}
        onSimulateStreak={handleSimulateStreakDays}
        onAddPhotoMoment={handleAddPhotoMoment}
        onAddAudioMoment={handleAddAudioMoment}
        onAddGpsMoment={handleAddGpsMoment}
        onAddFullMoment={handleAddFullMoment}
        onWaterNow={waterGarden}
        onSimulateGardenState={handleSimulateGardenState}
        onUnlockAllAchievements={handleUnlockAllAchievements}
        onLockAllAchievements={handleLockAllAchievements}
        onTestNotification={handleTestNotification}
        onTestCapsuleNotification={handleTestCapsuleNotification}
        onTestStreakNotification={handleTestStreakNotification}
        onCancelAllNotifications={handleCancelAllNotifications}
        onClearMoments={handleClearMoments}
        onClearWaterings={handleClearWaterings}
        onFullReset={handleFullReset}
        currentStreak={currentStreak}
        wateringsCount={waterings.length}
        momentsCount={moments.length}
      />

      {/* Modal eksportu */}
      <ExportModal
        visible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        theme={theme}
        styles={styles}
        dynamicStyles={dynamicStyles}
        moments={moments}
      />

      {/* ACTION MENU */}
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
            {actionMoment?.audioNote && (
              <TouchableOpacity style={[styles.actionRowBtn, { borderColor: theme.accent }]}
                onPress={() => { const m = actionMoment; setActionMoment(null); if (m) playAudioFromMoment(m); }}>
                <Text style={{ color: theme.accent, fontWeight: 'bold' }}>▶️ Odtwórz nagranie ({actionMoment.audioNote.duration}s)</Text>
              </TouchableOpacity>
            )}
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

      {/* ACHIEVEMENTS */}
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

      {/* ZEN */}
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

      {/* PIXEL YEAR */}
      <Modal visible={isPixelYearVisible} transparent animationType="fade" onRequestClose={() => setIsPixelYearVisible(false)}>
        <PixelYear moments={moments} year={new Date().getFullYear()} theme={theme} onClose={() => setIsPixelYearVisible(false)} />
      </Modal>

      {/* NOSTALGIA */}
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

      {/* CAPSULE */}
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

      {/* UNLOCKED CAPSULE */}
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

      {/* RANDOM */}
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
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Dziękuję</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* STREAK */}
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

      {/* RAPORT */}
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

      {/* KARTA */}
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
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]} onPress={shareViaSystem}>
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>📤 Udostępnij systemowo</Text>
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

      {/* USTAWIENIA */}
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

              {/* Powiadomienia */}
              <View style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>🔔 Powiadomienia</Text>
                    <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
                      {dailyNotifEnabled ? `Włączone o ${notifHour}:${notifMinute}` : 'Wyłączone'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={toggleDailyNotifications}>
                    <Text style={{ fontSize: 24 }}>{dailyNotifEnabled ? '✅' : '⚪'}</Text>
                  </TouchableOpacity>
                </View>
                {dailyNotifEnabled && (
                  <View style={styles.row}>
                    <TextInput style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]} value={notifHour} onChangeText={setNotifHour} keyboardType="number-pad" maxLength={2} />
                    <Text style={{ color: theme.text, fontSize: 18, marginHorizontal: 4 }}>:</Text>
                    <TextInput style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]} value={notifMinute} onChangeText={setNotifMinute} keyboardType="number-pad" maxLength={2} />
                    <TouchableOpacity style={[styles.saveTimeBtn, { backgroundColor: theme.accent, marginLeft: 10 }]} onPress={handleSaveNotifTime}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Zapisz</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Ukryj pasek systemowy */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={toggleHideSystemBar}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>📱 Ukryj pasek systemowy</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
                    {hideSystemBar ? 'Ukryty (immersive)' : 'Widoczny'}
                  </Text>
                </View>
                <Text style={{ fontSize: 20 }}>{hideSystemBar ? '✓' : '○'}</Text>
              </TouchableOpacity>

              {/* PIN */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12 }]} onPress={() => setIsPinModalVisible(true)}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🔒 Zabezpieczenie PIN</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>{savedPin ? 'PIN aktywny' : 'Brak blokady'}</Text>
              </TouchableOpacity>

              {/* Biometria */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={toggleBiometric}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>🔐 Biometria</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
                    {biometricEnabled ? 'Włączona' : 'Wyłączona'}
                  </Text>
                </View>
                <Text style={{ fontSize: 20 }}>{biometricEnabled ? '✓' : '○'}</Text>
              </TouchableOpacity>

              {/* Motyw */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12 }]} onPress={() => setIsThemePickerVisible(true)}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🎨 Motyw UI</Text>
                <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{theme.name} {theme.icon} ▾</Text>
              </TouchableOpacity>

              {/* Changelog */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12, borderColor: theme.accent, borderWidth: 2 }]} onPress={() => { setIsSettingsVisible(false); setIsChangelogVisible(true); }}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>📜 Co nowego?</Text>
                <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Wersja {CURRENT_VERSION} ▾</Text>
              </TouchableOpacity>

              {/* Eksport — jedno okno */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12 }]} onPress={() => { setIsSettingsVisible(false); setIsExportModalVisible(true); }}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>📤 Eksport danych</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>Wybierz format i udostępnij ▾</Text>
              </TouchableOpacity>

              {/* Tryb testowy */}
              <TouchableOpacity
                style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: testModeEnabled ? theme.accent : theme.border, borderWidth: 1 }]}
                onPress={toggleTestMode}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>🧪 Tryb testowy</Text>
                  <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
                    {testModeEnabled ? 'Włączony — panel dostępny' : 'Wyłączony'}
                  </Text>
                </View>
                <Text style={{ fontSize: 20 }}>{testModeEnabled ? '✓' : '○'}</Text>
              </TouchableOpacity>

              {/* Otwórz panel testowy — tylko gdy tryb włączony */}
              {testModeEnabled && (
                <TouchableOpacity
                  style={[dynamicStyles.card, { paddingVertical: 14, marginBottom: 12, backgroundColor: theme.accent + '15', borderColor: theme.accent, borderWidth: 2 }]}
                  onPress={() => { setIsSettingsVisible(false); setIsTestPanelVisible(true); }}
                >
                  <Text style={{ color: theme.accent, fontWeight: '900', textAlign: 'center' }}>🧪 OTWÓRZ PANEL TESTOWY</Text>
                </TouchableOpacity>
              )}

              {/* Reset */}
              <TouchableOpacity style={[dynamicStyles.card, { paddingVertical: 12, borderColor: 'red', borderWidth: 1 }]} onPress={resetApp}>
                <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>Resetuj Aplikację</Text>
              </TouchableOpacity>
              <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 12, fontSize: 10 }}>WERSJA [{VERSION}]</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHANGELOG MODAL */}
      <Modal visible={isChangelogVisible} animationType="slide" transparent onRequestClose={() => setIsChangelogVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: theme.borderWidth, maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.title, { color: theme.text, fontSize: 20 }]}>📜 Co nowego?</Text>
              <TouchableOpacity onPress={() => setIsChangelogVisible(false)}>
                <Text style={{ color: theme.subtext, fontSize: 20, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CHANGELOG.map((entry) => (
                <View key={entry.version} style={[dynamicStyles.card, entry.isCurrent && { borderColor: theme.accent, borderWidth: 2 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18 }}>v{entry.version}</Text>
                    {entry.isCurrent && (
                      <View style={{ backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>AKTUALNA</Text>
                      </View>
                    )}
                  </View>
                  {entry.badge && <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>{entry.badge}</Text>}
                  <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 12 }}>{entry.date}</Text>

                  {entry.changes.added?.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>✨ Dodano</Text>
                      {entry.changes.added.map((item, i) => (
                        <Text key={i} style={{ color: theme.text, fontSize: 13, lineHeight: 20, marginLeft: 8 }}>• {item}</Text>
                      ))}
                    </View>
                  )}
                  {entry.changes.fixed?.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>🐛 Naprawiono</Text>
                      {entry.changes.fixed.map((item, i) => (
                        <Text key={i} style={{ color: theme.text, fontSize: 13, lineHeight: 20, marginLeft: 8 }}>• {item}</Text>
                      ))}
                    </View>
                  )}
                  {entry.changes.changed?.length > 0 && (
                    <View>
                      <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>🔄 Zmieniono</Text>
                      {entry.changes.changed.map((item, i) => (
                        <Text key={i} style={{ color: theme.text, fontSize: 13, lineHeight: 20, marginLeft: 8 }}>• {item}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent, marginTop: 12 }]} onPress={() => setIsChangelogVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MOTYWY */}
      <Modal visible={isThemePickerVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', marginBottom: 16, textAlign: 'center' }}>Wybierz Motyw</Text>
            {themeList.map(t => (
              <TouchableOpacity key={t.id} onPress={() => changeTheme(t.id)}
                style={{ padding: 16, borderWidth: 2, borderColor: currentThemeId === t.id ? theme.accent : theme.border, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{t.icon}  {t.name}</Text>
                {currentThemeId === t.id && <Text style={{ color: theme.accent, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.mainButton, dynamicStyles.button, { marginTop: 8 }]} onPress={() => setIsThemePickerVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN */}
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

      {/* KALENDARZ DETAIL */}
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