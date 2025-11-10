import AsyncStorage from '@react-native-async-storage/async-storage';
import { routineStorage } from '../services/RoutineStorageService';
import { 
  Routine, 
  RoutineState, 
  CreateRoutineRequest, 
  UpdateRoutineRequest,
  RoutineConfirmation,
  ROUTINE_COLORS,
  ROUTINE_ICONS 
} from '../types/routine';
import { NotificationScheduleData } from '../types/notifications';
import { saveHistoryEntry } from './historyManager';

export interface SettingsData {
  debugMode: boolean;
  notificationTime?: string; // Format: "HH:MM"
  notificationEnabled: boolean;
  multipleReminders?: boolean; // Enable multiple daily reminders
  reminderTimes?: string[]; // Multiple reminder times ["07:00", "14:00", "18:00", "20:00"]
  onlyIfIncomplete?: boolean; // Only send if routines are incomplete
  escalatingReminders?: boolean; // Enable escalating reminder frequency
  maxEscalationLevel?: number; // Max reminders per day (1-24)
  customTimes?: boolean; // User has set custom times
  streakProtection?: boolean; // Extra warnings for streak protection
  smartTiming?: boolean; // Context-aware timing optimization
}

export const DEFAULT_SETTINGS: SettingsData = {
  debugMode: false,
  notificationTime: '07:00',
  notificationEnabled: true,
  multipleReminders: true, // Enable enhanced notifications by default
  reminderTimes: ['07:00', '14:00', '18:00', '20:00'], // Default reminder times
  onlyIfIncomplete: true, // Smart notifications by default
  escalatingReminders: true,
  maxEscalationLevel: 8, // Max 8 reminders per day (every 2-3 hours)
  customTimes: false,
  streakProtection: true,
  smartTiming: true,
};

// Storage keys
export const STORAGE_KEYS = {
  STREAK: 'streak', // Legacy - will be migrated
  LAST_CONFIRMED: 'lastConfirmed', // Legacy - will be migrated
  SETTINGS: 'settings',
  ROUTINES: 'routines', // New multi-routine storage
  ROUTINE_STATE: 'routineState', // Overall routine state
} as const;

/**
 * Load settings from AsyncStorage
 * CRITICAL: onlyIfIncomplete is ALWAYS true (no user toggle)
 */
export const loadSettings = async (): Promise<SettingsData> => {
  try {
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsJson) {
      const savedSettings = JSON.parse(settingsJson);
      // ENFORCE: onlyIfIncomplete must ALWAYS be true
      return { ...DEFAULT_SETTINGS, ...savedSettings, onlyIfIncomplete: true };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to AsyncStorage
 * CRITICAL: onlyIfIncomplete is ALWAYS forced to true
 */
export const saveSettings = async (settings: SettingsData): Promise<void> => {
  try {
    // ENFORCE: onlyIfIncomplete must ALWAYS be true
    const enforcedSettings = { ...settings, onlyIfIncomplete: true };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(enforcedSettings));
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
export const importData = async (data: unknown): Promise<void> => {
  try {
    // Type guard for import data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data format');
    }
    
    const importData = data as Record<string, unknown>;
    
    if (typeof importData.streak === 'number' && importData.streak >= 0) {
      await saveStreak(importData.streak);
    }

    if (typeof importData.lastConfirmed === 'string') {
      await saveLastConfirmed(importData.lastConfirmed);
    }

    if (importData.settings && typeof importData.settings === 'object') {
      await saveSettings({ ...DEFAULT_SETTINGS, ...importData.settings as Partial<SettingsData> });
    }
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};

// ============================================================================
// MULTI-ROUTINE STORAGE SYSTEM - Phase 3
// ============================================================================

/**
 * Generate unique ID for new routines
 */
const generateRoutineId = (): string => {
  return `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayString = (): string => {
  return new Date().toISOString().slice(0, 10);
};

/**
 * Load all routines from AsyncStorage
 */
export const loadRoutines = async (): Promise<Routine[]> => {
  const routines = await routineStorage.getRoutines();
  
  // Migration: Add lastSkipped field to existing routines that don't have it
  let needsMigration = false;
  const migratedRoutines = routines.map((routine: any) => {
    if (!('lastSkipped' in routine)) {
      needsMigration = true;
      return {
        ...routine,
        lastSkipped: null, // Initialize skip tracking for existing routines
      } as Routine;
    }
    return routine as Routine;
  });
  
  // Save migrated data if needed
  if (needsMigration) {
    await routineStorage.saveRoutines(migratedRoutines);
  }
  
  return migratedRoutines;
};

/**
 * Save all routines to AsyncStorage
 */
export const saveRoutines = async (routines: Routine[]): Promise<void> => {
  try {
    await routineStorage.saveRoutines(routines);
    
    // Note: Notifications should be rescheduled externally to avoid circular dependencies
    // Call scheduleRoutineNotifications() from the component after saving routines
  } catch (error) {
    console.error('Error saving routines:', error);
    throw error;
  }
};

/**
 * Create a new routine
 */
export const createRoutine = async (request: CreateRoutineRequest): Promise<Routine> => {
  try {
    const routines = await loadRoutines();
    
    const newRoutine: Routine = {
      id: generateRoutineId(),
      name: request.name.trim(),
      description: request.description?.trim(),
      streak: request.initialStreak || 0,
      lastConfirmed: '',
      lastSkipped: '', // Initialize skip tracking
      createdAt: new Date().toISOString(),
      color: request.color,
      icon: request.icon,
      isActive: true,
      reminderTime: request.reminderTime,
      frequency: { type: 'daily' }, // Default to daily frequency
    };
    
    const updatedRoutines = [...routines, newRoutine];
    await saveRoutines(updatedRoutines);
    
    // Note: Notifications should be rescheduled externally to avoid circular dependencies
    // Call scheduleRoutineNotifications() from the component after creating routine
    
    return newRoutine;
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
};

/**
 * Update an existing routine
 */
export const updateRoutine = async (request: UpdateRoutineRequest): Promise<Routine | null> => {
  try {
    const routines = await loadRoutines();
    const routineIndex = routines.findIndex(r => r.id === request.id);
    
    if (routineIndex === -1) {
      throw new Error(`Routine with id ${request.id} not found`);
    }
    
    const updatedRoutine: Routine = {
      ...routines[routineIndex],
      ...(request.name !== undefined && { name: request.name.trim() }),
      ...(request.description !== undefined && { description: request.description?.trim() }),
      ...(request.color !== undefined && { color: request.color }),
      ...(request.icon !== undefined && { icon: request.icon }),
      ...(request.isActive !== undefined && { isActive: request.isActive }),
      ...(request.reminderTime !== undefined && { reminderTime: request.reminderTime }),
    };
    
    routines[routineIndex] = updatedRoutine;
    await saveRoutines(routines);
    
    // Note: Notifications should be rescheduled externally to avoid circular dependencies
    // Call scheduleRoutineNotifications() from the component after updating routine
    
    return updatedRoutine;
  } catch (error) {
    console.error('Error updating routine:', error);
    throw error;
  }
};

/**
 * Delete a routine
 */
export const deleteRoutine = async (routineId: string): Promise<boolean> => {
  try {
    const routines = await loadRoutines();
    const filteredRoutines = routines.filter(r => r.id !== routineId);
    
    if (filteredRoutines.length === routines.length) {
      console.error('Routine not found for deletion:', routineId);
      throw new Error(`Routine with id ${routineId} not found`);
    }
    
    await saveRoutines(filteredRoutines);
    
    // Note: Notifications should be rescheduled externally to avoid circular dependencies
    // Call scheduleRoutineNotifications() from the component after deleting routine
    console.log('Routine deleted successfully - notifications should be rescheduled externally');
    
    return true;
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
};

/**
 * Confirm routine completion for today
 */
export const confirmRoutine = async (routineId: string, confirmed: boolean): Promise<Routine | null> => {
  try {
    const routines = await loadRoutines();
    
    const routineIndex = routines.findIndex(r => r.id === routineId);
    
    if (routineIndex === -1) {
      console.error('Routine not found:', routineId);
      throw new Error(`Routine with id ${routineId} not found`);
    }
    
    const routine = routines[routineIndex];
    const today = getTodayString();
    
    // Store the streak before modification for history
    const streakBeforeChange = routine.streak;
    
    // Check if already confirmed today
    if (routine.lastConfirmed === today) {
      // Don't throw error, just return current routine
      return routine;
    }
    
    // Check if already skipped today
    if (!confirmed && routine.lastSkipped === today) {
      // Already skipped today, just return current routine
      return routine;
    }
    
    if (confirmed) {
      // Increase streak if confirmed (only increase if not already confirmed today)
      if (routine.lastConfirmed !== today) {
        // Check if this is the first completion (lastConfirmed is empty)
        if (!routine.lastConfirmed || routine.lastConfirmed === '') {
          // First completion - keep initial streak and increment by 1
          routine.streak = (routine.streak || 0) + 1;
        } else {
          // Not first completion - check if yesterday was completed
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = yesterday.toISOString().slice(0, 10);
          
          if (routine.lastConfirmed === yesterdayString) {
            // Consecutive day - increment streak
            routine.streak += 1;
          } else {
            // Not consecutive - start new streak at 1
            routine.streak = 1;
          }
        }
      }
      routine.lastConfirmed = today;
      // Clear skip status when confirmed
      routine.lastSkipped = '';
      routine.streakBeforeSkip = undefined; // Clear streak backup
    } else {
      // SKIP: Save current streak for undo, then reset to 0
      routine.streakBeforeSkip = routine.streak; // Save for undo!
      routine.streak = 0;
      routine.lastSkipped = today;
      // Clear confirmation status when skipped
      routine.lastConfirmed = '';
    }
    
    routines[routineIndex] = routine;
    await saveRoutines(routines);
    
    // Save history entry
    try {
      await saveHistoryEntry(routine, confirmed, streakBeforeChange);
    } catch (historyError) {
      console.warn('Failed to save history entry:', historyError);
      // Don't fail the main operation if history saving fails
    }
    
    return routine;
  } catch (error) {
    console.error('Error confirming routine:', error);
    throw error;
  }
};

/**
 * Undo routine completion for today (if completed today)
 */
export const undoRoutineToday = async (routineId: string): Promise<Routine | null> => {
  try {
    const routines = await loadRoutines();
    
    const routineIndex = routines.findIndex(r => r.id === routineId);
    
    if (routineIndex === -1) {
      console.error('Routine not found:', routineId);
      throw new Error(`Routine with id ${routineId} not found`);
    }
    
    const routine = routines[routineIndex];
    const today = getTodayString();
    
    // Check if routine was completed today
    if (routine.lastConfirmed !== today) {
      // Cannot undo - not completed today
      return null;
    }
    
    // Store the streak before modification for history
    const streakBeforeChange = routine.streak;
    
    // Undo today's completion
    routine.streak = Math.max(0, routine.streak - 1); // Decrease streak by 1, but don't go below 0
    routine.lastConfirmed = ''; // Clear last confirmed date
    
    routines[routineIndex] = routine;
    await saveRoutines(routines);
    
    // Save history entry for the undo action
    try {
      await saveHistoryEntry(routine, false, streakBeforeChange);
    } catch (historyError) {
      console.warn('Failed to save undo history entry:', historyError);
      // Don't fail the main operation if history saving fails
    }
    
    return routine;
  } catch (error) {
    console.error('Error undoing routine completion:', error);
    throw error;
  }
};

/**
 * Update routine state summary
 */
const updateRoutineState = async (routines: Routine[]): Promise<void> => {
  try {
    const activeRoutines = routines.filter(r => r.isActive);
    // Find the longest streak instead of summing all streaks
    const longestStreak = activeRoutines.length > 0 
      ? Math.max(...activeRoutines.map(r => r.streak))
      : 0;
    
    const routineState: RoutineState = {
      routines: routines,
      activeRoutineCount: activeRoutines.length,
      totalStreakDays: longestStreak, // Now represents the longest streak, not total
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTINE_STATE, JSON.stringify(routineState));
  } catch (error) {
    console.error('Error updating routine state:', error);
  }
};

/**
 * Force recalculation of routine state (useful after logic changes)
 */
export const recalculateRoutineState = async (): Promise<void> => {
  try {
    const routines = await loadRoutines();
    await updateRoutineState(routines);
    // Also clear the stored routine state to force regeneration
    await AsyncStorage.removeItem(STORAGE_KEYS.ROUTINE_STATE);
  } catch (error) {
    console.error('Error recalculating routine state:', error);
  }
};

/**
 * Load routine state summary
 */
export const loadRoutineState = async (): Promise<RoutineState> => {
  return await routineStorage.getRoutineState();
};

/**
 * Reset all routine streaks (for testing/debugging)
 */
export const resetAllRoutineStreaks = async (): Promise<void> => {
  try {
    const routines = await loadRoutines();
    const resetRoutines = routines.map(routine => ({
      ...routine,
      streak: 0,
      lastConfirmed: '',
    }));
    
    await saveRoutines(resetRoutines);
  } catch (error) {
    console.error('Error resetting routine streaks:', error);
    throw error;
  }
};

/**
 * Check and update streaks based on missed days
 */
export const checkAndUpdateStreaks = async (): Promise<void> => {
  try {
    const routines = await loadRoutines();
    const today = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    
    let hasChanges = false;
    const updatedRoutines = routines.map(routine => {
      if (routine.lastConfirmed && routine.lastConfirmed !== today && routine.lastConfirmed !== yesterdayStr) {
        // Routine was last confirmed more than yesterday - reset streak
        hasChanges = true;
        return {
          ...routine,
          streak: 0,
          lastConfirmed: '',
        };
      }
      return routine;
    });
    
    if (hasChanges) {
      await saveRoutines(updatedRoutines);
    }
  } catch (error) {
    console.error('Error checking and updating streaks:', error);
  }
};

/**
 * Get routine by ID
 */
export const getRoutineById = async (routineId: string): Promise<Routine | null> => {
  try {
    const routines = await loadRoutines();
    return routines.find(r => r.id === routineId) || null;
  } catch (error) {
    console.error('Error getting routine by ID:', error);
    return null;
  }
};

/**
 * Validate routine creation data
 */
export const validateRoutineCreation = (request: CreateRoutineRequest): { isValid: boolean; error?: string } => {
  if (!request.name || request.name.trim().length === 0) {
    return { isValid: false, error: 'Routine name is required' };
  }
  
  if (request.name.trim().length > 50) {
    return { isValid: false, error: 'Routine name must be 50 characters or less' };
  }
  
  if (request.description && request.description.length > 200) {
    return { isValid: false, error: 'Description must be 200 characters or less' };
  }
  
  if (!ROUTINE_COLORS.includes(request.color as any)) {
    return { isValid: false, error: 'Invalid color selection' };
  }
  
  if (!ROUTINE_ICONS.includes(request.icon as any)) {
    return { isValid: false, error: 'Invalid icon selection' };
  }
  
  return { isValid: true };
};

// ============================================================================
// DATA MIGRATION SYSTEM - Legacy to Multi-Routine
// ============================================================================

/**
 * Check if legacy data exists and migrate to new multi-routine system
 */
export const migrateFromLegacyData = async (): Promise<boolean> => {
  try {
    // Check if routines already exist (migration already done)
    const existingRoutines = await loadRoutines();
    if (existingRoutines.length > 0) {
      return false; // No migration needed
    }

    // Load legacy data
    const [legacyStreak, legacyLastConfirmed]: [number, string | null] = await Promise.all([
      loadStreak(),
      loadLastConfirmed(),
    ]);

    // Only migrate if there's meaningful legacy data
    if (legacyStreak > 0 || legacyLastConfirmed) {
      // Create default routine from legacy data
      const legacyRoutine: Routine = {
        id: generateRoutineId(),
        name: 'Morning Routine', // Default name from legacy app
        description: 'Migrated from your previous routine tracker',
        streak: legacyStreak,
        lastConfirmed: legacyLastConfirmed || '',
        lastSkipped: '', // Initialize skip tracking
        createdAt: new Date().toISOString(),
        color: ROUTINE_COLORS[0], // Default color
        icon: ROUTINE_ICONS[0], // Default icon (💪)
        isActive: true,
        reminderTime: '07:00', // Default reminder time
        frequency: { type: 'daily' }, // Default to daily frequency
      };

      // Save migrated routine
      await saveRoutines([legacyRoutine]);
      
      return true; // Migration completed
    }

    return false; // No migration needed
  } catch (error) {
    console.error('Error during migration:', error);
    return false; // Migration failed
  }
};

/**
 * Clear legacy data after successful migration
 */
export const clearLegacyData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.STREAK,
      STORAGE_KEYS.LAST_CONFIRMED,
    ]);
    console.log('Legacy data cleared successfully');
  } catch (error) {
    console.error('Error clearing legacy data:', error);
    // Don't throw - this is not critical
  }
};

/**
 * Auto-migrate on app startup (call this when app loads)
 */
export const performAutoMigration = async (): Promise<void> => {
  try {
    const migrationCompleted = await migrateFromLegacyData();
    
    if (migrationCompleted) {
      // Optional: Clear legacy data after successful migration
      // Uncomment if you want to clean up old data
      // await clearLegacyData();
      
      console.log('Auto-migration completed successfully');
    }
  } catch (error) {
    console.error('Auto-migration failed:', error);
    // Don't throw - app should continue working even if migration fails
  }
};

/**
 * Get notification data (breaks circular dependency)
 */
export const getNotificationData = async (): Promise<NotificationScheduleData> => {
  const routines = await loadRoutines();
  const settings = await loadSettings();
  
  return {
    routines,
    settings: {
      enabled: settings.notificationEnabled,
      time: settings.notificationTime,
      globalTime: settings.notificationTime, // Backward compatibility
      multipleReminders: settings.multipleReminders ?? true, // Default to enhanced notifications
      reminderTimes: settings.reminderTimes ?? ['07:00', '14:00', '18:00', '20:00'], // Default times
      onlyIfIncomplete: settings.onlyIfIncomplete ?? true, // Default to smart notifications
      customTimes: settings.customTimes ?? false, // ✅ Custom times flag
      escalatingReminders: settings.escalatingReminders ?? true, // ✅ Escalating reminders
      maxEscalationLevel: settings.maxEscalationLevel ?? 8, // ✅ Max escalation level
    },
  };
};
