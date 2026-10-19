import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './src/theme';

import LoadingScreen from './src/screens/Loading';
import OnboardingScreen from './src/screens/Onboarding';
import HomeScreen from './src/screens/Home';
import WriteScreen from './src/screens/Write';
import SuccessScreen from './src/screens/Success';
import MomentsScreen from './src/screens/Moments';
import MomentViewScreen from './src/screens/MomentView';
import ProfileScreen from './src/screens/Profile';
import SettingsScreen from './src/screens/Settings';
import AppearanceScreen from './src/screens/Appearance';
import PinScreen from './src/screens/Pin';

import { analyzeEmotion } from './src/algorithm';

const STORAGE_KEY = '@jeden_moment_entries';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [entries, setEntries] = useState([]);
  const [selectedMoment, setSelectedMoment] = useState(null);

  // 1. Ładowanie wpisów przy starcie
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setEntries(JSON.parse(saved));
      } catch (e) {
        console.log('Błąd odczytu bazy', e);
      }
    };
    loadEntries();
  }, []);

  // Sprawdzanie, czy dzisiaj już dodano wpis
  const today = new Date().toLocaleDateString('pl-PL');
  const todayEntry = entries.find(e => e.fullDate === today);

  // 2. Zapis nowego wpisu
  const handleSave = async (text) => {
    const analysis = analyzeEmotion(text);
    const now = new Date();

    const newEntry = {
      id: now.getTime().toString(),
      text,
      emotion: analysis.emotion,
      intensity: analysis.intensity,
      date: now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      fullDate: today // np. 19.10.2026 (do blokady)
    };
    
    const updated = [newEntry, ...entries];
    setEntries(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Błąd zapisu', e);
    }
    
    setSelectedMoment(newEntry);
    setScreen('success');
  };

  // 3. Otwieranie ekranu pisania (z blokadą)
  const handleTryWrite = () => {
    if (todayEntry) {
      Alert.alert(
        'Na dziś to już Twój moment.',
        'Zgodnie z filozofią aplikacji, dodajemy tylko jeden wpis dziennie. Możesz edytować lub usunąć dzisiejszy wpis.',
        [
          { text: 'Zobacz dzisiejszy', onPress: () => { setSelectedMoment(todayEntry); setScreen('moment'); } },
          { text: 'Anuluj', style: 'cancel' }
        ]
      );
    } else {
      setScreen('write');
    }
  };

  const handlePinDone = () => {
    Alert.alert('PIN ustawiony ✓', 'Twój kod został zapisany.');
    setScreen('settings');
  };

  const handleOpenMoment = (moment) => {
    setSelectedMoment(moment);
    setScreen('moment');
  };

  // Usuwanie wpisu
  const handleDelete = async (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setScreen('home');
    } catch (e) {
      console.log('Błąd usuwania', e);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {screen === 'loading' && (
        <SafeAreaView style={styles.safe}>
          <LoadingScreen onDone={() => setScreen('onboard')} />
        </SafeAreaView>
      )}
      
      {screen === 'onboard' && (
        <OnboardingScreen onDone={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <SafeAreaView style={styles.safe}>
          <HomeScreen
            onSettings={() => setScreen('settings')}
            onWrite={handleTryWrite}
            onOpenLast={() => { if(entries[0]) handleOpenMoment(entries[0]); }}
            onMoments={() => setScreen('moments')}
            onProfile={() => setScreen('profile')}
            lastEntry={entries[0]}
          />
        </SafeAreaView>
      )}

      {screen === 'write' && (
        <SafeAreaView style={styles.safe}>
          <WriteScreen
            onBack={() => setScreen('home')}
            onSave={handleSave}
          />
        </SafeAreaView>
      )}

      {screen === 'success' && (
        <SafeAreaView style={styles.safe}>
          <SuccessScreen onBack={() => setScreen('home')} />
        </SafeAreaView>
      )}

      {screen === 'moments' && (
        <SafeAreaView style={styles.safe}>
          <MomentsScreen
            onBack={() => setScreen('home')}
            onOpenMoment={handleOpenMoment}
            onHome={() => setScreen('home')}
            onProfile={() => setScreen('profile')}
            entries={entries}
          />
        </SafeAreaView>
      )}

      {screen === 'moment' && (
        <SafeAreaView style={styles.safe}>
          <MomentViewScreen 
            onBack={() => setScreen('home')} 
            moment={selectedMoment} 
            onDelete={handleDelete}
          />
        </SafeAreaView>
      )}

      {screen === 'profile' && (
        <SafeAreaView style={styles.safe}>
          <ProfileScreen
            onBack={() => setScreen('home')}
            onOpenLast={() => { if(entries[0]) handleOpenMoment(entries[0]); }}
            onMoments={() => setScreen('moments')}
            onSettings={() => setScreen('settings')}
            entries={entries}
          />
        </SafeAreaView>
      )}

      {screen === 'settings' && (
        <SafeAreaView style={styles.safe}>
          <SettingsScreen
            onBack={() => setScreen('home')}
            onAppearance={() => setScreen('appearance')}
            onPin={() => setScreen('pin')}
          />
        </SafeAreaView>
      )}

      {screen === 'appearance' && (
        <SafeAreaView style={styles.safe}>
          <AppearanceScreen onBack={() => setScreen('settings')} />
        </SafeAreaView>
      )}

      {screen === 'pin' && (
        <PinScreen onBack={() => setScreen('settings')} onDone={handlePinDone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
});