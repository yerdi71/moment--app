// ─── Changelog — Historia zmian w aplikacji ───

export const CURRENT_VERSION = '0.7.4';

export const CHANGELOG = [
  {
    version: '0.7.4',
    date: '14 października 2026',
    isCurrent: true,
    badge: '🚀 WIELKA AKTUALIZACJA',
    changes: {
      added: [
        '🎨 Nowa ikona aplikacji — neonowa roślinka',
        '🔍 Nowy modal wyszukiwania we wpisach',
        '🌳 System dbania o drzewko — podlewanie 💧',
        '🌱 Wzrost punktowy — bonusy za media',
        '💧 4 stany drzewka: Kwitnące / Zdrowe / Spragnione / Zasmucone',
        '🏆 4 nowe odznaki: Ogrodnik, Wiosna, Owoc, Opiekun',
        '🎙️ Prawdziwe nagrywanie głosu (expo-av)',
        '📷 Aparat w apce (expo-camera)',
        '📤 Udostępnianie systemowe (expo-sharing)',
        '🔔 Powiadomienia — codzienne o 20:00',
        '📜 Historia zmian (ten ekran)',
      ],
      fixed: [
        '🐛 Pasek Androida nie nachodzi już na dolne menu',
        '🐛 Strzałka do góry działa poprawnie',
        '🐛 Paginacja: 3 posty + 8 na klik',
        '🐛 Symulator passy dodaje dokładnie N dni',
      ],
      changed: [
        '🎨 Tylko 2 motywy: Jasny ☀️ + Ciemny 🌙',
        '🎨 Szybkie przełączanie motywu (przycisk w nagłówku)',
        '🔍 Szukanie przeniesione z ekranu głównego do modala',
      ],
    },
  },
  {
    version: '0.7.3',
    date: '13 października 2026',
    isCurrent: false,
    badge: '✨ Funkcje natywne',
    changes: {
      added: [
        '📸 Zdjęcia z galerii (expo-image-picker)',
        '📍 GPS / lokalizacja (expo-location)',
        '🔐 Biometria — odcisk palca (expo-local-authentication)',
        '🎨 Nowy przycisk szybkiego przełączania motywów',
      ],
      fixed: [
        '🐛 Poprawki błędów v0.7.2.2',
      ],
      changed: [
        '🎨 Motywy zredukowane do 2',
      ],
    },
  },
  {
    version: '0.7.2.2',
    date: '12 października 2026',
    isCurrent: false,
    badge: '🛠️ Stabilizacja',
    changes: {
      added: [
        '✅ Zasada fundamentalna: 1 moment dziennie',
        '📊 Raport tygodnia połączony z kalendarzem',
        '📈 Uporządkowane statystyki',
      ],
      fixed: [
        '🐛 Undo usuniętych wpisów',
        '🐛 Symulator passy +7 dni',
        '🐛 Pasek Androida (częściowo)',
      ],
      changed: [],
    },
  },
  {
    version: '0.7.2',
    date: '10 października 2026',
    isCurrent: false,
    badge: '📈 Paginacja',
    changes: {
      added: [
        '🔢 Infinite scroll (pokaż więcej)',
        '⬆️ Pływająca strzałka do góry',
      ],
      fixed: [],
      changed: [],
    },
  },
  {
    version: '0.7.1',
    date: '8 października 2026',
    isCurrent: false,
    badge: '🎨 UI Refresh',
    changes: {
      added: [
        '📖 Cytat dnia',
        '⭐ Ulubione wpisy',
        '📝 Wzorce słowne',
        '💡 Wskazówki nastroju',
        '🎁 Losowe wspomnienie',
        '🧘 Moment Zen',
        '📆 Rok w pikselach',
        '⏪ Nostalgia',
      ],
      fixed: [],
      changed: [
        '🎨 Osiągnięcia w osobnym modalu',
        '🎨 Kapsuła czasu w statystykach',
      ],
    },
  },
  {
    version: '0.7.0',
    date: '1 października 2026',
    isCurrent: false,
    badge: '🌱 Fundament',
    changes: {
      added: [
        '📝 Podstawowe dodawanie wpisów',
        '😊 5 emocji',
        '🔥 Passa dni',
        '🌳 Ogród (drzewko rośnie)',
        '🏆 9 podstawowych odznak',
        '📅 Kalendarz',
        '📊 Statystyki',
        '🔒 PIN z blokadą',
        '💾 Backup (5 rotacji)',
        '📤 Eksport JSON/tekst',
        '🎨 6 motywów',
        '⏳ Kapsuła czasu',
      ],
      fixed: [],
      changed: [],
    },
  },
];

// ─── Funkcja pomocnicza ───

export const getLatestChanges = () => {
  return CHANGELOG[0] || null;
};

export const getChangesByVersion = (version) => {
  return CHANGELOG.find(c => c.version === version) || null;
};