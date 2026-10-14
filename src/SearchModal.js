import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  TextInput, SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { EMOTIONS } from './constants';
import { vibrate } from './utils';

export default function SearchModal({
  visible,
  onClose,
  theme,
  allMoments,
  searchQuery,
  setSearchQuery,
  selectedMoodFilter,
  setSelectedMoodFilter,
  selectedTagFilter,
  setSelectedTagFilter,
  selectedLocationFilter,
  setSelectedLocationFilter,
  onlyFavorites,
  setOnlyFavorites,
  styles,
  onApply,
}) {
  // Lokalne stany (dopóki użytkownik nie kliknie "Zastosuj")
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [localMood, setLocalMood] = useState(selectedMoodFilter);
  const [localTag, setLocalTag] = useState(selectedTagFilter);
  const [localLocation, setLocalLocation] = useState(selectedLocationFilter);
  const [localFavorites, setLocalFavorites] = useState(onlyFavorites || false);

  // Synchronizacja gdy otwiera się modal
  React.useEffect(() => {
    if (visible) {
      setLocalQuery(searchQuery || '');
      setLocalMood(selectedMoodFilter);
      setLocalTag(selectedTagFilter);
      setLocalLocation(selectedLocationFilter);
      setLocalFavorites(onlyFavorites || false);
    }
  }, [visible, searchQuery, selectedMoodFilter, selectedTagFilter, selectedLocationFilter, onlyFavorites]);

  // Zbieranie dostępnych tagów i miejsc
  const availableTags = useMemo(() => {
    const set = new Set();
    allMoments.forEach(m => {
      const matches = m.text.match(/#[a-zA-Z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+/g);
      if (matches) matches.forEach(t => set.add(t.toLowerCase()));
    });
    return Array.from(set).sort();
  }, [allMoments]);

  const availableLocations = useMemo(() => {
    const set = new Set();
    allMoments.forEach(m => { if (m.location) set.add(m.location); });
    return Array.from(set).sort();
  }, [allMoments]);

  // Liczba wyników po filtrach (live preview)
  const resultCount = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    return allMoments.filter(m => {
      if (localFavorites && !m.isFavorite) return false;
      if (localMood && m.mood !== localMood) return false;
      if (localTag && !m.text.toLowerCase().includes(localTag.toLowerCase())) return false;
      if (localLocation && m.location !== localLocation) return false;
      if (q && !m.text.toLowerCase().includes(q)) return false;
      return true;
    }).length;
  }, [allMoments, localQuery, localMood, localTag, localLocation, localFavorites]);

  // Liczba aktywnych filtrów
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (localQuery.trim()) count++;
    if (localMood) count++;
    if (localTag) count++;
    if (localLocation) count++;
    if (localFavorites) count++;
    return count;
  }, [localQuery, localMood, localTag, localLocation, localFavorites]);

  const handleClearAll = useCallback(() => {
    vibrate(15);
    setLocalQuery('');
    setLocalMood(null);
    setLocalTag(null);
    setLocalLocation(null);
    setLocalFavorites(false);
  }, []);

  const handleApply = useCallback(() => {
    vibrate(20);
    setSearchQuery(localQuery);
    setSelectedMoodFilter(localMood);
    setSelectedTagFilter(localTag);
    setSelectedLocationFilter(localLocation);
    setOnlyFavorites(localFavorites);
    if (onApply) onApply();
    onClose();
  }, [localQuery, localMood, localTag, localLocation, localFavorites, setSearchQuery, setSelectedMoodFilter, setSelectedTagFilter, setSelectedLocationFilter, setOnlyFavorites, onApply, onClose]);

  const handleClose = useCallback(() => {
    vibrate(8);
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar barStyle={theme.isLight ? 'dark-content' : 'light-content'} />

        {/* ─── Nagłówek ─── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 12 : 12,
        }}>
          <TouchableOpacity onPress={handleClose} style={{ padding: 8, marginRight: 8 }}>
            <Text style={{ fontSize: 22, color: theme.text, fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text, flex: 1 }}>
            🔍 Szukaj
          </Text>
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: theme.accent + '22',
                borderWidth: 1,
                borderColor: theme.accent,
              }}
            >
              <Text style={{ fontSize: 12, color: theme.accent, fontWeight: 'bold' }}>
                Wyczyść ({activeFiltersCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Zawartość ─── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pole wyszukiwania */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{
              color: theme.subtext,
              fontSize: 11,
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 10,
            }}>
              Szukaj w tekście
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.card,
              borderWidth: 2,
              borderColor: localQuery ? theme.accent : theme.border,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 10,
                  fontSize: 16,
                }}
                placeholder="Wpisz słowo, #tag..."
                placeholderTextColor={theme.subtext}
                value={localQuery}
                onChangeText={setLocalQuery}
                autoFocus
                maxLength={60}
              />
              {localQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLocalQuery('')} style={{ padding: 8 }}>
                  <Text style={{ color: theme.subtext, fontWeight: 'bold', fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Ulubione */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <TouchableOpacity
              onPress={() => { vibrate(10); setLocalFavorites(!localFavorites); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: localFavorites ? theme.accent : theme.card,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: localFavorites ? theme.accent : theme.border,
              }}
            >
              <Text style={{
                color: localFavorites ? '#FFF' : theme.text,
                fontSize: 15,
                fontWeight: 'bold',
              }}>
                ⭐ Tylko ulubione
              </Text>
              <Text style={{
                color: localFavorites ? '#FFF' : theme.subtext,
                fontSize: 20,
              }}>
                {localFavorites ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Emocje */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{
              color: theme.subtext,
              fontSize: 11,
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 10,
            }}>
              Emocje
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { vibrate(10); setLocalMood(null); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: !localMood ? theme.accent : theme.card,
                  borderWidth: 2,
                  borderColor: !localMood ? theme.accent : theme.border,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: !localMood ? '#FFF' : theme.text,
                  fontWeight: 'bold',
                  fontSize: 13,
                }}>
                  Wszystkie
                </Text>
              </TouchableOpacity>
              {EMOTIONS.map(e => (
                <TouchableOpacity
                  key={e}
                  onPress={() => { vibrate(10); setLocalMood(localMood === e ? null : e); }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: localMood === e ? theme.accent : theme.card,
                    borderWidth: 2,
                    borderColor: localMood === e ? theme.accent : theme.border,
                    minWidth: 60,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tagi */}
          {availableTags.length > 0 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Text style={{
                color: theme.subtext,
                fontSize: 11,
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}>
                Tagi ({availableTags.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => { vibrate(10); setLocalTag(localTag === tag ? null : tag); }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: localTag === tag ? theme.accent : theme.accent + '15',
                      borderWidth: 1,
                      borderColor: localTag === tag ? theme.accent : theme.accent + '44',
                    }}
                  >
                    <Text style={{
                      color: localTag === tag ? '#FFF' : theme.accent,
                      fontSize: 13,
                      fontWeight: 'bold',
                    }}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Miejsca */}
          {availableLocations.length > 0 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Text style={{
                color: theme.subtext,
                fontSize: 11,
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}>
                Miejsca ({availableLocations.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableLocations.map(loc => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => { vibrate(10); setLocalLocation(localLocation === loc ? null : loc); }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: localLocation === loc ? theme.accent : theme.card,
                      borderWidth: 1,
                      borderColor: localLocation === loc ? theme.accent : theme.border,
                    }}
                  >
                    <Text style={{
                      color: localLocation === loc ? '#FFF' : theme.text,
                      fontSize: 13,
                      fontWeight: 'bold',
                    }}>
                      📍 {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Info jeśli brak danych do filtrowania */}
          {availableTags.length === 0 && availableLocations.length === 0 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <View style={{
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
                  💡 Dodaj wpisy z #tagami lub oznacz miejsca 📍, żeby móc je później filtrować.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ─── Dolny pasek akcji ─── */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'android' ? 34 : 20,
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}>
          <TouchableOpacity
            onPress={handleApply}
            style={{
              backgroundColor: theme.accent,
              borderRadius: theme.borderRadius,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
              Zastosuj ({resultCount} {resultCount === 1 ? 'wynik' : 'wyników'})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}