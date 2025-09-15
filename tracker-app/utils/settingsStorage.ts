import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsData {
  debugMode: boolean;
  notificationTime?: string; // Format: "HH:MM"
  notificationEnabled: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  debugMode: false,
  notificationTime: '07:00',
  notificationEnabled: true,
};

// Storage keys
export const STORAGE_KEYS = {
  STREAK: 'streak',
  LAST_CONFIRMED: 'lastConfirmed',
  SETTINGS: 'settings',
} as const;

/**
 * Load settings from AsyncStorage
 */
export const loadSettings = async (): Promise<SettingsData> => {
  try {
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsJson) {
      const savedSettings = JSON.parse(settingsJson);
      return { ...DEFAULT_SETTINGS, ...savedSettings };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to AsyncStorage
 */
export const saveSettings = async (settings: SettingsData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

/**
 * Load current streak from AsyncStorage
 */
export const loadStreak = async (): Promise<number> => {
  try {
    const streakValue = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
    return streakValue ? parseInt(streakValue, 10) : 0;
  } catch (error) {
    console.error('Error loading streak:', error);
    return 0;
  }
};

/**
 * Save streak to AsyncStorage
 */
export const saveStreak = async (streak: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
  } catch (error) {
    console.error('Error saving streak:', error);
    throw error;
  }
};

/**
 * Load last confirmed date from AsyncStorage
 */
export const loadLastConfirmed = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_CONFIRMED);
  } catch (error) {
    console.error('Error loading last confirmed date:', error);
    return null;
  }
};

/**
 * Save last confirmed date to AsyncStorage
 */
export const saveLastConfirmed = async (date: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_CONFIRMED, date);
  } catch (error) {
    console.error('Error saving last confirmed date:', error);
    throw error;
  }
};

/**
 * Clear all data (streak, last confirmed, settings)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.STREAK,
      STORAGE_KEYS.LAST_CONFIRMED,
      STORAGE_KEYS.SETTINGS,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

/**
 * Validate streak input (must be non-negative integer within reasonable range)
 */
export const validateStreakInput = (input: string): { isValid: boolean; value?: number; error?: string } => {
  if (!input.trim()) {
    return { isValid: false, error: 'Please enter a value' };
  }

  const num = parseInt(input, 10);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  if (num < 0) {
    return { isValid: false, error: 'Streak cannot be negative' };
  }
  
  if (num > 9999) {
    return { isValid: false, error: 'Streak cannot exceed 9999 days' };
  }
  
  return { isValid: true, value: num };
};

/**
 * Get all stored data for export/backup
 */
export const exportAllData = async () => {
  try {
    const streak = await loadStreak();
    const lastConfirmed = await loadLastConfirmed();
    const settings = await loadSettings();
    
    return {
      streak,
      lastConfirmed,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

/**
 * Import data from backup
 */
export const importData = async (data: any): Promise<void> => {
  try {
    if (typeof data.streak === 'number' && data.streak >= 0) {
      await saveStreak(data.streak);
    }
    
    if (typeof data.lastConfirmed === 'string') {
      await saveLastConfirmed(data.lastConfirmed);
    }
    
    if (data.settings && typeof data.settings === 'object') {
      await saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};
