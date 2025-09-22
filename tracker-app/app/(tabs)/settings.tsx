import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { scheduleRoutineNotifications, cancelAllNotifications } from '@/utils/notificationManager';
import { STORAGE_KEYS } from '@/utils/settingsStorage';
import { routineStorage } from '@/services/RoutineStorageService';

const SETTINGS_KEY = 'settings';

// Settings texts
const TEXTS = {
  title: 'Settings',
  manualStreakTitle: 'Manual Streak Input',
  manualStreakDescription: 'If you\'ve been following your routine before using this app, you can set your current streak here.',
  currentStreak: 'Current Streak:',
  newStreakLabel: 'Enter new streak:',
  newStreakPlaceholder: '0',
  updateStreakButton: 'Update Streak',
  resetDataTitle: 'Reset Data',
  resetDataDescription: 'This will permanently delete all your progress.',
  resetButton: 'Reset All Data',
  confirmReset: 'Confirm Reset',
  confirmResetMessage: 'Are you sure you want to reset all data? This cannot be undone.',
  cancel: 'Cancel',
  success: 'Success',
  streakUpdated: 'Streak updated successfully!',
  dataReset: 'All data has been reset.',
  invalidInput: 'Invalid Input',
  invalidInputMessage: 'Please enter a valid number between 0 and 9999.',
  debugTitle: 'Debug Settings',
  debugMode: 'Debug Mode',
  debugDescription: 'Show debug information and reset button on main screen.',
  notificationTitle: 'Notifications',
  notificationEnabled: 'Enable Daily Reminders',
  notificationDescription: 'Get daily reminders for your routines.',
  notificationTimeLabel: 'Reminder Time:',
  notificationTimeDescription: 'Time when you want to be reminded (24-hour format)',
  timeInvalid: 'Invalid time format. Please use HH:MM (e.g., 07:30)',
  notificationUpdated: 'Notification settings updated successfully!',
};

interface SettingsData {
  notificationEnabled: boolean;
  notificationTime: string;
}

const defaultSettings: SettingsData = {
  notificationEnabled: true,
  notificationTime: '07:00',
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [notificationTimeInput, setNotificationTimeInput] = useState<string>('07:00');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load settings
      const settingsValue = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsValue) {
        const parsedSettings = JSON.parse(settingsValue);
        const loadedSettings = { ...defaultSettings, ...parsedSettings };
        setSettings(loadedSettings);
        setNotificationTimeInput(loadedSettings.notificationTime);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveSettings = async (newSettings: SettingsData) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetAllData = () => {
    Alert.alert(
      TEXTS.confirmReset,
      TEXTS.confirmResetMessage,
      [
        { text: TEXTS.cancel, style: 'cancel' },
        { 
          text: TEXTS.confirmReset, 
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Nuclear option: Clear ALL AsyncStorage data
              await AsyncStorage.clear();
              
              // 2. Invalidate routine storage cache to force reload
              routineStorage.invalidateCache();
              
              // 3. Reset local state
              setSettings(defaultSettings);
              
              // 4. Cancel any scheduled notifications
              await cancelAllNotifications();
              
              Alert.alert(
                'Reset Complete', 
                'All data has been completely reset. Please close and restart the app to see the changes take effect.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Try to navigate to different tabs to force refresh
                      router.push('/');
                      setTimeout(() => router.push('/(tabs)/routines'), 100);
                      setTimeout(() => router.push('/(tabs)/explore'), 200);
                      setTimeout(() => router.push('/'), 300);
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const toggleNotifications = async (value: boolean) => {
    const newSettings = { ...settings, notificationEnabled: value };
    await saveSettings(newSettings);
    
    if (value) {
      await scheduleRoutineNotifications();
    } else {
      await cancelAllNotifications();
    }
  };

  const updateNotificationTime = async () => {
    if (!validateTimeFormat(notificationTimeInput)) {
      Alert.alert(TEXTS.invalidInput, TEXTS.timeInvalid);
      return;
    }
    
    const newSettings = { ...settings, notificationTime: notificationTimeInput };
    await saveSettings(newSettings);
    
    // Reschedule notifications with new time
    if (settings.notificationEnabled) {
      await scheduleRoutineNotifications();
    }
    
    Alert.alert(TEXTS.success, TEXTS.notificationUpdated);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{TEXTS.title}</Text>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.notificationTitle}</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchLabel}>{TEXTS.notificationEnabled}</Text>
            <Text style={styles.switchDescription}>{TEXTS.notificationDescription}</Text>
          </View>
          <Switch
            value={settings.notificationEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.notificationEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        {settings.notificationEnabled && (
          <View style={styles.timeInputContainer}>
            <Text style={styles.inputLabel}>{TEXTS.notificationTimeLabel}</Text>
            <Text style={styles.description}>{TEXTS.notificationTimeDescription}</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={notificationTimeInput}
                onChangeText={setNotificationTimeInput}
                placeholder="07:00"
                keyboardType="default"
                maxLength={5}
              />
              <TouchableOpacity style={styles.updateTimeButton} onPress={updateNotificationTime}>
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <Text style={styles.description}>Track your progress and unlock rewards for your dedication.</Text>
        
        <TouchableOpacity 
          style={styles.achievementButton} 
          onPress={() => router.push('/achievements')}
        >
          <Text style={styles.achievementButtonText}>View Achievements</Text>
        </TouchableOpacity>
      </View>

      {/* Reset Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.resetDataTitle}</Text>
        <Text style={styles.description}>{TEXTS.resetDataDescription}</Text>
        
        <TouchableOpacity style={styles.resetButton} onPress={resetAllData}>
          <Text style={styles.resetButtonText}>{TEXTS.resetButton}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  resetButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timeInputContainer: {
    marginTop: 15,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  updateTimeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  achievementButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  achievementButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
