
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { StreakWidget, updateStreakWidget } from '@/components/StreakWidget';
import { loadSettings, loadStreak, loadLastConfirmed, saveStreak, saveLastConfirmed, SettingsData } from '@/utils/settingsStorage';

const STREAK_KEY = 'streak';
const LAST_CONFIRMED_KEY = 'lastConfirmed';

// English text constants
const TEXTS = {
  streakText: (days: number) => `🔥 ${days} days in a row`,
  buttonYes: 'Yes',
  buttonNo: 'No',
  infoText: 'Only one click per day needed – super simple!',
  resetButton: 'Reset Streak',
  lastCheck: 'Last check:',
  alreadyConfirmed: 'Already confirmed!',
  alreadyConfirmedMessage: 'You have already confirmed your routine today.',
  permissionRequired: 'Permission Required',
  permissionMessage: 'Please allow notifications for the app.',
  notificationTitle: 'Daily Routine',
  notificationBody: 'Did you complete your routine today? 🔥',
};

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10); // Zurück auf Tag-genau
}

export default function HomeScreen() {
  const [streak, setStreak] = useState(0);
  const [lastConfirmed, setLastConfirmed] = useState('');
  const [today, setToday] = useState(getTodayString());
  const [settings, setSettings] = useState<SettingsData>({ debugMode: false, notificationEnabled: true });

  useEffect(() => {
    loadData();
    requestNotificationPermission();
    scheduleNotification();
  }, []);

  useEffect(() => {
    checkStreakReset();
  }, [today, lastConfirmed]);

  async function loadData() {
    try {
      const [streakValue, lastDate, settingsData] = await Promise.all([
        loadStreak(),
        loadLastConfirmed(),
        loadSettings(),
      ]);
      
      setStreak(streakValue);
      setLastConfirmed(lastDate || '');
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function requestNotificationPermission() {
    // Skip notifications on web platform
    if (Platform.OS === 'web') {
      return;
    }
    
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(TEXTS.permissionRequired, TEXTS.permissionMessage);
    }
  }

  async function checkStreakReset() {
    if (!lastConfirmed) return;
    if (lastConfirmed !== today) {
      // Check if lastConfirmed is yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (lastConfirmed !== yesterdayStr) {
        await saveStreak(0);
        setStreak(0);
      }
    }
  }

  async function confirmRoutine(didRoutine: boolean) {
    if (didRoutine) {
      if (lastConfirmed === today) {
        Alert.alert(TEXTS.alreadyConfirmed, TEXTS.alreadyConfirmedMessage);
        return;
      }
      const newStreak = streak + 1;
      await saveStreak(newStreak);
      await saveLastConfirmed(today);
      setStreak(newStreak);
      setLastConfirmed(today);
      
      // Update widget
      await updateStreakWidget(newStreak);
    } else {
      await saveStreak(0);
      setStreak(0);
      setLastConfirmed('');
      
      // Update widget
      await updateStreakWidget(0);
    }
  }

  async function scheduleNotification() {
    // Skip notifications on web platform
    if (Platform.OS === 'web') {
      return;
    }
    
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // PRODUCTION MODE: Every 24 hours (daily at 7 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: TEXTS.notificationTitle,
        body: TEXTS.notificationBody,
        data: { routine: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 86400, // 24 hours
        repeats: true,
      },
    });
  }

  return (
    <View style={styles.container}>
      <StreakWidget />
      <Text style={styles.streakText}>{TEXTS.streakText(streak)}</Text>
      <View style={styles.buttonRow}>
        <Button title={TEXTS.buttonYes} onPress={() => confirmRoutine(true)} color="#4CAF50" />
        <Button title={TEXTS.buttonNo} onPress={() => confirmRoutine(false)} color="#F44336" />
      </View>
      <Text style={styles.infoText}>{TEXTS.infoText}</Text>
      {settings.debugMode && (
        <View style={styles.debugRow}>
          <Button title={TEXTS.resetButton} onPress={() => {setStreak(0); AsyncStorage.setItem(STREAK_KEY, '0'); updateStreakWidget(0);}} color="#FF9800" />
        </View>
      )}
      {settings.debugMode && <Text style={styles.debugText}>{TEXTS.lastCheck} {lastConfirmed}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  streakText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  debugRow: {
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});
