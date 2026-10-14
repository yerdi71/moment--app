import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Klucze AsyncStorage ───
export const NOTIF_KEYS = {
  permissionsAsked: '@notif_permissions_asked',
  dailyEnabled: '@notif_daily_enabled',
  dailyHour: '@notif_daily_hour',
  dailyMinute: '@notif_daily_minute',
  lastScheduledId: '@notif_last_scheduled_id',
  capsuleNotified: '@notif_capsule_notified',
};

// ─── Konfiguracja wyświetlania powiadomień ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Kanał Androida (wymagane dla Android 8+) ───
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Jeden Moment',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
      sound: null, // cichy dzwonek
    });
  }
};

// ─── Sprawdzenie uprawnień ───
export const checkNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.error('checkNotifPerm', e);
    return false;
  }
};

// ─── Prośba o uprawnienia ───
export const requestNotificationPermissions = async () => {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === 'granted';

    if (granted) {
      await AsyncStorage.setItem(NOTIF_KEYS.permissionsAsked, 'true');
    }

    return granted;
  } catch (e) {
    console.error('requestNotifPerm', e);
    return false;
  }
};

// ─── Anulowanie wszystkich zaplanowanych ───
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('cancelAll', e);
  }
};

// ─── Zaplanowanie codziennego przypomnienia ───
export const scheduleDailyReminder = async (hour = 20, minute = 0) => {
  try {
    // Anuluj poprzednie
    await cancelAllNotifications();

    // Sprawdź uprawnienia
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      return { success: false, reason: 'no_permission' };
    }

    // Zaplanuj nowe — codziennie o podanej godzinie
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Jeden Moment 🌅',
        body: 'Nie zapisałeś jeszcze dzisiejszego momentu. Poświęć chwilę na wdzięczność 💜',
        data: { type: 'daily_reminder' },
        sound: null,
      },
      trigger: {
        type: 'daily',
        hour: hour,
        minute: minute,
      },
    });

    // Zapisz stan
    await AsyncStorage.setItem(NOTIF_KEYS.dailyEnabled, 'true');
    await AsyncStorage.setItem(NOTIF_KEYS.dailyHour, String(hour));
    await AsyncStorage.setItem(NOTIF_KEYS.dailyMinute, String(minute));
    await AsyncStorage.setItem(NOTIF_KEYS.lastScheduledId, identifier);

    return { success: true, identifier };
  } catch (e) {
    console.error('scheduleDaily', e);
    return { success: false, reason: e.message };
  }
};

// ─── Wyłączenie codziennego przypomnienia ───
export const disableDailyReminder = async () => {
  try {
    await cancelAllNotifications();
    await AsyncStorage.setItem(NOTIF_KEYS.dailyEnabled, 'false');
    return { success: true };
  } catch (e) {
    console.error('disableDaily', e);
    return { success: false };
  }
};

// ─── Sprawdzenie czy codzienne jest włączone ───
export const isDailyReminderEnabled = async () => {
  try {
    const val = await AsyncStorage.getItem(NOTIF_KEYS.dailyEnabled);
    return val === 'true';
  } catch (e) {
    return false;
  }
};

// ─── Pobranie zapisanej godziny ───
export const getSavedReminderTime = async () => {
  try {
    const hour = await AsyncStorage.getItem(NOTIF_KEYS.dailyHour);
    const minute = await AsyncStorage.getItem(NOTIF_KEYS.dailyMinute);
    return {
      hour: hour ? parseInt(hour, 10) : 20,
      minute: minute ? parseInt(minute, 10) : 0,
    };
  } catch (e) {
    return { hour: 20, minute: 0 };
  }
};

// ─── Powiadomienie o kapsule czasu ───
export const scheduleCapsuleNotification = async (capsuleId, capsuleText, unlockAt) => {
  try {
    const now = Date.now();
    if (unlockAt <= now) return { success: false, reason: 'past' };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏳ Twoja kapsuła czasu jest gotowa!',
        body: 'Wiadomość do siebie sprzed miesięcy czeka na otwarcie. Wróć do aplikacji, aby ją przeczytać 💜',
        data: { type: 'capsule', capsuleId },
        sound: null,
      },
      trigger: {
        type: 'date',
        date: new Date(unlockAt),
      },
    });

    return { success: true, identifier };
  } catch (e) {
    console.error('scheduleCapsule', e);
    return { success: false, reason: e.message };
  }
};

// ─── Powiadomienie o passie (gratulacje 7/30 dni) ───
export const scheduleStreakNotification = async (days) => {
  try {
    // Anuluj poprzednie powiadomienia o passie
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.content.data?.type === 'streak') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Zaplanuj nowe (5 sekund od teraz — natychmiastowe)
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 Gratulacje! ${days} dni passy!`,
        body: days >= 30
          ? 'Miesiąc z rzędu! Twoje drzewko jest pełne życia 🌳'
          : 'Tydzień blasku! Kontynuuj tak dalej 💜',
        data: { type: 'streak', days },
        sound: null,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 5,
        repeats: false,
      },
    });

    return { success: true, identifier };
  } catch (e) {
    console.error('scheduleStreak', e);
    return { success: false, reason: e.message };
  }
};

// ─── Powiadomienie o powrocie (po X dniach przerwy) ───
export const scheduleReturnNotification = async (daysSinceLastEntry) => {
  try {
    if (daysSinceLastEntry < 3) return { success: false, reason: 'too_soon' };

    // Anuluj poprzednie powiadomienia o powrocie
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.content.data?.type === 'return') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Zaplanuj natychmiastowe (5 sekund)
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Wróć do swojego ogrodu',
        body: `Minęło ${daysSinceLastEntry} dni od ostatniego wpisu. Twoje drzewko czeka 💜`,
        data: { type: 'return', days: daysSinceLastEntry },
        sound: null,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 5,
        repeats: false,
      },
    });

    return { success: true, identifier };
  } catch (e) {
    console.error('scheduleReturn', e);
    return { success: false, reason: e.message };
  }
};

// ─── Listener gdy powiadomienie zostanie kliknięte ───
export const addNotificationResponseListener = (callback) => {
  try {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (callback) callback(data);
    });
    return subscription;
  } catch (e) {
    console.error('listener', e);
    return { remove: () => {} };
  }
};

// ─── Listener gdy powiadomienie zostanie odebrane (foreground) ───
export const addNotificationReceivedListener = (callback) => {
  try {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      if (callback) callback(notification);
    });
    return subscription;
  } catch (e) {
    console.error('listener2', e);
    return { remove: () => {} };
  }
};

// ─── Info o uprawnieniach do wyświetlenia w Ustawieniach ───
export const getNotificationStatus = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const dailyEnabled = await isDailyReminderEnabled();
    const { hour, minute } = await getSavedReminderTime();
    return {
      permission: status,
      dailyEnabled,
      hour,
      minute,
    };
  } catch (e) {
    return {
      permission: 'unknown',
      dailyEnabled: false,
      hour: 20,
      minute: 0,
    };
  }
};