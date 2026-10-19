import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { COLORS } from './src/theme';

// Importujemy ekrany z osobnych plików
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

import { analyzeEmotion } from './src/algorithm'; // Importujemy algorytm

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [selectedMoment, setSelectedMoment] = useState(null);

  // Funkcja zapisu – analizuje tekst i przechodzi do ekranu sukcesu
  const handleSave = (text) => {
    const analysis = analyzeEmotion(text);
    setSelectedMoment({ text, emotion: analysis.emotion, intensity: analysis.intensity });
    setScreen('success');
  };

  const handlePinDone = () => {
    Alert.alert('PIN ustawiony ✓', 'Twój kod został zapisany (na razie tylko w tej sesji).');
    setScreen('settings');
  };

  const handleOpenMoment = (moment) => {
    setSelectedMoment(moment);
    setScreen('moment');
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
            onWrite={() => setScreen('write')}
            onOpenLast={() => setScreen('moment')}
            onMoments={() => setScreen('moments')}
            onProfile={() => setScreen('profile')}
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
          />
        </SafeAreaView>
      )}

      {screen === 'moment' && (
        <SafeAreaView style={styles.safe}>
          <MomentViewScreen onBack={() => setScreen('home')} moment={selectedMoment} />
        </SafeAreaView>
      )}

      {screen === 'profile' && (
        <SafeAreaView style={styles.safe}>
          <ProfileScreen
            onBack={() => setScreen('home')}
            onOpenLast={() => setScreen('moment')}
            onMoments={() => setScreen('moments')}
            onSettings={() => setScreen('settings')}
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