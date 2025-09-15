import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Routine } from '@/types/routine';
import { loadRoutines, loadSettings } from './settingsStorage';

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
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  globalTime: '07:00',
  perRoutineEnabled: false,
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

    console.log('Notification permission status:', finalStatus);
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
    console.log('All notifications cancelled');
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

    console.log(`Scheduling notification for ${hours}:${String(minutes).padStart(2, '0')} (in ${secondsUntil} seconds)`);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    console.log('Notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Schedule notifications for all active routines
 */
export const scheduleRoutineNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  try {
    // Cancel existing notifications
    await cancelAllNotifications();

    // Check permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    // Load settings and routines
    const settings = await loadSettings();
    const routines = await loadRoutines();
    const activeRoutines = routines.filter(r => r.isActive);

    if (!settings.notificationEnabled || activeRoutines.length === 0) {
      console.log('Notifications disabled or no active routines');
      return;
    }

    // Prepare notification content
    const routineNames = activeRoutines.map(r => r.name).join(', ');
    const title = activeRoutines.length === 1 
      ? `Time for your routine!`
      : `Time for your routines!`;
    
    const body = activeRoutines.length === 1
      ? `Don't forget: ${routineNames}`
      : `Don't forget: ${routineNames}`;

    // Schedule notification
    const notificationTime = settings.notificationTime || '07:00';
    await scheduleDailyNotification(
      notificationTime,
      title,
      body,
      { 
        routines: activeRoutines.map(r => ({ id: r.id, name: r.name })),
        type: 'routine_reminder'
      }
    );

    console.log(`Scheduled notification for ${activeRoutines.length} routine(s) at ${notificationTime}`);
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
    console.log('Notification received while app is open:', notification);
  });

  // Handle notification tapped/clicked
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    const data = response.notification.request.content.data;
    
    if (data?.type === 'routine_reminder') {
      // TODO: Navigate to tracker screen or show quick action modal
      console.log('Routine reminder notification tapped');
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
    console.log('Scheduled notifications:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};
