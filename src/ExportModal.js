import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  SafeAreaView, Platform, StatusBar, Share, Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { vibrate } from './utils';

export default function ExportModal({
  visible,
  onClose,
  theme,
  styles,
  dynamicStyles,
  moments,
}) {
  const [selectedFormat, setSelectedFormat] = useState('text');
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    {
      id: 'text',
      icon: '📝',
      name: 'Tekst',
      desc: 'Czytelny format, każdy wpis w osobnej sekcji',
      preview: '📅 14 paź 2026  😊\nDziś udało mi się...',
    },
    {
      id: 'json',
      icon: '🔧',
      name: 'JSON',
      desc: 'Format techniczny, do backupu i importu',
      preview: '[{"id":"...","text":"...","mood":"😊"}]',
    },
    {
      id: 'markdown',
      icon: '📄',
      name: 'Markdown',
      desc: 'Format dla Notion, Obsidian, GitHub',
      preview: '# Jeden Moment\n\n## 14 października 2026\n\n**😊** Dziś...',
    },
    {
      id: 'csv',
      icon: '📊',
      name: 'CSV',
      desc: 'Arkusz kalkulacyjny (Excel, Google Sheets)',
      preview: 'data,emocja,tekst,miejsce\n2026-10-14,😊,"Dziś...","Kraków"',
    },
  ];

  const generateExport = (format) => {
    if (!moments || moments.length === 0) return '';

    switch (format) {
      case 'text':
        return moments.map(m => {
          const loc = m.location ? ` 📍 ${m.location}` : '';
          const fav = m.isFavorite ? ' ⭐' : '';
          return `📅 ${m.date}  ${m.mood}${fav}${loc}\n${m.text}`;
        }).join('\n\n─────\n\n');

      case 'json':
        return JSON.stringify(moments, null, 2);

      case 'markdown': {
        let md = `# Jeden Moment\n\n`;
        md += `Eksport: ${new Date().toLocaleDateString('pl-PL')}\n`;
        md += `Liczba wpisów: ${moments.length}\n\n---\n\n`;
        moments.forEach(m => {
          md += `## ${m.date}\n\n`;
          md += `**${m.mood}**${m.isFavorite ? ' ⭐' : ''}`;
          if (m.location) md += ` 📍 ${m.location}`;
          md += `\n\n${m.text}\n\n---\n\n`;
        });
        return md;
      }

      case 'csv': {
        const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        const headers = ['data', 'emocja', 'tekst', 'miejsce', 'ulubione', 'ma_zdjecie', 'ma_audio'];
        const rows = moments.map(m => [
          escape(m.date),
          escape(m.mood),
          escape(m.text),
          escape(m.location || ''),
          m.isFavorite ? 'tak' : 'nie',
          m.imageUri ? 'tak' : 'nie',
          m.audioNote ? 'tak' : 'nie',
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
      }

      default:
        return '';
    }
  };

  const handleShare = async (formatOverride) => {
    const format = formatOverride || selectedFormat;
    const content = generateExport(format);

    if (!content) {
      Alert.alert('Brak danych', 'Nie masz jeszcze żadnych wpisów do eksportu.');
      return;
    }

    setIsExporting(true);
    vibrate(20);

    try {
      // Próbuj udostępnianie systemowe
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Zapisz do pliku tymczasowego i udostępnij
        const formatInfo = formats.find(f => f.id === format);
        await Share.share({
          message: content,
          title: `Jeden Moment - eksport (${formatInfo?.name || format})`,
        });
      } else {
        await Share.share({ message: content });
      }
      vibrate(30);
      onClose();
    } catch (e) {
      console.error('export', e);
      // Fallback na natywny Share
      try {
        await Share.share({ message: content });
      } catch (e2) {
        Alert.alert('Błąd', 'Nie udało się wyeksportować danych.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    // Bez clipboard API — pokazujemy w Share jako alternatywa
    Alert.alert(
      'Skopiuj dane',
      'Naciśnij "Udostępnij" poniżej, a następnie wybierz "Kopiuj" z menu systemowego.',
      [{ text: 'OK' }]
    );
  };

  const selectedInfo = formats.find(f => f.id === selectedFormat);

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
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, marginRight: 8 }}>
            <Text style={{ fontSize: 22, color: theme.text, fontWeight: 'bold' }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text }}>
              📤 Eksport danych
            </Text>
            <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
              {moments.length} {moments.length === 1 ? 'wpis' : 'wpisów'} do wyeksportowania
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        >
          {/* Wybór formatu */}
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>
            📋 Wybierz format
          </Text>

          {formats.map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => { vibrate(10); setSelectedFormat(f.id); }}
              style={[
                dynamicStyles.card,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: selectedFormat === f.id ? theme.accent : theme.border,
                  paddingVertical: 14,
                }
              ]}
            >
              <Text style={{ fontSize: 28, marginRight: 14 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: theme.text,
                  fontWeight: 'bold',
                  fontSize: 15,
                  marginBottom: 2,
                }}>
                  {f.name}
                </Text>
                <Text style={{ color: theme.subtext, fontSize: 12 }}>
                  {f.desc}
                </Text>
              </View>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedFormat === f.id ? theme.accent : theme.border,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {selectedFormat === f.id && (
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: theme.accent,
                  }} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Podgląd */}
          {selectedInfo && (
            <View>
              <Text style={[styles.sectionLabel, { color: theme.subtext, marginTop: 20 }]}>
                👁️ Podgląd formatu
              </Text>
              <View style={[dynamicStyles.card, { paddingVertical: 14 }]}>
                <Text style={{
                  color: theme.text,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  fontSize: 11,
                  lineHeight: 17,
                }}>
                  {selectedInfo.preview}
                </Text>
              </View>
            </View>
          )}

          {/* Info */}
          <View style={{
            marginTop: 20,
            padding: 14,
            backgroundColor: theme.accent + '15',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: theme.accent,
          }}>
            <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20 }}>
              💡 Po kliknięciu „Udostępnij" otworzy się systemowe okno udostępniania — możesz wysłać dane mailem, zapisać w pliku, wysłać przez WhatsApp, albo skopiować do schowka.
            </Text>
          </View>
        </ScrollView>

        {/* Dolny pasek akcji */}
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
            onPress={() => handleShare()}
            disabled={isExporting || moments.length === 0}
            style={{
              backgroundColor: moments.length === 0 ? theme.border : theme.accent,
              borderRadius: theme.borderRadius,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
              {isExporting ? 'Eksportowanie...' : `Udostępnij (${selectedInfo?.name || ''})`}
            </Text>
          </TouchableOpacity>

          {moments.length === 0 && (
            <Text style={{
              color: theme.subtext,
              fontSize: 11,
              textAlign: 'center',
              marginTop: 8,
              fontStyle: 'italic',
            }}>
              Brak wpisów do eksportu
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}