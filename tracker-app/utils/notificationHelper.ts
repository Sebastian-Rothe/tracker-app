/**
 * Enhanced Notification Helper Functions
 * Utility functions for the enhanced notification system
 */

import { cancelAllNotifications } from './notificationManager';
import { getNotificationData } from './settingsStorage';

/**
 * Check if routine is completed today
 */
const isRoutineCompletedToday = (routine: any): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  return routine.lastConfirmed === today;
};

/**
 * Get completion status for active routines (inline to avoid circular dependency)
 */
const getCompletionStatus = (routines: any[]) => {
  const activeRoutines = routines.filter((r: any) => r.isActive);
  const completedToday = activeRoutines.filter(isRoutineCompletedToday);
  
  return {
    total: activeRoutines.length,
    completed: completedToday.length,
    remaining: activeRoutines.length - completedToday.length,
    isAllCompleted: activeRoutines.length > 0 && completedToday.length === activeRoutines.length,
    hasActiveRoutines: activeRoutines.length > 0
  };
};

/**
 * Check if notifications should be cancelled (all routines completed or no active routines)
 * Call this after routine completion to prevent unnecessary notifications
 */
export const checkAndCancelNotificationsIfNeeded = async (): Promise<void> => {
  try {
    // Load current data
    const { routines, settings } = await getNotificationData();
    
    if (!settings.enabled) {
      return;
    }

    // Get completion status using inline function
    const status = getCompletionStatus(routines);
    
    // Cancel notifications if no active routines or all completed
    if (!status.hasActiveRoutines || status.isAllCompleted) {
      await cancelAllNotifications();
      console.log(`Cancelled notifications - ${!status.hasActiveRoutines ? 'No active routines' : 'All routines completed'}`);
    }
  } catch (error) {
    console.error('Error checking notification cancellation:', error);
  }
};