import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'streak';

export function StreakWidget() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadStreak();
  }, []);

  async function loadStreak() {
    try {
      const streakValue = await AsyncStorage.getItem(STREAK_KEY);
      const currentStreak = streakValue ? parseInt(streakValue) : 0;
      setStreak(currentStreak);
    } catch (error) {
      console.log('Error loading streak:', error);
    }
  }

  return null; // Widget ist unsichtbar in der App - wird später implementiert
}

// Export update function für spätere Widget-Integration
export async function updateStreakWidget(currentStreak: number) {
  try {
    console.log(`Widget Update: Streak = ${currentStreak}`);
    // TODO: Hier wird später das echte Widget-Update implementiert
    // Für jetzt nur ein Log zum Testen
  } catch (error) {
    console.log('Error updating widget:', error);
  }
}
