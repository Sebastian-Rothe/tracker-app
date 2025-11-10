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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { scheduleRoutineNotifications, cancelAllNotifications } from '@/utils/notificationManager';
import {  } from '@/utils/settingsStorage';
import { routineStorage } from '@/services/RoutineStorageService';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AdvancedNotificationSettings from '../../components/AdvancedNotificationSettings';
import { WallpaperType } from '@/constants/Theme';
import { WallpaperBackground } from '@/components/WallpaperBackground';

const SETTINGS_KEY = 'settings';

// Settings texts
const TEXTS = {
  title: 'Settings',
  themeTitle: 'Appearance',
  themeDescription: 'Choose your preferred app appearance',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  autoMode: 'System Default',
  wallpaperTitle: 'Background Style',
  wallpaperDescription: 'Choose your background design',
  wallpaperNone: 'None',
  wallpaperDeepBlue: 'Deep Blue',
  wallpaperSunset: 'Sunset Orange', 
  wallpaperForest: 'Forest Teal',
  wallpaperPurple: 'Royal Purple',
  wallpaperNavy: 'Midnight Navy',
  wallpaperLightSky: 'Light Sky',
  wallpaperSoftMint: 'Soft Mint',
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
  aboutTitle: 'About Routine Tracker',
  aboutDescription: 'A free, privacy-focused habit tracker app. Your data stays on your device.',
  version: 'Version 1.0.0',
  developer: 'Developed by Sebastian Rothe',
  privacyPolicy: 'Privacy Policy',
  impressum: 'Legal Notice (Impressum)',
  support: 'Support & Contact',
  openSource: 'Open Source',
  linkError: 'Could not open link',
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
  const { theme, themeMode, setThemeMode, isDarkMode, isAutoMode, wallpaper, setWallpaper } = useTheme();

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

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(TEXTS.linkError, `Cannot open URL: ${url}`);
      }
    } catch (error) {
      Alert.alert(TEXTS.linkError, 'An error occurred while opening the link.');
      console.error('Error opening link:', error);
    }
  };

  return (
    <WallpaperBackground style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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

      {/* Wallpaper Settings */}
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperTitle}</Text>
        <Text style={[styles.sectionDescription, { color: theme.Colors.text.secondary }]}>{TEXTS.wallpaperDescription}</Text>
        
        <View style={styles.wallpaperGrid}>
          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'none' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('none')}
          >
            <View style={[styles.wallpaperPreview, styles.nonePreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperNone}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'deep-blue' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('deep-blue')}
          >
            <View style={[styles.wallpaperPreview, styles.deepBluePreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperDeepBlue}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'sunset-orange' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('sunset-orange')}
          >
            <View style={[styles.wallpaperPreview, styles.sunsetPreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperSunset}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'forest-teal' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('forest-teal')}
          >
            <View style={[styles.wallpaperPreview, styles.forestPreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperForest}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'royal-purple' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('royal-purple')}
          >
            <View style={[styles.wallpaperPreview, styles.purplePreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperPurple}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'midnight-navy' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('midnight-navy')}
          >
            <View style={[styles.wallpaperPreview, styles.navyPreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperNavy}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'light-sky' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('light-sky')}
          >
            <View style={[styles.wallpaperPreview, styles.lightSkyPreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperLightSky}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wallpaperOption,
              { borderColor: theme.Colors.surface.border },
              wallpaper === 'soft-mint' && { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[500] }
            ]}
            onPress={() => setWallpaper('soft-mint')}
          >
            <View style={[styles.wallpaperPreview, styles.softMintPreview]} />
            <Text style={[styles.wallpaperOptionText, { color: theme.Colors.text.primary }]}>{TEXTS.wallpaperSoftMint}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Notification Settings */}
      <AdvancedNotificationSettings />

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>{TEXTS.aboutTitle}</Text>
        <Text style={[styles.description, { color: theme.Colors.text.secondary }]}>{TEXTS.aboutDescription}</Text>
        
        <View style={styles.aboutInfo}>
          <Text style={[styles.aboutText, { color: theme.Colors.text.secondary }]}>{TEXTS.version}</Text>
          <Text style={[styles.aboutText, { color: theme.Colors.text.secondary }]}>{TEXTS.developer}</Text>
        </View>

        <View style={styles.linkButtons}>
          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: theme.Colors.surface.border }]}
            onPress={() => openLink('https://tracker-app-webpage.netlify.app/datenschutz.html')}
          >
            <Ionicons name="shield-checkmark" size={20} color={theme.Colors.primary[600]} />
            <Text style={[styles.linkButtonText, { color: theme.Colors.primary[600] }]}>{TEXTS.privacyPolicy}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: theme.Colors.surface.border }]}
            onPress={() => openLink('https://tracker-app-webpage.netlify.app/impressum.html')}
          >
            <Ionicons name="document-text" size={20} color={theme.Colors.primary[600]} />
            <Text style={[styles.linkButtonText, { color: theme.Colors.primary[600] }]}>{TEXTS.impressum}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: theme.Colors.surface.border }]}
            onPress={() => openLink('mailto:mail@sebastian-rothe.com?subject=Routine%20Tracker%20Support')}
          >
            <Ionicons name="mail" size={20} color={theme.Colors.primary[600]} />
            <Text style={[styles.linkButtonText, { color: theme.Colors.primary[600] }]}>{TEXTS.support}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: theme.Colors.surface.border }]}
            onPress={() => openLink('https://github.com/Sebastian-Rothe/tracker-app')}
          >
            <Ionicons name="logo-github" size={20} color={theme.Colors.primary[600]} />
            <Text style={[styles.linkButtonText, { color: theme.Colors.primary[600] }]}>{TEXTS.openSource}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset Data */}
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>{TEXTS.resetDataTitle}</Text>
        <Text style={[styles.description, { color: theme.Colors.text.secondary }]}>{TEXTS.resetDataDescription}</Text>
        
        <TouchableOpacity style={[styles.resetButton, { backgroundColor: theme.Colors.error[500] }]} onPress={resetAllData}>
          <Text style={[styles.resetButtonText, { color: theme.Colors.text.inverse }]}>{TEXTS.resetButton}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </WallpaperBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 4,
    // color now set dynamically via theme
  },
  switchDescription: {
    fontSize: 14,
    lineHeight: 18,
    // color now set dynamically via theme
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
  // About section styles
  aboutInfo: {
    marginBottom: 20,
    gap: 4,
  },
  aboutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkButtons: {
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    gap: 12,
    backgroundColor: 'transparent',
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Wallpaper styles
  wallpaperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  wallpaperOption: {
    width: '48%',
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  wallpaperPreview: {
    width: 60,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
  },
  wallpaperOptionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Preview styles for distinct colorful wallpapers
  nonePreview: {
    backgroundColor: '#f1f5f9', // Light gray for "no wallpaper"
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  deepBluePreview: {
    backgroundColor: '#1e3a8a', // Deep blue gradient preview
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  sunsetPreview: {
    backgroundColor: '#c2410c', // Burnt orange sunset preview
    borderWidth: 1,
    borderColor: '#ea580c',
  },
  forestPreview: {
    backgroundColor: '#0f766e', // Deep teal forest preview
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  purplePreview: {
    backgroundColor: '#7c3aed', // Rich purple preview
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  navyPreview: {
    backgroundColor: '#1e40af', // Navy midnight preview
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  lightSkyPreview: {
    backgroundColor: '#e0f2fe', // Very light sky blue
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 8,
  },
  softMintPreview: {
    backgroundColor: '#f0fdf4', // Very light mint green
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
  },
});
