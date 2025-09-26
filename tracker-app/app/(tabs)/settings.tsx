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
import { loadStreak, saveStreak, loadLastConfirmed, saveLastConfirmed, loadSettings, saveSettings } from '@/utils/settingsStorage';
import { routineStorage } from '@/services/RoutineStorageService';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedNotificationSettings } from '@/components/EnhancedNotificationUI';

const SETTINGS_KEY = 'settings';

// Settings texts
const TEXTS = {
  title: 'Settings',
  themeTitle: 'Appearance',
  themeDescription: 'Choose your preferred app appearance',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  autoMode: 'System Default',
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
  multipleReminders?: boolean;
  onlyIfIncomplete?: boolean;
}

const defaultSettings: SettingsData = {
  notificationEnabled: true,
  notificationTime: '07:00',
  multipleReminders: true,
  onlyIfIncomplete: true,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [notificationTimeInput, setNotificationTimeInput] = useState<string>('07:00');
  const { theme, themeMode, setThemeMode, isDarkMode, isAutoMode } = useTheme();

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
    <ScrollView style={[styles.container, { backgroundColor: theme.Colors.surface.background }]} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: theme.Colors.text.primary }]}>{TEXTS.title}</Text>

      {/* Theme Settings */}
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>{TEXTS.themeTitle}</Text>
        <Text style={[styles.sectionDescription, { color: theme.Colors.text.secondary }]}>{TEXTS.themeDescription}</Text>
        
        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: theme.Colors.surface.border },
              !isAutoMode && themeMode === 'light' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Ionicons name="sunny" size={24} color={theme.Colors.text.primary} />
            <Text style={[styles.themeOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.lightMode}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: theme.Colors.surface.border },
              !isAutoMode && themeMode === 'dark' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Ionicons name="moon" size={24} color={theme.Colors.text.primary} />
            <Text style={[styles.themeOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.darkMode}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: theme.Colors.surface.border },
              isAutoMode && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setThemeMode('auto')}
          >
            <Ionicons name="phone-portrait" size={24} color={theme.Colors.text.primary} />
            <Text style={[styles.themeOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.autoMode}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>{TEXTS.notificationTitle}</Text>
        
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

        {settings.notificationEnabled && !settings.multipleReminders && (
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

      {/* Enhanced Notification Settings */}
      {settings.notificationEnabled && (
        <EnhancedNotificationSettings 
          settings={settings} 
          setSettings={setSettings} 
        />
      )}

      {/* Reset Data */}
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>{TEXTS.resetDataTitle}</Text>
        <Text style={[styles.description, { color: theme.Colors.text.secondary }]}>{TEXTS.resetDataDescription}</Text>
        
        <TouchableOpacity style={[styles.resetButton, { backgroundColor: theme.Colors.error[500] }]} onPress={resetAllData}>
          <Text style={[styles.resetButtonText, { color: theme.Colors.text.inverse }]}>{TEXTS.resetButton}</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    // backgroundColor now set dynamically via theme
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color now set dynamically via theme
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
  // Achievement styles removed
  // Theme-related styles
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  themeOption: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
