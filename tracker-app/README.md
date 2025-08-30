# 🔥 Morgenroutine Tracker

Eine minimalistische React Native App, um deine Morgenroutine zu tracken und eine Streak aufzubauen.

## ✨ Features

- **Streak-Zähler**: Zeigt an, wie viele Tage in Folge du deine Routine gemacht hast
- **Tägliche Erinnerungen**: Push-Notifications jeden Tag
- **Einfache Bedienung**: Nur ein Klick pro Tag - "Ja" oder "Nein"
- **Lokale Speicherung**: Deine Daten bleiben auf deinem Gerät
- **Motivierendes Design**: Mit Feuer-Emoji und gamifizierten Elementen

## 🚀 Installation

### Voraussetzungen
- Node.js (18+)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go App auf deinem Smartphone

### Setup
```bash
# Repository klonen
git clone <repository-url>
cd tracker-app/tracker-app

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm start

# App auf dem Handy öffnen
# Scanne den QR Code mit der Expo Go App
```

## 📱 Verwendung

1. **Erste Einrichtung**: Die App fragt nach Notification-Berechtigungen
2. **Tägliche Routine**: Jeden Tag bekommst du eine Erinnerung
3. **Bestätigung**: Klicke "Ja" wenn du deine Routine gemacht hast
4. **Streak aufbauen**: Dein Zähler steigt mit jedem erfolgreichen Tag
5. **Reset**: Bei verpassten Tagen wird der Streak automatisch zurückgesetzt

## 🛠️ Tech Stack

- **React Native** mit Expo
- **TypeScript** für Type Safety
- **AsyncStorage** für lokale Datenspeicherung
- **Expo Notifications** für Push-Benachrichtigungen

## 📦 Deployment

### Android (Play Store)
```bash
expo build:android
```

### iOS (App Store)
```bash
expo build:ios
```

## 🔧 Konfiguration

- **Notification-Zeit**: Standardmäßig alle 24 Stunden
- **Bundle ID**: `com.trackerapp.morgenroutine`
- **Icons**: Anpassbar in `assets/images/`

## 📝 Geplante Features

- [ ] Widget für Homescreen (iOS/Android)
- [ ] Backup/Sync mit Cloud
- [ ] Kalender-Ansicht
- [ ] Motivationszitate
- [ ] Custom Notification-Zeiten

## 👨‍💻 Entwicklung

Für lokale Entwicklung mit Test-Modus (Notifications alle 10 Sekunden):
```typescript
// In app/(tabs)/index.tsx
seconds: 10, // Statt 86400
```

## 📄 Lizenz

MIT License