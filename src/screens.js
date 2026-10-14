import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Share,
  ImageBackground, Alert, Image, Platform, StatusBar,
} from 'react-native';
import {
  COLORS, TYPOGRAPHY, SPACING, RADIUS, getColors,
  Button, Card, Input, shadowSoft,
} from './theme';
import {
  formatDateFull, formatDateUpper, formatDateShort,
  getTodayPrompt, getTodayQuote, vibrate,
  addMoment, getTodayMoment, getTotalDaysWithMoments,
  calculateStreak, loadMoments, deleteMoment, updateMoment,
  isMomentTextValid, MAX_TEXT_LENGTH,
  exportMomentsAsText, exportMomentsAsJSON,
  loadSettings, saveSettings,
} from './helpers';

// ═══════════════════════════════════════════
// TŁO — góry (na razie bez zdjęć — placeholder)
// ═══════════════════════════════════════════

const BG_IMAGES = {
  mountains: null, // TODO: Etap 3 — wgrać zdjęcia
};

// Fallback — gradient kolorów jako tło
const MountainsFallback = ({ colors, children, style }) => (
  <View
    style={[
      {
        flex: 1,
        backgroundColor: colors.bg,
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ═══════════════════════════════════════════
// EKRAN 1: LOADING
// ═══════════════════════════════════════════

export const LoadingScreen = ({ colors, onDone }) => {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex(prev => (prev + 1) % 3);
    }, 400);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (onDone) onDone();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onDone]);

  const dots = [0, 1, 2].map(i => (
    <View
      key={i}
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: i === dotIndex ? colors.text : colors.textTertiary,
        opacity: i === dotIndex ? 1 : 0.4,
      }}
    />
  ));

  return (
    <MountainsFallback colors={colors}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
      }}>
        <Text style={[
          TYPOGRAPHY.display,
          { color: colors.text, textAlign: 'center', marginBottom: SPACING.s },
        ]}>
          Jeden{'\n'}Moment
        </Text>
        <Text style={[
          TYPOGRAPHY.label,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl },
        ]}>
          Zatrzymaj to co ulotne
        </Text>

        <View style={{ flexDirection: 'row', marginTop: SPACING.xxl }}>
          {dots}
        </View>
      </View>
    </MountainsFallback>
  );
};

// ═══════════════════════════════════════════
// EKRAN 2: ONBOARDING
// ═══════════════════════════════════════════

export const OnboardingScreen = ({ colors, onDone }) => {
  return (
    <MountainsFallback colors={colors}>
      <View style={{
        flex: 1,
        justifyContent: 'space-between',
        padding: SPACING.l,
        paddingTop: SPACING.xxl * 1.5,
        paddingBottom: SPACING.xxl,
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[
            TYPOGRAPHY.label,
            { color: colors.textSecondary, marginBottom: SPACING.l },
          ]}>
            Jeden Moment
          </Text>
          <Text style={[
            TYPOGRAPHY.display,
            { color: colors.text, textAlign: 'center', marginBottom: SPACING.m },
          ]}>
            Zatrzymaj{'\n'}to co ulotne
          </Text>
          <View style={{
            width: 40,
            height: 2,
            backgroundColor: colors.accent,
            marginVertical: SPACING.l,
          }} />
          <Text style={[
            TYPOGRAPHY.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: SPACING.l,
              lineHeight: 24,
            },
          ]}>
            Codziennie jedno pytanie. Jeden moment, który miał dla Ciebie znaczenie.
          </Text>
        </View>

        <View>
          <Button
            variant="primary"
            colors={colors}
            onPress={() => {
              vibrate(20);
              onDone();
            }}
            style={{ marginBottom: SPACING.m }}
          >
            Rozpocznij  →
          </Button>
          <Text style={[
            TYPOGRAPHY.caption,
            { color: colors.textTertiary, textAlign: 'center' },
          ]}>
            Małe chwile. Wielkie zmiany.
          </Text>
        </View>
      </View>
    </MountainsFallback>
  );
};

// ═══════════════════════════════════════════
// EKRAN 3: DZIŚ (główny)
// ═══════════════════════════════════════════

export const TodayScreen = ({ colors, todayMoment, onWrite, onOpenSettings, onOpenMoment }) => {
  const [prompt] = useState(() => getTodayPrompt());
  const [quote] = useState(() => getTodayQuote());

  const hasMomentToday = !!todayMoment;

  return (
    <MountainsFallback colors={colors}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING.l,
          paddingTop: Platform.OS === 'android'
            ? (StatusBar.currentHeight || 24) + SPACING.m
            : SPACING.xl,
          paddingBottom: SPACING.xxl * 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: SPACING.l,
        }}>
          <View>
            <Text style={[TYPOGRAPHY.title, { color: colors.text }]}>
              Jeden Moment
            </Text>
            <Text style={[
              TYPOGRAPHY.label,
              { color: colors.textSecondary, marginTop: 2 },
            ]}>
              Zatrzymaj to co ulotne
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary }]}>
              {formatDateUpper()}
            </Text>
            <Text style={[
              TYPOGRAPHY.caption,
              { color: colors.textSecondary, marginTop: 2 },
            ]}>
              {formatDateFull().split(',')[0]}
            </Text>
          </View>
        </View>

        {/* KARTA CYTATU */}
        <Card colors={colors} variant="alt" style={{ marginBottom: SPACING.l }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.accent + '40',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: SPACING.m,
            }}>
              <Text style={{ fontSize: 18, color: colors.text, fontWeight: '700' }}>
                "
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[
                TYPOGRAPHY.bodyLarge,
                { color: colors.text, lineHeight: 24, fontStyle: 'italic' },
              ]}>
                {quote.text}
              </Text>
              <Text style={[
                TYPOGRAPHY.caption,
                { color: colors.textSecondary, marginTop: SPACING.s },
              ]}>
                — {quote.author}
              </Text>
            </View>
          </View>
        </Card>

        {/* PYTANIE DNIA */}
        <Text style={[
          TYPOGRAPHY.display,
          { color: colors.text, marginBottom: SPACING.s, marginTop: SPACING.m },
        ]}>
          {prompt}
        </Text>
        <Text style={[
          TYPOGRAPHY.body,
          { color: colors.textSecondary, marginBottom: SPACING.xl, lineHeight: 22 },
        ]}>
          Zatrzymaj jeden moment z dzisiejszego dnia. Może to być coś małego.
        </Text>

        {/* STAN: DZIŚ ZAPISANE / PRZYCISK */}
        {hasMomentToday ? (
          <Card colors={colors} style={{ marginBottom: SPACING.m }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.s }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.success + '30',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: SPACING.s,
              }}>
                <Text style={{ color: colors.success, fontWeight: '700', fontSize: 14 }}>
                  ✓
                </Text>
              </View>
              <Text style={[TYPOGRAPHY.body, { color: colors.text, fontWeight: '600' }]}>
                Dziś zapisane
              </Text>
            </View>
            <Text
              style={[
                TYPOGRAPHY.body,
                { color: colors.textSecondary, lineHeight: 22, marginBottom: SPACING.m },
              ]}
              numberOfLines={3}
            >
              {todayMoment.text}
            </Text>
            <Button
              variant="outline"
              colors={colors}
              onPress={() => onOpenMoment(todayMoment)}
            >
              Zobacz moment  →
            </Button>
          </Card>
        ) : (
          <Button
            variant="primary"
            colors={colors}
            onPress={() => {
              vibrate(15);
              onWrite();
            }}
            style={{ marginBottom: SPACING.m }}
          >
            ✏️  Zapisz moment  →
          </Button>
        )}

        {/* USTAWIENIA */}
        <TouchableOpacity
          onPress={onOpenSettings}
          style={{
            alignSelf: 'center',
            paddingVertical: SPACING.m,
            paddingHorizontal: SPACING.l,
          }}
        >
          <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
            ⚙️  Ustawienia
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </MountainsFallback>
  );
};

// ═══════════════════════════════════════════
// EKRAN 4: WPISYWANIE
// ═══════════════════════════════════════════

export const WriteScreen = ({ colors, onCancel, onSaved }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [prompt] = useState(() => getTodayPrompt());

  const handleSave = async () => {
    if (!isMomentTextValid(text)) return;

    setSaving(true);
    vibrate(30);

    const result = await addMoment(text);

    setSaving(false);

    if (result.success) {
      onSaved(result.moment);
    } else if (result.reason === 'already_today') {
      Alert.alert(
        'Moment już zapisany',
        'Dziś masz już swój Jeden Moment. Wróć jutro.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Błąd', 'Nie udało się zapisać momentu.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING.l,
          paddingTop: Platform.OS === 'android'
            ? (StatusBar.currentHeight || 24) + SPACING.m
            : SPACING.xl,
          paddingBottom: SPACING.xxl * 2,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.l,
        }}>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Anuluj
            </Text>
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary }]}>
            Nowy moment
          </Text>
        </View>

        {/* DATA */}
        <Text style={[
          TYPOGRAPHY.label,
          { color: colors.textSecondary, marginBottom: SPACING.s },
        ]}>
          {formatDateUpper()}
        </Text>

        {/* PYTANIE */}
        <Text style={[
          TYPOGRAPHY.title,
          { color: colors.text, marginBottom: SPACING.l },
        ]}>
          {prompt}
        </Text>

        {/* POLE TEKSTOWE */}
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Zapisz swój moment..."
          colors={colors}
          multiline
          maxLength={MAX_TEXT_LENGTH}
          autoFocus
          style={{ minHeight: 160 }}
        />

        {/* LICZNIK */}
        <Text style={[
          TYPOGRAPHY.caption,
          {
            color: colors.textTertiary,
            textAlign: 'right',
            marginTop: SPACING.s,
            marginBottom: SPACING.l,
          },
        ]}>
          {text.length} / {MAX_TEXT_LENGTH}
        </Text>

        {/* PRZYCISK */}
        <Button
          variant="primary"
          colors={colors}
          onPress={handleSave}
          disabled={!isMomentTextValid(text) || saving}
        >
          {saving ? 'Zapisywanie...' : 'Zapisz moment'}
        </Button>
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════
// EKRAN 5: SUKCES
// ═══════════════════════════════════════════

export const SuccessScreen = ({ colors, moment, onViewMoment, onGoHome }) => {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: SPACING.l,
          paddingTop: Platform.OS === 'android'
            ? (StatusBar.currentHeight || 24) + SPACING.m
            : SPACING.xl,
          paddingBottom: SPACING.xxl,
          justifyContent: 'space-between',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginTop: SPACING.xxl }}>
          {/* ✓ DUŻE */}
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: colors.text,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: SPACING.xl,
          }}>
            <Text style={{ fontSize: 48, color: colors.text }}>✓</Text>
          </View>

          <Text style={[
            TYPOGRAPHY.display,
            { color: colors.text, textAlign: 'center', marginBottom: SPACING.m },
          ]}>
            Zapisano!
          </Text>
          <Text style={[
            TYPOGRAPHY.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: SPACING.l,
              lineHeight: 22,
            },
          ]}>
            Twój dzisiejszy moment został zapisany.
          </Text>
        </View>

        <View style={{ marginTop: SPACING.xxl }}>
          <Button
            variant="primary"
            colors={colors}
            onPress={onViewMoment}
            style={{ marginBottom: SPACING.m }}
          >
            👁️  Zobacz moment
          </Button>
          <Button
            variant="outline"
            colors={colors}
            onPress={onGoHome}
          >
            🏠  Wróć do dziś
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════
// EKRAN 6: WIDOK MOMENTU
// ═══════════════════════════════════════════

export const MomentViewScreen = ({ colors, moment, onBack, onEdit, onDelete }) => {
  if (!moment) return null;

  const dateObj = new Date(moment.timestamp);

  const handleDelete = () => {
    Alert.alert(
      'Usunąć moment?',
      'Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            vibrate(30);
            await deleteMoment(moment.id);
            onDelete();
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const date = dateObj.toLocaleDateString('pl-PL', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      await Share.share({
        message: `${date}\n\n„${moment.text}"\n\n— Jeden Moment`,
      });
    } catch (e) {
      console.error('share', e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING.l,
          paddingTop: Platform.OS === 'android'
            ? (StatusBar.currentHeight || 24) + SPACING.m
            : SPACING.xl,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.l,
        }}>
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary }]}>
            Twój moment
          </Text>
        </View>

        {/* DATA */}
        <Text style={[
          TYPOGRAPHY.label,
          { color: colors.textSecondary, marginBottom: SPACING.m },
        ]}>
          {formatDateUpper(dateObj)}
        </Text>

        {/* KARTA TEKSTU */}
        <Card colors={colors} style={{ marginBottom: SPACING.l }}>
          <Text style={[
            TYPOGRAPHY.bodyLarge,
            { color: colors.text, lineHeight: 28 },
          ]}>
            {moment.text}
          </Text>
        </Card>

        {/* AKCJE */}
        <View style={{ flexDirection: 'row', marginTop: SPACING.m }}>
          <Button
            variant="outline"
            colors={colors}
            onPress={onEdit}
            style={{ flex: 1, marginRight: SPACING.s }}
          >
            ✏️  Edytuj
          </Button>
          <Button
            variant="outline"
            colors={colors}
            onPress={handleShare}
            style={{ flex: 1, marginLeft: SPACING.s }}
          >
            📤  Udostępnij
          </Button>
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          style={{ alignSelf: 'center', padding: SPACING.m, marginTop: SPACING.m }}
        >
          <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
            Usuń moment
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════
// EKRAN 7: USTAWIENIA
// ═══════════════════════════════════════════

export const SettingsScreen = ({ colors, settings, onBack, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const toggleTheme = async () => {
    vibrate(15);
    const newTheme = localSettings.theme === 'light' ? 'dark' : 'light';
    const updated = { ...localSettings, theme: newTheme };
    setLocalSettings(updated);
    await saveSettings(updated);
    if (onUpdate) onUpdate(updated);
  };

  const toggleNotifications = async () => {
    vibrate(15);
    const updated = {
      ...localSettings,
      notificationsEnabled: !localSettings.notificationsEnabled,
    };
    setLocalSettings(updated);
    await saveSettings(updated);
    if (onUpdate) onUpdate(updated);
  };

  const handleExportJSON = async () => {
    const moments = await loadMoments();
    if (moments.length === 0) {
      Alert.alert('Brak danych', 'Nie masz jeszcze żadnych wpisów.');
      return;
    }
    try {
      await Share.share({ message: exportMomentsAsJSON(moments) });
    } catch (e) {
      console.error('export', e);
    }
  };

  const handleExportText = async () => {
    const moments = await loadMoments();
    if (moments.length === 0) {
      Alert.alert('Brak danych', 'Nie masz jeszcze żadnych wpisów.');
      return;
    }
    try {
      await Share.share({ message: exportMomentsAsText(moments) });
    } catch (e) {
      console.error('export', e);
    }
  };

  const totalDays = getTotalDaysWithMoments();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING.l,
          paddingTop: Platform.OS === 'android'
            ? (StatusBar.currentHeight || 24) + SPACING.m
            : SPACING.xl,
          paddingBottom: SPACING.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.l,
        }}>
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={{ fontSize: 24, color: colors.text }}>←</Text>
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.title, { color: colors.text }]}>
            Ustawienia
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* MOTYW */}
        <TouchableOpacity onPress={toggleTheme}>
          <Card colors={colors} style={{ marginBottom: SPACING.m }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View>
                <Text style={[TYPOGRAPHY.body, { color: colors.text, fontWeight: '600' }]}>
                  🌗  Motyw
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {localSettings.theme === 'light' ? 'Jasny' : 'Ciemny'}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* POWIADOMIENIA */}
        <TouchableOpacity onPress={toggleNotifications}>
          <Card colors={colors} style={{ marginBottom: SPACING.m }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View>
                <Text style={[TYPOGRAPHY.body, { color: colors.text, fontWeight: '600' }]}>
                  🔔  Powiadomienia
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {localSettings.notificationsEnabled
                    ? `Codziennie o ${String(localSettings.notificationHour).padStart(2, '0')}:${String(localSettings.notificationMinute).padStart(2, '0')}`
                    : 'Wyłączone'}
                </Text>
              </View>
              <Text style={{
                color: localSettings.notificationsEnabled ? colors.success : colors.textTertiary,
                fontSize: 18,
              }}>
                {localSettings.notificationsEnabled ? '●' : '○'}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* EKSPORT */}
        <Card colors={colors} style={{ marginBottom: SPACING.m }}>
          <Text style={[TYPOGRAPHY.body, {
            color: colors.text,
            fontWeight: '600',
            marginBottom: SPACING.m,
          }]}>
            📤  Eksport danych
          </Text>
          <TouchableOpacity
            onPress={handleExportText}
            style={{
              paddingVertical: SPACING.s,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>
              Jako tekst
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportJSON}
            style={{
              paddingVertical: SPACING.s,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>
              Jako JSON
            </Text>
          </TouchableOpacity>
        </Card>

        {/* STATYSTYKI MINI */}
        <Card colors={colors} variant="alt" style={{ marginBottom: SPACING.m }}>
          <Text style={[TYPOGRAPHY.label, {
            color: colors.textSecondary,
            marginBottom: SPACING.s,
          }]}>
            Statystyki
          </Text>
          <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>
            Zapisane dni: {totalDays}
          </Text>
        </Card>

        {/* WERSJA */}
        <Text style={[
          TYPOGRAPHY.caption,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            marginTop: SPACING.l,
          },
        ]}>
          Jeden Moment
        </Text>
      </ScrollView>
    </View>
  );
};