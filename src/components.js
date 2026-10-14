import React, { useState, useEffect, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { styles } from './styles';
import { formatDateToKey } from './utils';

// ─── TOAST ───
export const Toast = memo(({ message, theme, actionLabel, onAction }) => {
  if (!message) return null;
  return (
    <View pointerEvents="box-none" style={styles.toastWrap}>
      <View style={[styles.toast, { backgroundColor: theme.card, borderColor: theme.accent }]}>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700', flexShrink: 1 }}>{message}</Text>
        {actionLabel && (
          <TouchableOpacity onPress={onAction} style={{ marginLeft: 12 }}>
            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 12 }}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ─── KARTA MOMENTU ───
export const MomentCard = memo(({ item, theme, cardStyle, onMenu, onPlayAudio, isPlayingAudio }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);
  const animStyle = { opacity: visible ? 1 : 0, transform: [{ translateY: visible ? 0 : 14 }] };

  const hasAudio = !!(item.audioNote && item.audioNote.uri);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => onMenu(item)}
      delayLongPress={350}
      onLongPress={() => onMenu(item)}
      style={[cardStyle, animStyle, { flexDirection: 'row' }]}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <View style={styles.row}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>{item.mood}</Text>
          <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>{item.date}</Text>
          {item.isFavorite && <Text style={{ marginLeft: 6 }}>⭐</Text>}
        </View>

        {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.listImage} />}

        {!!item.location && (
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700', marginTop: 6 }}>📍 {item.location}</Text>
        )}

        {hasAudio && (
          <TouchableOpacity
            onPress={() => onPlayAudio && onPlayAudio()}
            activeOpacity={0.7}
            style={[
              styles.audioPill,
              {
                backgroundColor: isPlayingAudio ? theme.accent : theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginTop: 8,
                borderRadius: 20,
              }
            ]}
          >
            <Text style={{ fontSize: 14, marginRight: 6 }}>
              {isPlayingAudio ? '⏸️' : '▶️'}
            </Text>
            <Text style={{
              color: isPlayingAudio ? '#FFF' : theme.text,
              fontSize: 12,
              fontWeight: 'bold',
            }}>
              {isPlayingAudio ? 'Odtwarzanie...' : `Nagranie (${item.audioNote.duration || 0}s)`}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22, marginTop: 6 }}>{item.text}</Text>
      </View>
      <View style={{ justifyContent: 'center', alignItems: 'center', paddingLeft: 6 }}>
        <View style={{
          width: 34, height: 34, borderRadius: 17,
          borderWidth: 1, borderColor: theme.border,
          justifyContent: 'center', alignItems: 'center', backgroundColor: theme.card,
        }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginTop: -4 }}>⋮</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── WYKRES 7 DNI ───
export const WeekChart = memo(({ data, theme, onPress, title = 'Wgląd w tydzień' }) => {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chartCard, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: theme.borderWidth,
        borderRadius: theme.borderRadius,
      }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: 'bold' }}>{title}</Text>
        {onPress && <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: 'bold' }}>Kliknij po raport ›</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, justifyContent: 'space-around' }}>
        {data.map(d => {
          const h = Math.max(4, d.count * 16);
          return (
            <View key={d.key} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: theme.subtext, fontSize: 10, marginBottom: 4, fontWeight: 'bold' }}>{d.count || ''}</Text>
              <View style={{
                width: 22, height: h, borderRadius: 4,
                backgroundColor: d.isToday ? theme.accent : (d.count > 0 ? theme.accent + 'AA' : theme.border),
              }} />
              <Text style={{ color: d.isToday ? theme.accent : theme.subtext, fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>{d.dayLabel}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 12 }}>
        <Text style={{ color: theme.subtext, fontSize: 11 }}>📊 {total} {total === 1 ? 'moment' : 'momentów'}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── ROK W PIKSELACH ───
export const PixelYear = memo(({ moments, year, theme, onClose }) => {
  const cells = useMemo(() => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const totalDays = Math.round((end - start) / 86400000) + 1;
    const todayKey = formatDateToKey(new Date());
    const map = {};
    moments.forEach(m => { map[m.dateKey || formatDateToKey(new Date(m.timestamp))] = true; });
    const arr = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(year, 0, 1 + i);
      const key = formatDateToKey(d);
      arr.push({ key, has: !!map[key], isToday: key === todayKey });
    }
    return arr;
  }, [moments, year]);

  return (
    <View style={styles.modalOverlayCenter}>
      <View style={[styles.modalContentCenter, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: theme.borderWidth }]}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>Rok {year}</Text>
        <Text style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>Każdy kwadrat to jeden dzień</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {cells.map(c => (
              <View key={c.key} style={{
                width: '4.3%', aspectRatio: 1, margin: '1.4%',
                backgroundColor: c.has ? theme.accent : theme.border,
                borderWidth: c.isToday ? 2 : 0, borderColor: '#FFF',
                borderRadius: 3, opacity: c.has ? 1 : 0.35,
              }} />
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.accent, marginTop: 16 }]} onPress={onClose}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Zamknij</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});