# 🔔 Notification Troubleshooting Guide

## Problem Identifiziert ✅

Die Notifications funktionieren möglicherweise nicht aufgrund von:

### 1. Android-spezifische Probleme
- **Exact Alarm Permissions**: Android 12+ benötigt spezielle Permissions
- **Battery Optimization**: Apps können von der Battery Optimization ausgeschlossen werden müssen
- **Do Not Disturb**: Notifications können durch DND-Modi blockiert werden

### 2. Lösungen Implementiert

#### ✅ App.json Updates
```json
"permissions": [
  "SCHEDULE_EXACT_ALARM",
  "USE_EXACT_ALARM", 
  "RECEIVE_BOOT_COMPLETED",
  "WAKE_LOCK",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM"
]
```

#### ✅ Notification Plugin Configuration
```json
"expo-notifications": {
  "icon": "./assets/images/ic_launcher/android/mipmap-xxxhdpi/ic_launcher.png",
  "color": "#ffffff",
  "sounds": [],
  "mode": "production"
}
```

#### ✅ Debug Tool Erstellt
- Datei: `utils/notificationDebug.ts`
- Test-Button auf der Hauptseite (temporär)

## 🧪 Testing Instructions

### 1. Test-Button verwenden
1. App öffnen
2. Roten "TEST NOTIFICATIONS" Button drücken
3. Console Logs überprüfen (Metro Bundler Terminal)
4. Nach 5 Sekunden sollte Test-Notification erscheinen

### 2. Console Logs prüfen
Schaue in dein Terminal nach:
```
🔍 Testing notifications...
📱 Has notification permission: true/false
🧪 Test notification scheduled: [ID]
✅ Routine notifications scheduled successfully
📋 All scheduled notifications: [Anzahl]
```

### 3. Android-spezifische Checks

#### Permission Check:
- Öffne Android Settings > Apps > Routine Tracker > Permissions
- Stelle sicher, dass "Notifications" erlaubt sind
- Prüfe "Special app access" > "Alarms & reminders"

#### Battery Optimization:
- Android Settings > Battery > Battery optimization
- Suche "Routine Tracker"
- Stelle auf "Don't optimize"

## 🐛 Häufige Probleme

### Problem 1: Keine Permissions
**Lösung**: App deinstallieren und neu installieren, dann Permissions erlauben

### Problem 2: Notifications werden nicht angezeigt
**Lösung**: 
- Prüfe Do Not Disturb Einstellungen
- Prüfe Notification Channel Einstellungen
- Teste mit Test-Button

### Problem 3: Notifications funktionieren nur manchmal
**Lösung**:
- Battery Optimization deaktivieren
- App im Hintergrund offen lassen
- Prüfe Android Auto-Start Permissions

## 📱 Test Scenarios

1. **Immediate Test**: Test-Button → 5 Sekunden warten
2. **Daily Test**: Notification Zeit auf 1 Minute in der Zukunft setzen
3. **Permission Test**: App-Permissions zurücksetzen und neu erteilen

## 🔧 Production Fix

Nach erfolgreichem Test:
1. Test-Button aus der App entfernen
2. Debug-Logs entfernen  
3. Neuen Build erstellen
4. An Tester verteilen

---
**Nächste Schritte:**
1. Test-Button drücken und Ergebnis melden
2. Android Settings überprüfen
3. Battery Optimization deaktivieren
4. Erneut testen mit echten Notification-Zeiten