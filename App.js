import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar as RNStatusBar,
  Linking, Alert, Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  getColors, TYPOGRAPHY, SPACING, RADIUS,
} from './src/theme';
import {
  loadMoments, loadSettings,
  isOnboardingDone, markOnboardingDone,
  getTodayMoment, checkForUpdates,
  getTodayKey,
} from './src/helpers';
import {
  LoadingScreen,
  OnboardingScreen,
  TodayScreen,
  WriteScreen,
  SuccessScreen,
  MomentViewScreen,
  SettingsScreen,
} from './src/screens';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const [screen, setScreen] = useState('loading');
  const [settings, setSettings] = useState({ theme: 'light' });
  const [todayMoment, setTodayMoment] = useState(null);
  const [currentMoment, setCurrentMoment] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);

  const colors = getColors(settings.theme);

  // ═══ ŁADOWANIE STARTU ═══
  const bootstrap = useCallback(async () => {
    const [loadedSettings, loadedMoments] = await Promise.all([
      loadSettings(),
      loadMoments(),
    ]);

    setSettings(loadedSettings);

    // Znajdź dzisiejszy moment
    const todayKey = getTodayKey();
    const today = loadedMoments.find(m => m.dateKey === todayKey);
    setTodayMoment(today || null);

    // Sprawdź aktualizacje (nie blokuje UI)
    checkForUpdates()
      .then(result => {
        if (result && result.hasUpdate) setUpdateInfo(result);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // ═══ PO LOADING ═══
  const handleLoadingDone = useCallback(async () => {
    const done = await isOnboardingDone();
    setScreen(done ? 'today' : 'onboarding');
  }, []);

  // ═══ PO ONBOARDING ═══
  const handleOnboardingDone = useCallback(async () => {
    await markOnboardingDone();
    setScreen('today');
  }, []);

  // ═══ PO ZAPISIE ═══
  const handleMomentSaved = useCallback((moment) => {
    setCurrentMoment(moment);
    setTodayMoment(moment);
    setScreen('success');
  }, []);

  // ═══ PO USUNIĘCIU ═══
  const handleMomentDeleted = useCallback(async () => {
    const today = await getTodayMoment();
    setTodayMoment(today || null);
    setScreen('today');
  }, []);

  // ═══ EDYCJA (na razie placeholder) ═══
  const handleEditMoment = useCallback(() => {
    Alert.alert(
      'Edycja wpisu',
      'Funkcja edycji będzie dostępna w kolejnej wersji.',
      [{ text: 'OK' }]
    );
  }, []);

  // ═══ ZMIANA USTAWIEŃ ═══
  const handleUpdateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  // ═══ RENDEROWANIE EKRANU ═══
  const renderScreen = () => {
    switch (screen) {
      case 'loading':
        return <LoadingScreen colors={colors} onDone={handleLoadingDone} />;

      case 'onboarding':
        return <OnboardingScreen colors={colors} onDone={handleOnboardingDone} />;

      case 'today':
        return (
          <TodayScreen
            colors={colors}
            todayMoment={todayMoment}
            onWrite={() => setScreen('write')}
            onOpenSettings={() => setScreen('settings')}
            onOpenMoment={(m) => {
              setCurrentMoment(m);
              setScreen('moment');
            }}
          />
        );

      case 'write':
        return (
          <WriteScreen
            colors={colors}
            onCancel={() => setScreen('today')}
            onSaved={handleMomentSaved}
          />
        );

      case 'success':
        return (
          <SuccessScreen
            colors={colors}
            moment={currentMoment}
            onViewMoment={() => setScreen('moment')}
            onGoHome={() => setScreen('today')}
          />
        );

      case 'moment':
        return (
          <MomentViewScreen
            colors={colors}
            moment={currentMoment}
            onBack={() => setScreen('today')}
            onEdit={handleEditMoment}
            onDelete={handleMomentDeleted}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            colors={colors}
            settings={settings}
            onBack={() => setScreen('today')}
            onUpdate={handleUpdateSettings}
          />
        );

      default:
        return <LoadingScreen colors={colors} onDone={handleLoadingDone} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <RNStatusBar
        barStyle={settings.theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      {renderScreen()}

      {/* BANNER AKTUALIZACJI */}
      {updateInfo && screen === 'today' && (
        <UpdateBanner
          colors={colors}
          info={updateInfo}
          onClose={() => setUpdateInfo(null)}
        />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════
// BANNER AKTUALIZACJI
// ═══════════════════════════════════════════

const UpdateBanner = ({ colors, info, onClose }) => {
  const topOffset = Platform.OS === 'android'
    ? (RNStatusBar.currentHeight || 24) + 12
    : 60;

  return (
    <View
      style={{
        position: 'absolute',
        top: topOffset,
        left: SPACING.m,
        right: SPACING.m,
        backgroundColor: colors.card,
        borderRadius: RADIUS.card,
        borderWidth: 2,
        borderColor: colors.accent,
        padding: SPACING.m,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <Text style={{ fontSize: 24, marginRight: SPACING.s }}>🎉</Text>
      <View style={{ flex: 1 }}>
        <Text style={[
          TYPOGRAPHY.body,
          { color: colors.text, fontWeight: '700' },
        ]}>
          Nowa wersja {info.latestVersion}!
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(info.url)}>
          <Text style={[
            TYPOGRAPHY.caption,
            { color: colors.accent, marginTop: 2, fontWeight: '700' },
          ]}>
            Zaktualizuj  →
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={{
          color: colors.textSecondary,
          fontSize: 18,
          fontWeight: '700',
        }}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>
  );
};