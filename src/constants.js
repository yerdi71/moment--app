// ─── KONFIGURACJA ───
export const VERSION = '0.7.3';
export const INITIAL_VISIBLE = 3;   // ⭐ ZMIANA: 3 zamiast 20 (błąd #3)
export const LOAD_STEP = 8;         // ⭐ ZMIANA: 8 zamiast 20 (błąd #3)

export const STORAGE_KEYS = {
  moments: '@moje_momenty',
  settings: '@moje_ustawienia',
  onboarding: '@onboarding_done',
  lastStreak: '@ostatnia_passa',
  appPin: '@app_pin',
  capsules: '@capsules',
  backupPrefix: '@backup_',
  affirmationSeen: '@affirmation_seen',
  biometricEnabled: '@biometric_enabled',  // ⭐ NOWE
};

// ─── EMOCJE ───
export const EMOTIONS = ['😊', '😌', '⚡', '💡', '❤️'];

export const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500',
];

// ─── MOTYWY (tylko 2!) ───
// ⭐ ZMIANA: usunięto system, neo-brutalism, hand-drawn, dark-neon (błąd #5)
export const UI_THEMES = {
  'soft-minimal': {
    id: 'soft-minimal',
    name: 'Jasny',
    icon: '☀️',
    isLight: true,
    bg: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    subtext: '#6B7280',
    accent: '#8B5CF6',
    border: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 20,
  },
  'minimal-dark': {
    id: 'minimal-dark',
    name: 'Ciemny',
    icon: '🌙',
    isLight: false,
    bg: '#0F0F0F',
    card: '#1A1A1A',
    text: '#FFFFFF',
    subtext: '#8B949E',
    accent: '#A855F7',
    border: '#333333',
    borderWidth: 1,
    borderRadius: 16,
  },
};

export const LIGHT_THEMES = ['soft-minimal'];

export const CARD_BACKGROUNDS = [
  { id: 'purple', name: 'Lawendowy', bg: '#8B5CF6', text: '#FFFFFF', sub: '#DDD6FE', border: '#A78BFA' },
  { id: 'dark', name: 'Ciemny', bg: '#18181B', text: '#FFFFFF', sub: '#A1A1AA', border: '#3F3F46' },
  { id: 'warm', name: 'Złoty Świt', bg: '#F59E0B', text: '#FFFFFF', sub: '#FEF3C7', border: '#FBBF24' },
  { id: 'emerald', name: 'Szmaragd', bg: '#10B981', text: '#FFFFFF', sub: '#D1FAE5', border: '#34D399' },
  { id: 'minimal', name: 'Czysta Biel', bg: '#FFFFFF', text: '#111827', sub: '#6B7280', border: '#E5E7EB' },
];

// ─── DRZEWKO ───
export const TREE_STAGES = [
  { min: 100, icon: '🌳✨', name: 'Magiczne Drzewo', desc: 'Stworzyłeś niesamowity ekosystem pełen wdzięczności i miłości.' },
  { min: 50, icon: '🌲', name: 'Majestatyczne Bonsai', desc: 'Zapuściłeś potężne korzenie. Twoja praktyka stała się nawykiem.' },
  { min: 25, icon: '🌳', name: 'Rozłożyste Drzewo', desc: 'Drzewo rośnie w siłę, podobnie jak Twoje pozytywne myślenie.' },
  { min: 10, icon: '🪴', name: 'Kwitnąca Roślina', desc: 'Pielęgnujesz swoje myśli, a one zaczynają pięknie kwitnąć.' },
  { min: 3, icon: '🌿', name: 'Młody Pęd', desc: 'Z nasionka kiełkuje pierwsza roślina. Zadbaj o nią.' },
  { min: 0, icon: '🌱', name: 'Zasiane Nasionko', desc: 'Każda wielka zmiana zaczyna się od małego kroku.' },
];

// ─── ODZNAKI ───
export const ACHIEVEMENTS_LIST = [
  { id: 'first_step', title: 'Pierwszy Krok', desc: 'Dodaj swój pierwszy moment wdzięczności.', icon: '🌱', check: (m, s) => m.length >= 1 },
  { id: 'streak_3', title: 'Mała Passa', desc: 'Utrzymaj 3-dniową passę.', icon: '🔥', check: (m, s) => s >= 3 },
  { id: 'streak_7', title: 'Tydzień Blasku', desc: 'Utrzymaj 7-dniową passę.', icon: '⚡', check: (m, s) => s >= 7 },
  { id: 'entries_10', title: 'Kolekcjoner Chwil', desc: 'Zapisz łącznie 10 momentów.', icon: '📚', check: (m) => m.length >= 10 },
  { id: 'entries_50', title: 'Mistrz Wdzięczności', desc: 'Zapisz łącznie 50 momentów.', icon: '👑', check: (m) => m.length >= 50 },
  { id: 'media_master', title: 'Okiem Obiektywu', desc: 'Dodaj wpis ze zdjęciem.', icon: '📷', check: (m) => m.some(x => x.imageUri) },
  { id: 'voice_master', title: 'Głos Serca', desc: 'Dodaj notatkę głosową.', icon: '🎙️', check: (m) => m.some(x => x.audioNote) },
  { id: 'favorite_5', title: 'Kurator Wspomnień', desc: 'Oznacz 5 wpisów jako ⭐.', icon: '⭐', check: (m) => m.filter(x => x.isFavorite).length >= 5 },
  { id: 'traveler', title: 'Podróżnik', desc: 'Dodaj wpis z 3 różnych miejsc.', icon: '🗺️', check: (m) => new Set(m.map(x => x.location).filter(Boolean)).size >= 3 },
  { id: 'gallery_master', title: 'Fotograf', desc: 'Dodaj zdjęcie z galerii.', icon: '🖼️', check: (m) => m.some(x => x.source === 'gallery') },
  { id: 'gps_master', title: 'Odkrywca', desc: 'Użyj GPS do oznaczenia miejsca.', icon: '🧭', check: (m) => m.some(x => x.source === 'gps') },
];

// ─── TREŚCI CODZIENNE ───
export const DAILY_PROMPTS = [
  "Kto dziś sprawił, że się uśmiechnąłeś?", "Jaki mały sukces dziś osiągnąłeś?", "Co Cię dziś zaskoczyło pozytywnie?",
  "Za co kochasz swoje ciało dzisiaj?", "Jaki dźwięk sprawił Ci dziś przyjemność?", "Co dziś zrobiłeś dla siebie?",
  "Które wspomnienie dziś do Ciebie wróciło?", "Jaki zapach wywołał uśmiech na Twojej twarzy?", "Kto był dziś dla Ciebie życzliwy?",
  "Co dziś zobaczyłeś pięknego?", "Za jaką lekcję jesteś wdzięczny?", "Jaki smak sprawił Ci dziś radość?",
  "Co dziś poszło lepiej niż się spodziewałeś?", "Komu dziś pomogłeś?", "Za co jesteś wdzięczny swojemu ciału?",
  "Jaka książka / film / piosenka Cię dziś poruszyła?", "Za co lubisz swój dom / swoje miejsce?", "Który moment dziś zapamiętasz na długo?",
  "Co dziś zrobiłeś, co wymagało odwagi?", "Za co jesteś wdzięczny przyjacielowi?", "Jaki drobiazg dziś Cię ucieszył?",
  "Czego dziś nauczyłeś się o sobie?", "Za co dziękujesz przyrodzie?", "Jaka myśl dziś dodała Ci sił?",
  "Kogo chciałbyś dziś przytulić?", "Za co jesteś wdzięczny technologii?", "Jaka chwila dziś była dla Ciebie święta?",
  "Co dziś sprawiło, że poczułeś się bezpiecznie?", "Za co dziękujesz swoim bliskim?", "Jaki mały rytuał dziś poprawił Ci humor?",
];

export const DAILY_AFFIRMATIONS = [
  "Twoja obecność ma znaczenie dla innych.", "Dobrze, że jesteś. Serio.", "To, co robisz, ma sens — nawet jeśli dziś tego nie widzisz.",
  "Zasługujesz na spokój, którego szukasz.", "Małe kroki też prowadzą do celu.", "Jesteś kimś więcej niż swoimi błędami.",
  "Twoja wrażliwość to supermoc, nie słabość.", "Dziś wystarczy, że jesteś. Naprawdę.", "Ktoś myśli o Tobie z czułością.",
  "Świat jest lepszy, bo w nim jesteś.", "Twoje wysiłki nie idą na marne.", "Zasługujesz na dobre rzeczy.",
  "Jesteś silniejszy niż myślisz.", "Twoja historia jest warta opowiedzenia.", "Oddychaj. Wszystko jest w porządku.",
  "Nie musisz być dziś produktywny, by być wartościowy.", "Twoje uczucia są ważne i prawdziwe.", "Robisz to lepiej, niż Ci się wydaje.",
  "Zasługujesz na odpoczynek.", "Twoja życzliwość wraca do Ciebie.",
];

export const DAILY_QUOTES = [
  { text: "Wdzięczność to pamięć serca.", author: "Jean-Baptiste Massieu" },
  { text: "Szczęście to nie coś gotowego. To coś, co tworzysz.", author: "Dalajlama XIV" },
  { text: "Kiedy dziękujesz, strach znika, a pojawia się obfitość.", author: "Anthony Robbins" },
  { text: "Nie liczy się to, ile masz, ale ile doceniasz.", author: "Nieznany" },
  { text: "Wdzięczność zamienia to, co mamy, w to, co wystarcza.", author: "Melody Beattie" },
  { text: "Ciesz się małymi rzeczami, bo kiedyś spojrzysz wstecz i zobaczysz, że były wielkie.", author: "Robert Brault" },
  { text: "Wdzięczność to najpiękniejszy kwiat, jaki wyrasta z duszy.", author: "Henry Ward Beecher" },
  { text: "Każdy dzień to nowa szansa, by być wdzięcznym.", author: "Nieznany" },
  { text: "Wdzięczność otwiera drzwi do większej ilości dobra.", author: "Nieznany" },
  { text: "Szczęśliwi nie mają wszystkiego, ale doceniają wszystko.", author: "Nieznany" },
  { text: "Ten, kto potrafi być wdzięczny za małe rzeczy, jest bogaty.", author: "Nieznany" },
  { text: "Wdzięczność to cicha modlitwa serca.", author: "Nieznany" },
  { text: "Im więcej dziękujesz, tym więcej masz powodów do dziękowania.", author: "Nieznany" },
  { text: "Nie czekaj na idealny moment. Bądź wdzięczny za ten.", author: "Nieznany" },
  { text: "Wdzięczność to najkrótsza droga do szczęścia.", author: "Nieznany" },
  { text: "Świat jest pełen cudów, jeśli tylko chcesz je zobaczyć.", author: "Nieznany" },
  { text: "Wdzięczne serce to magnes na dobro.", author: "Nieznany" },
  { text: "Kiedy dziękujesz, życie staje się bogatsze.", author: "Nieznany" },
  { text: "Bądź wdzięczny za to, co masz, a dostaniesz więcej.", author: "Nieznany" },
  { text: "Wdzięczność to nie tylko słowa, to sposób patrzenia na świat.", author: "Nieznany" },
  { text: "Radość dzielona się mnoży, smutek dzielony maleje.", author: "Przysłowie" },
  { text: "Każdy dzień, w którym się obudziłeś, jest dobrym dniem.", author: "Nieznany" },
  { text: "Wdzięczność nie zmienia świata. Zmienia Ciebie.", author: "Nieznany" },
  { text: "Najlepszy czas, by być wdzięcznym, to teraz.", author: "Nieznany" },
  { text: "Doceniaj każdy moment — one nie wrócą.", author: "Nieznany" },
  { text: "Wdzięczność to jedna z najkrótszych dróg do spokoju.", author: "Nieznany" },
  { text: "Szczęście nie polega na posiadaniu, lecz na docenianiu.", author: "Nieznany" },
  { text: "Wdzięczność to most między tym, co masz, a tym, czego pragniesz.", author: "Nieznany" },
  { text: "Kto potrafi dziękować, ten potrafi żyć.", author: "Cyceron" },
  { text: "Wszystko, co dobre, zaczyna się od wdzięczności.", author: "Nieznany" },
];

export const VIBE_DESCRIPTIONS = {
  '😊': { title: 'Pozytywny Promień', desc: 'Radość to Twoje drugie imię. Dostrzegasz dobro na co dzień!' },
  '😌': { title: 'Oaza Spokoju', desc: 'Cenisz balans i harmonię. Wdzięczność za spokój to Twoja droga.' },
  '⚡': { title: 'Wulkan Energii', desc: 'Akcja i ekscytacja! Twój dziennik kipi od dynamicznych momentów.' },
  '💡': { title: 'Błyskotliwy Umysł', desc: 'Często doświadczasz momentów „Aha!”. Rozwój to Twój żywioł.' },
  '❤️': { title: 'Czułe Serce', desc: 'Relacje i miłość są dla Ciebie kluczowe. Piękna cecha!' },
};

export const STOPWORDS = new Set(['i','w','na','z','do','się','że','nie','to','jest','a','o','by','ale','jak','za','od','po','tak','już','mi','mnie','mój','moja','moje','the','and','for','you','this']);
