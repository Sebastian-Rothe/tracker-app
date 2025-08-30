
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STREAK_KEY = 'streak';
const LAST_CONFIRMED_KEY = 'lastConfirmed';

function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [streak, setStreak] = useState(0);
  const [lastConfirmed, setLastConfirmed] = useState('');
  const [today, setToday] = useState(getTodayString());

  useEffect(() => {
    loadStreak();
    requestNotificationPermission();
    scheduleNotification();
  }, []);

  useEffect(() => {
    checkStreakReset();
  }, [today, lastConfirmed]);

  async function loadStreak() {
    const streakValue = await AsyncStorage.getItem(STREAK_KEY);
    const lastDate = await AsyncStorage.getItem(LAST_CONFIRMED_KEY);
    setStreak(streakValue ? parseInt(streakValue) : 0);
    setLastConfirmed(lastDate || '');
  }

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Bitte erlaube Benachrichtigungen für die App.');
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
        await AsyncStorage.setItem(STREAK_KEY, '0');
        setStreak(0);
      }
    }
  }

  async function confirmRoutine(didRoutine: boolean) {
    if (didRoutine) {
      if (lastConfirmed === today) {
        Alert.alert('Schon bestätigt!', 'Du hast heute bereits deine Routine bestätigt.');
        return;
      }
      const newStreak = streak + 1;
      await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
      await AsyncStorage.setItem(LAST_CONFIRMED_KEY, today);
      setStreak(newStreak);
      setLastConfirmed(today);
    } else {
      await AsyncStorage.setItem(STREAK_KEY, '0');
      setStreak(0);
      setLastConfirmed('');
    }
  }

  async function scheduleNotification() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Plane für in 24 Stunden (jeden Tag)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Morgenroutine',
        body: 'Hast du deine Morgenroutine gemacht? 🔥',
        data: { routine: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 86400, // 24 Stunden
        repeats: true,
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.streakText}>🔥 {streak} Tage in Folge</Text>
      <View style={styles.buttonRow}>
        <Button title="Ja" onPress={() => confirmRoutine(true)} color="#4CAF50" />
        <Button title="Nein" onPress={() => confirmRoutine(false)} color="#F44336" />
      </View>
      <Text style={styles.infoText}>Nur ein Klick pro Tag nötig – super einfach!</Text>
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
  },
});
