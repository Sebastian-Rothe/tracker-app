import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Routine } from '@/types/routine';
import { NotificationScheduleData } from '@/types/notifications';
import { getNotificationData } from './settingsStorage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  globalTime: string; // Format: "HH:MM"
  perRoutineEnabled: boolean;
  multipleReminders: boolean; // Enable multiple daily reminders
  reminderTimes: string[]; // Multiple reminder times ["07:00", "14:00", "18:00", "20:00"]
  onlyIfIncomplete: boolean; // Only send if routines are incomplete
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  globalTime: '07:00',
  perRoutineEnabled: false,
  multipleReminders: true,
  reminderTimes: ['07:00', '14:00', '18:00', '20:00'],
  onlyIfIncomplete: true,
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

/**
 * Parse time string to hours and minutes
 */
const parseTime = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours: hours || 7, minutes: minutes || 0 };
};

/**
 * Calculate seconds until next occurrence of specified time
 */
const getSecondsUntilTime = (hours: number, minutes: number): number => {
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If target time has passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return Math.floor((target.getTime() - now.getTime()) / 1000);
};

/**
 * Check if routine is completed today
 */
const isRoutineCompletedToday = (routine: any): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  return routine.lastConfirmed === today;
};

/**
 * Get completion status for active routines
 */
const getCompletionStatus = (routines: any[]) => {
  const activeRoutines = routines.filter(r => r.isActive);
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
 * Generate smart notification content based on completion status
 */
const generateNotificationContent = (status: any, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night') => {
  const { total, completed, remaining, isAllCompleted } = status;
  
  // Should never happen due to validation, but safety check
  if (!status.hasActiveRoutines || isAllCompleted) {
    return null;
  }
  
  const progressText = `${completed}/${total}`;
  
  const messages = {
    morning: {
      title: remaining === total ? 'Time for your routines!' : `${remaining} routines left`,
      body: remaining === total 
        ? `Ready to start your day? You have ${total} routine${total === 1 ? '' : 's'} to complete.`
        : `Good morning! You have ${remaining} routine${remaining === 1 ? '' : 's'} remaining.`
    },
    afternoon: {
      title: `${progressText} completed - Keep going!`,
      body: remaining === 1 
        ? `Great progress! Just 1 routine left to complete today.`
        : `You're doing well! ${remaining} routines remaining for today.`
    },
    evening: {
      title: remaining === 1 ? 'Last routine of the day!' : `${remaining} routines left`,
      body: remaining === 1
        ? `Almost done! Complete your final routine to finish strong.`
        : `Evening check-in: ${remaining} routines still need your attention.`
    },
    night: {
      title: 'Final call for today!',
      body: remaining === 1
        ? `One last routine before bedtime - you've got this!`
        : `Last chance to complete your ${remaining} remaining routines.`
    }
  };
  
  return messages[timeOfDay];
};

/**
 * Schedule daily notification at specific time
 */
export const scheduleDailyNotification = async (
  time: string,
  title: string,
  body: string,
  data?: any
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { hours, minutes } = parseTime(time);
    const secondsUntil = getSecondsUntilTime(hours, minutes);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: Platform.OS === 'ios' 
        ? {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hours,
            minute: minutes,
            repeats: true,
          } as any
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
            channelId: 'default',
          } as any,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Schedule enhanced notifications for active routines with strict validation
 */
export const scheduleRoutineNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // Cancel existing notifications first
    await cancelAllNotifications();

    // Check permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    // Load notification data
    const { routines, settings } = await getNotificationData();
    
    // STRICT VALIDATION: No notifications if disabled
    if (!settings.enabled) {
      return;
    }

    // Get completion status
    const status = getCompletionStatus(routines);
    
    // STRICT VALIDATION: No notifications if no active routines
    if (!status.hasActiveRoutines) {
      return;
    }
    
    // STRICT VALIDATION: No notifications if all routines completed
    if (status.isAllCompleted) {
      return;
    }

    // Determine notification times with proper undefined checks
    const notificationTimes = settings.multipleReminders && settings.reminderTimes && settings.reminderTimes.length > 0
      ? settings.reminderTimes
      : [settings.time || settings.globalTime || '07:00'];

    // Schedule notifications for each time
    for (const time of notificationTimes) {
      const { hours, minutes } = parseTime(time);
      
      // Determine time of day for smart content
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hours < 12) timeOfDay = 'morning';
      else if (hours < 17) timeOfDay = 'afternoon';
      else if (hours < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';
      
      // Generate smart content
      const content = generateNotificationContent(status, timeOfDay);
      
      if (content) {
        await scheduleDailyNotification(
          time,
          content.title,
          content.body,
          { 
            routines: routines.filter((r: any) => r.isActive && !isRoutineCompletedToday(r)).map((r: any) => ({ id: r.id, name: r.name })),
            type: 'routine_reminder',
            timeOfDay,
            completionStatus: status
          }
        );
      }
    }
    
  } catch (error) {
    console.error('Error scheduling routine notifications:', error);
  }
};

/**
 * Handle notification received while app is in foreground
 */
export const setupNotificationHandlers = () => {
  // Handle notification received while app is open
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    // Notification received while app is open
  });

  // Handle notification tapped/clicked
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'routine_reminder') {
      // TODO: Navigate to tracker screen or show quick action modal
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

/**
 * Get scheduled notifications (for debugging)
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};
