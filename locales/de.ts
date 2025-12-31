import { Translation } from './en';

export const de: Translation = {
  // Common
  common: {
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    success: 'Erfolg',
    error: 'Fehler',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    back: 'Zurück',
    done: 'Fertig',
    loading: 'Lädt...',
  },

  // Main Navigation
  navigation: {
    home: 'Start',
    explore: 'Verlauf',
    status: 'Status',
    achievements: 'Erfolge',
    analytics: 'Statistiken',
    settings: 'Einstellungen',
  },

  // Home/Index Screen
  home: {
    title: 'Routine Tracker',
    subtitle: 'Bessere Gewohnheiten aufbauen',
    noRoutines: 'Noch keine Routinen',
    addRoutine: 'Füge deine erste Routine hinzu',
    addRoutineButton: 'Routine hinzufügen',
    editRoutine: 'Routine bearbeiten',
    routineName: 'Routinenname',
    routineNamePlaceholder: 'Routinenname eingeben',
    color: 'Farbe',
    frequency: 'Häufigkeit',
    startDate: 'Startdatum',
    createRoutine: 'Routine erstellen',
    updateRoutine: 'Routine aktualisieren',
    deleteRoutine: 'Routine löschen',
    confirmDelete: 'Routine löschen?',
    confirmDeleteMessage: 'Bist du sicher, dass du diese Routine löschen möchtest? Dies kann nicht rückgängig gemacht werden.',
    streakDays: 'Tag Serie',
    streakDaysPlural: 'Tage Serie',
    markComplete: 'Als erledigt markieren',
    markIncomplete: 'Als unerledigt markieren',
    completeToday: 'Heute erledigen',
    completedToday: 'Heute erledigt',
    invalidRoutineName: 'Bitte gib einen Routinennamen ein',
  },

  // Calendar
  calendar: {
    today: 'Heute',
    selectDate: 'Datum auswählen',
    noData: 'Keine Daten',
    monthNames: {
      january: 'Januar',
      february: 'Februar',
      march: 'März',
      april: 'April',
      may: 'Mai',
      june: 'Juni',
      july: 'Juli',
      august: 'August',
      september: 'September',
      october: 'Oktober',
      november: 'November',
      december: 'Dezember',
    },
    dayNames: {
      sunday: 'So',
      monday: 'Mo',
      tuesday: 'Di',
      wednesday: 'Mi',
      thursday: 'Do',
      friday: 'Fr',
      saturday: 'Sa',
    },
  },

  // Explore/History Screen
  explore: {
    title: 'Verlauf & Statistiken',
    summary: 'Zusammenfassung',
    completedDays: 'Erledigte Tage',
    totalDays: 'Gesamttage',
    completionRate: 'Abschlussrate',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    days: 'Tage',
    noHistory: 'Noch keine Verlaufsdaten',
    startTracking: 'Beginne mit dem Abschließen von Routinen, um deinen Verlauf zu sehen',
    selectedDay: 'Ausgewählter Tag',
    routinesCompleted: 'Routinen erledigt',
    noRoutinesThisDay: 'Keine Routinen an diesem Tag erledigt',
  },

  // Status Screen
  status: {
    title: 'Status & Statistiken',
    subtitle: 'Dein Fortschritt und Statistiken',
    overview: 'Übersicht',
    loading: 'Status wird geladen...',
  },

  // Motivational Dashboard
  motivational: {
    title: 'Dein Fortschritt',
    currentStreak: 'Aktuelle Serie',
    days: 'Tage',
    day: 'Tag',
    dayStreak: 'Tage Serie',
    todayProgress: 'Heutiger Fortschritt',
    today: 'Heute',
    completed: 'erledigt',
    monthProgress: 'Dieser Monat',
    monthAvg: 'Monatsdurchschnitt',
    daysCompleted: 'Tage erledigt',
    achievements: 'Erfolge',
    unlocked: 'Freigeschaltet',
    nextMilestone: '🎯 Nächster Meilenstein',
    weekWarrior: 'Tage bis Wochen-Krieger! 🔥',
    monthMaster: 'Tage bis Monats-Meister! 👑',
    hundredClub: 'Tage bis Hundert-Club! 💯',
    legend: 'Du bist eine Legende! Weiter so! 🌟',
    keepGoing: 'Weiter so! 🎯',
    greatStart: 'Großartiger Start! 💪',
    onFire: 'Du brennst! 🔥',
    champion: 'Champion! 🏆',
    unstoppable: 'Unaufhaltsam! ⭐',
    legendStatus: 'Legende! 👑',
  },

  // History Stats
  historyStats: {
    title: 'Verlaufsstatistiken',
    totalDays: 'Gesamttage',
    completedDays: 'Erledigte Tage',
    completionRate: 'Abschlussrate',
    currentStreak: 'Aktuelle Serie',
    longestStreak: 'Längste Serie',
    perfectDays: 'Perfekte Tage',
    days: 'Tage',
    noData: 'Keine Verlaufsdaten verfügbar',
  },

  // Achievements Screen
  achievements: {
    title: 'Erfolge',
    locked: 'Gesperrt',
    unlocked: 'Freigeschaltet',
    progress: 'Fortschritt',
    unlockedOn: 'Freigeschaltet am',
    almostThere: 'Fast geschafft!',
    keepGoing: 'Mach weiter, um diesen Erfolg freizuschalten',
    noAchievements: 'Noch keine Erfolge',
    startCompleting: 'Beginne mit dem Abschließen von Routinen, um Erfolge freizuschalten',
  },

  // Analytics Screen
  analytics: {
    title: 'Statistiken',
    overview: 'Übersicht',
    trends: 'Trends',
    insights: 'Einblicke',
    loading: 'Statistiken werden geladen...',
  },

  // Settings Screen
  settings: {
    title: 'Einstellungen',
    
    // Language Settings
    languageTitle: 'Sprache',
    languageDescription: 'Wähle deine bevorzugte Sprache',
    languageEnglish: 'English',
    languageGerman: 'Deutsch',
    
    // Theme Settings
    themeTitle: 'Erscheinungsbild',
    themeDescription: 'Wähle dein bevorzugtes App-Erscheinungsbild',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    autoMode: 'Systemstandard',
    
    // Wallpaper Settings
    wallpaperTitle: 'Hintergrundstil',
    wallpaperDescription: 'Wähle dein Hintergrunddesign',
    wallpaperNone: 'Kein',
    wallpaperDeepBlue: 'Tiefblau',
    wallpaperSunset: 'Sonnenuntergang Orange',
    wallpaperForest: 'Wald Türkis',
    wallpaperPurple: 'Königliches Lila',
    wallpaperNavy: 'Mitternachtsblau',
    wallpaperLightSky: 'Heller Himmel',
    wallpaperSoftMint: 'Sanfte Minze',
    
    // Notification Settings
    notificationTitle: 'Benachrichtigungen',
    notificationEnabled: 'Tägliche Erinnerungen aktivieren',
    notificationDescription: 'Erhalte tägliche Erinnerungen für deine Routinen',
    notificationTimeLabel: 'Erinnerungszeit:',
    notificationTimeDescription: 'Zeit, zu der du erinnert werden möchtest (24-Stunden-Format)',
    timeInvalid: 'Ungültiges Zeitformat. Bitte verwende HH:MM (z.B. 07:30)',
    notificationUpdated: 'Benachrichtigungseinstellungen erfolgreich aktualisiert!',
    loadingNotifications: 'Benachrichtigungseinstellungen werden geladen...',
    customizeReminders: 'Passe an, wann und wie du erinnert wirst',
    enableNotifications: '📱 Benachrichtigungen aktivieren',
    masterSwitch: 'Hauptschalter für alle Benachrichtigungen',
    smartFeatures: '🧠 Intelligente Funktionen',
    streakProtection: '🔥 Serienschutz',
    streakProtectionDesc: 'Zusätzliche Warnungen für gefährdete Serien',
    escalatingReminders: '📈 Eskalierende Erinnerungen',
    escalatingRemindersDesc: 'Häufigere Erinnerungen im Tagesverlauf',
    reminderTimes: '⏰ Erinnerungszeiten',
    notificationTimingInfo: 'Benachrichtigungen können ±15 Minuten von der eingestellten Zeit abweichen für bessere Akkuoptimierung',
    addTime: '+ Zeit hinzufügen',
    resetToDefaults: '↻ Auf Standard zurücksetzen',
    editReminderTime: 'Erinnerungszeit bearbeiten',
    addReminderTime: 'Erinnerungszeit hinzufügen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    resetNotificationSettings: 'Benachrichtigungseinstellungen zurücksetzen',
    resetNotificationConfirm: 'Dies setzt alle Benachrichtigungseinstellungen auf Standardwerte zurück. Fortfahren?',
    
    // Manual Streak
    manualStreakTitle: 'Manuelle Serieneingabe',
    manualStreakDescription: 'Wenn du deine Routine bereits vor der Nutzung dieser App verfolgt hast, kannst du hier deine aktuelle Serie festlegen.',
    currentStreak: 'Aktuelle Serie:',
    newStreakLabel: 'Neue Serie eingeben:',
    newStreakPlaceholder: '0',
    updateStreakButton: 'Serie aktualisieren',
    streakUpdated: 'Serie erfolgreich aktualisiert!',
    invalidInput: 'Ungültige Eingabe',
    invalidInputMessage: 'Bitte gib eine gültige Zahl zwischen 0 und 9999 ein.',
    
    // Debug Settings
    debugTitle: 'Debug-Einstellungen',
    debugMode: 'Debug-Modus',
    debugDescription: 'Debug-Informationen und Reset-Button auf dem Hauptbildschirm anzeigen',
    
    // Reset Data
    resetDataTitle: 'Daten zurücksetzen',
    resetDataDescription: 'Dies wird deinen gesamten Fortschritt dauerhaft löschen',
    resetButton: 'Alle Daten zurücksetzen',
    confirmReset: 'Zurücksetzen bestätigen',
    confirmResetMessage: 'Bist du sicher, dass du alle Daten zurücksetzen möchtest? Dies kann nicht rückgängig gemacht werden.',
    dataReset: 'Alle Daten wurden zurückgesetzt.',
    
    // About Section
    aboutTitle: 'Über Routine Tracker',
    aboutDescription: 'Eine kostenlose, datenschutzorientierte Gewohnheits-Tracker-App. Deine Daten bleiben auf deinem Gerät.',
    personalStory: 'Begonnen als persönliches Tool, um meine eigenen Routinen zu verfolgen, jetzt mit der Welt geteilt. 100% unabhängig, datenschutzorientiert und immer auf Basis eures Feedbacks verbessert.',
    version: 'Version 1.1.3',
    developer: 'Entwickelt von Sebastian Rothe',
    privacyPolicy: 'Datenschutzerklärung',
    impressum: 'Impressum',
    support: 'Support & Kontakt',
    openSource: 'Open Source',
    buyMeCoffee: '💝 Entwickler unterstützen',
    linkError: 'Link konnte nicht geöffnet werden',
  },

  // Frequency Types
  frequency: {
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    custom: 'Benutzerdefiniert',
    selectedDays: 'Ausgewählte Tage',
    everyDay: 'Jeden Tag',
    weekdays: 'Wochentags',
    weekends: 'Wochenenden',
  },

  // Notifications
  notifications: {
    title: 'Routinen-Erinnerung',
    body: 'Zeit, deine Routinen zu erledigen!',
    reminderTitle: 'Nicht vergessen!',
    reminderBody: 'Du hast heute noch Routinen zu erledigen',
  },
};
