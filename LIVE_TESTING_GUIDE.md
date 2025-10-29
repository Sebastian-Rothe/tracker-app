# 🧪 LIVE NOTIFICATION TESTING GUIDE

Dieses Guide erklärt, wie du die Notification-Logik LIVE in der App testest.

---

## **Option 1: Test über Expo Dev Server Console (EMPFOHLEN)**

### Schritt 1: Expo Server starten
```bash
npm start
```

### Schritt 2: App im Expo Go öffnen
- Scannen Sie den QR-Code mit der Expo Go App
- Oder drücken Sie `i` für iOS / `a` für Android Emulator

### Schritt 3: Notifications Test in Console aktivieren
Im Expo Dev Server Terminal:

**Option A - Einfach (Kopieren & Einfügen):**
```javascript
import('./testNotificationsLive').then(m => m.runLiveTests())
```

**Option B - Mit Debugging:**
```javascript
global.testNotifications = async () => {
  const { runLiveTests } = await import('./testNotificationsLive');
  await runLiveTests();
};
await global.testNotifications();
```

### Schritt 4: Ergebnisse lesen
Die App zeigt automatisch:
- ✅ PASS Tests - alles funktioniert
- ❌ FAIL Tests - Fehler identifizieren
- ⚠️ SKIP Tests - Bedingungen nicht erfüllt (z.B. alle Routines abgeschlossen)

---

## **Was wird getestet?**

### **TEST 1: Permission Handling**
- Prüft, ob Notification-Berechtigungen granted sind
- Fordert diese an, falls nötig
- **Erwartet:** ✅ PASS

### **TEST 2: Settings Persistence**
- Lädt gespeicherte Notification-Settings
- Prüft multipleReminders, customTimes, etc.
- **Erwartet:** ✅ PASS

### **TEST 3: Routine Loading**
- Lädt alle gespeicherten Routines
- Zeigt deren Status (active/inactive)
- **Erwartet:** ✅ PASS (wenn Routines existieren)

### **TEST 4: Real-Time Status Calculation**
- Berechnet den aktuellen Completion-Status
- **KRITISCH:** Prüft auf False-Positives (Bug #2 Fix)
- **Erwartet:** ✅ PASS (zeigt echten Status)

### **TEST 5: Notification Scheduling**
- Scheduled tatsächlich Notifications
- **KRITISCH:** Prüft max 6/day Cap (Bug #4 Fix)
- Zeigt geplante Notification-Times
- **Erwartet:** ✅ PASS mit ≤ 6 Notifications

### **TEST 6: Settings Respect**
- **KRITISCH:** Prüft ob Custom Times respektiert werden (Bug #3 Fix)
- Validiert Escalation Logic
- **Erwartet:** ✅ PASS (Settings werden beachtet)

---

## **Erfolgskriterien für Produktion**

```
✅ All 6 Tests PASSED
✅ Success Rate: 100%
✅ Alle 4 Critical Bugs validiert:
   - Bug #1: Notification permissions handling
   - Bug #2: Real-time status (keine False-Positives)
   - Bug #3: Settings respect (Custom times)
   - Bug #4: Max 6/day enforcement
```

---

## **Fehlerdiagnose**

### Wenn TEST 1 fehlschlägt:
```
❌ Permission request failed

→ Überprüfe:
- Notification Permissions in App-Settings gew ährt?
- Platform ist nicht 'web'?
```

### Wenn TEST 3 fehlschlägt:
```
⚠️ No routines configured

→ Erstelle Routines in der App:
- Gehe zu Routines Tab
- Klicke "+" zum Erstellen
- Speichere die Routine
```

### Wenn TEST 4 fehlschlägt:
```
❌ Real-time status calculation issue

→ Das deutet auf Bug #2 hin:
- Status wird nicht aktuell berechnet
- Überprüfe generateNotificationContent() in notificationManager.ts
```

### Wenn TEST 5 fehlschlägt:
```
❌ Too many notifications (12 > 6)

→ Das deutet auf Bug #4 hin:
- Escalation logic wird nicht korrekt durchgesetzt
- Überprüfe scheduleRoutineNotifications() in notificationManager.ts
- Max sollte 6/day sein
```

### Wenn TEST 6 fehlschlägt:
```
❌ Custom times not respected

→ Das deutet auf Bug #3 hin:
- Settings validation layer funktioniert nicht
- Überprüfe die customTimes Prüfung in scheduleRoutineNotifications()
```

---

## **Manuelle Tests (wenn automatische Tests nicht funktionieren)**

### Test: Notification Permissions
```typescript
// In App Console:
const perms = await Notifications.requestPermissionsAsync();
console.log('Permissions:', perms.status);
```

### Test: Load Routines
```typescript
// In App Console:
const { loadRoutines } = await import('./utils/settingsStorage');
const routines = await loadRoutines();
console.log('Routines:', routines);
```

### Test: Schedule Notifications
```typescript
// In App Console:
const { scheduleRoutineNotifications } = await import('./utils/notificationManager');
await scheduleRoutineNotifications();
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled count:', scheduled.length);
console.log('Times:', scheduled.map(n => {
  const t = n.trigger;
  return `${t.hour}:${t.minute}`;
}));
```

---

## **Wichtig für Production Release**

✅ Wenn alle Tests PASS:
1. Version zu 1.0.3 aktualisieren
2. PRODUCTION_CHECKLIST.md durchgehen
3. APK bauen: `eas build --platform android`
4. Zu Google Play Store submitten

---

## **Dateien für diesen Test**

- `testNotificationsLive.ts` - Main test script
- `utils/notificationManager.ts` - Zu testende Logik
- `utils/settingsStorage.ts` - Settings & Routines laden
- `components/NotificationTestDashboard.tsx` - Optional: UI-basierte Tests

---

**Created:** Oktober 29, 2025  
**Version:** 1.0.2  
**Status:** Ready for Production Testing
