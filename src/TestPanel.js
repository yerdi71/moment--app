import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  SafeAreaView, Platform, StatusBar, Alert,
} from 'react-native';
import { vibrate } from './utils';

export default function TestPanel({
  visible,
  onClose,
  theme,
  styles,
  dynamicStyles,
  onSimulateStreak,
  onAddPhotoMoment,
  onAddAudioMoment,
  onAddGpsMoment,
  onAddFullMoment,
  onWaterNow,
  onSimulateGardenState,
  onUnlockAllAchievements,
  onLockAllAchievements,
  onTestNotification,
  onTestCapsuleNotification,
  onTestStreakNotification,
  onCancelAllNotifications,
  onClearMoments,
  onClearWaterings,
  onFullReset,
  currentStreak,
  wateringsCount,
  momentsCount,
}) {
  const [activeSection, setActiveSection] = useState('streak');

  const sections = [
    { id: 'streak', icon: '🔥', label: 'Passa' },
    { id: 'media', icon: '📸', label: 'Media' },
    { id: 'garden', icon: '🌳', label: 'Ogród' },
    { id: 'achievements', icon: '🏆', label: 'Odznaki' },
    { id: 'notifications', icon: '🔔', label: 'Powiadomienia' },
    { id: 'reset', icon: '⚠️', label: 'Reset' },
  ];

  const handleAction = (fn) => {
    vibrate(20);
    if (fn) fn();
  };

  const confirmAction = (title, message, onConfirm) => {
    Alert.alert(title, message, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Potwierdź', style: 'destructive', onPress: onConfirm },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar barStyle={theme.isLight ? 'dark-content' : 'light-content'} />

        {/* Nagłówek */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 12 : 12,
          backgroundColor: theme.bg,
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, marginRight: 8 }}>
            <Text style={{ fontSize: 22, color: theme.text, fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>
              🧪 Panel Testowy
            </Text>
            <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
              Narzędzie deweloperskie
            </Text>
          </View>
        </View>

        {/* Statystyki bieżące */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.accent + '15',
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '900' }}>{momentsCount}</Text>
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Momentów</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '900' }}>{currentStreak}</Text>
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Passa</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '900' }}>{wateringsCount}</Text>
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Podlań</Text>
          </View>
        </View>

        {/* Zakładki sekcji */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 60, borderBottomWidth: 1, borderBottomColor: theme.border }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
        >
          {sections.map(sec => (
            <TouchableOpacity
              key={sec.id}
              onPress={() => { vibrate(8); setActiveSection(sec.id); }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: activeSection === sec.id ? theme.accent : theme.card,
                borderWidth: 1,
                borderColor: activeSection === sec.id ? theme.accent : theme.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, marginRight: 4 }}>{sec.icon}</Text>
              <Text style={{
                color: activeSection === sec.id ? '#FFF' : theme.text,
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                {sec.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Zawartość aktywnej sekcji */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {activeSection === 'streak' && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>🔥 Symulacja passy</Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(() => onSimulateStreak(3))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ 3 dni passy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(() => onSimulateStreak(7))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ 7 dni passy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(() => onSimulateStreak(30))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ 30 dni passy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(() => onSimulateStreak(100))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>+ 100 dni passy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: '#EF4444', marginTop: 10 }]}
                onPress={() => confirmAction(
                  'Wyczyść passę',
                  'To usunie wszystkie momenty. Kontynuować?',
                  () => onClearMoments()
                )}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🗑️ Wyczyść passę</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeSection === 'media' && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>📸 Testowe wpisy z mediami</Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onAddPhotoMoment)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>📸 + Moment ze zdjęciem</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onAddAudioMoment)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🎙️ + Moment z audio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onAddGpsMoment)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>📍 + Moment z GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.accent, marginTop: 10 }]}
                onPress={() => handleAction(onAddFullMoment)}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✨ + Moment pełny (foto+audio+miejsce)</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 16, fontStyle: 'italic', lineHeight: 18 }}>
                💡 Wpisy testowe mają datę wczorajszą, żeby nie łamać reguły "1 moment dziennie".
              </Text>
            </View>
          )}

          {activeSection === 'garden' && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>🌳 Symulacja ogrodu</Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onWaterNow)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>💧 Podlej teraz</Text>
              </TouchableOpacity>

              <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '900', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Stan drzewka
              </Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => handleAction(() => onSimulateGardenState('blooming'))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🌸 Kwitnące (wpis dziś)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => handleAction(() => onSimulateGardenState('healthy'))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🌿 Zdrowe (2 dni temu)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => handleAction(() => onSimulateGardenState('thirsty'))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🌾 Spragnione (5 dni temu)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }]}
                onPress={() => handleAction(() => onSimulateGardenState('sad'))}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🍂 Zasmucone (10 dni temu)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: '#EF4444', marginTop: 10 }]}
                onPress={() => confirmAction(
                  'Wyczyść podlewania',
                  'Usunie wszystkie daty podlewania. Kontynuować?',
                  () => onClearWaterings()
                )}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🗑️ Wyczyść podlewania</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeSection === 'achievements' && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>🏆 Zarządzanie odznakami</Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.accent, marginBottom: 10 }]}
                onPress={() => handleAction(onUnlockAllAchievements)}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🔓 Odblokuj wszystkie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => handleAction(onLockAllAchievements)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🔒 Zablokuj wszystkie</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 16, fontStyle: 'italic', lineHeight: 18 }}>
                💡 Odblokowanie "wszystkich" — dodaje wymaganą liczbę wpisów, żeby odznaki się odblokowały.
              </Text>
            </View>
          )}

          {activeSection === 'notifications' && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>🔔 Test powiadomień</Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onTestNotification)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🔔 Test codziennego (5s)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onTestCapsuleNotification)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>⏳ Test kapsuły</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => handleAction(onTestStreakNotification)}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>🔥 Test passy 7 dni</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: '#EF4444', marginTop: 10 }]}
                onPress={() => handleAction(onCancelAllNotifications)}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🚫 Anuluj wszystkie powiadomienia</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 16, fontStyle: 'italic', lineHeight: 18 }}>
                💡 Powiadomienia mogą się nie pojawić, jeśli apka działa w tle i system je blokuje. Sprawdź ustawienia powiadomień.
              </Text>
            </View>
          )}

          {activeSection === 'reset' && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>⚠️ Reset danych</Text>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => confirmAction(
                  'Wyczyść momenty',
                  'To usunie wszystkie momenty. Kontynuować?',
                  () => onClearMoments()
                )}
              >
                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>🗑️ Wyczyść wszystkie momenty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }]}
                onPress={() => confirmAction(
                  'Wyczyść podlewania',
                  'Usunie wszystkie daty podlewania. Kontynuować?',
                  () => onClearWaterings()
                )}
              >
                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>🗑️ Wyczyść podlewania</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: '#DC2626', marginTop: 10 }]}
                onPress={() => confirmAction(
                  'Pełny reset',
                  'UWAGA! To usunie WSZYSTKIE dane: momenty, kapsuły, podlewania, ustawienia. Kontynuować?',
                  () => onFullReset()
                )}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>⚠️ Pełny reset aplikacji</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 16, fontStyle: 'italic', lineHeight: 18 }}>
                💡 Po pełnym resecie aplikacja uruchomi się od nowa jak przy pierwszym uruchomieniu.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Dolny pasek */}
        <TouchableOpacity
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.card,
            paddingBottom: Platform.OS === 'android' ? 34 : 14,
          }}
          onPress={() => { vibrate(10); onClose(); }}
        >
          <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>Zamknij panel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}