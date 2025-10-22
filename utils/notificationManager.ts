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
  reminderTimes: string[]; // Custom reminder times set by user
  onlyIfIncomplete: boolean; // Only send if routines are incomplete
  escalatingReminders: boolean; // Enable escalating reminder frequency
  maxEscalationLevel: number; // Max reminders per day (1-24)
  customTimes: boolean; // User has set custom times
  streakProtection: boolean; // Extra warnings for streak protection
  smartTiming: boolean; // Context-aware timing optimization
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  globalTime: '07:00',
  perRoutineEnabled: false,
  multipleReminders: true,
  reminderTimes: ['07:00', '14:00', '18:00', '20:00'],
  onlyIfIncomplete: true,
  escalatingReminders: true,
  maxEscalationLevel: 8, // Max 8 reminders per day (every 2-3 hours)
  customTimes: false,
  streakProtection: true,
  smartTiming: true,
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
 * Check if routine was skipped today (user deliberately chose to skip it)
 */
const isRoutineSkippedToday = (routine: any): boolean => {
  // A routine is considered "skipped" when:
  // 1. lastConfirmed is empty (no completion date)
  // 2. streak is 0 (reset by skipping)
  // This indicates the user deliberately chose to skip it today
  return routine.lastConfirmed === '' && routine.streak === 0;
};

/**
 * Check if routine should be excluded from notifications
 * (either completed or deliberately skipped)
 */
const isRoutineHandledToday = (routine: any): boolean => {
  return isRoutineCompletedToday(routine) || isRoutineSkippedToday(routine);
};

/**
 * Get completion status for active routines with streak information
 */
const getCompletionStatus = (routines: any[]) => {
  const activeRoutines = routines.filter(r => r.isActive);
  const completedToday = activeRoutines.filter(isRoutineCompletedToday);
  const skippedToday = activeRoutines.filter(isRoutineSkippedToday);
  const handledToday = activeRoutines.filter(isRoutineHandledToday);
  const incompleteRoutines = activeRoutines.filter(r => !isRoutineHandledToday(r));
  
  // Calculate streak risks (only for truly incomplete routines, not skipped ones)
  const routinesAtRisk = incompleteRoutines.filter(r => (r.streak || 0) >= 3);
  const maxStreakAtRisk = Math.max(...routinesAtRisk.map(r => r.streak || 0), 0);
  
  return {
    total: activeRoutines.length,
    completed: completedToday.length,
    skipped: skippedToday.length,
    handled: handledToday.length, // completed + skipped
    remaining: incompleteRoutines.length, // truly incomplete (not completed, not skipped)
    isAllHandled: activeRoutines.length > 0 && handledToday.length === activeRoutines.length,
    isAllCompleted: activeRoutines.length > 0 && completedToday.length === activeRoutines.length,
    hasActiveRoutines: activeRoutines.length > 0,
    incompleteRoutines,
    routinesAtRisk: routinesAtRisk.length,
    maxStreakAtRisk,
    hasStreakRisk: routinesAtRisk.length > 0
  };
};

/**
 * Calculate escalating reminder times based on how long routines have been pending
 */
const calculateEscalatingTimes = (baseReminders: string[], maxLevel: number): string[] => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Start with base reminders
  const allTimes = [...baseReminders];
  
  // Add escalating reminders only if it's past the first reminder time
  const firstReminderHour = parseInt(baseReminders[0].split(':')[0]);
  
  if (currentHour >= firstReminderHour) {
    // Add hourly reminders up to maxLevel, but not more than once per hour
    const escalatingHours = Math.min(maxLevel - baseReminders.length, 12); // Max 12 additional
    
    for (let i = 1; i <= escalatingHours; i++) {
      const nextHour = (currentHour + i) % 24;
      const timeStr = `${nextHour.toString().padStart(2, '0')}:00`;
      
      // Only add if not too close to existing reminders and within reasonable hours
      if (!allTimes.some(t => Math.abs(parseInt(t.split(':')[0]) - nextHour) < 2) && 
          nextHour >= 7 && nextHour <= 22) {
        allTimes.push(timeStr);
      }
    }
  }
  
  return allTimes.sort();
};

/**
 * Generate smart notification content based on completion status and context
 */
const generateNotificationContent = (
  status: any, 
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  isEscalated: boolean = false,
  escalationLevel: number = 0
) => {
  const { total, completed, skipped, handled, remaining, isAllHandled, hasStreakRisk, maxStreakAtRisk, routinesAtRisk } = status;
  
  // CRITICAL: No notifications if all routines are handled (completed OR skipped) or no active routines
  if (!status.hasActiveRoutines || isAllHandled) {
    return null;
  }
  
  const progressText = `${handled}/${total}`;
  const isUrgent = hasStreakRisk || escalationLevel > 2;
  
  // Streak protection messages (high priority)
  if (hasStreakRisk && Math.random() > 0.3) { // 70% chance for streak messages
    const streakMessages = {
      morning: {
        title: `🔥 ${maxStreakAtRisk}-day streak at risk!`,
        body: `Don't break your amazing ${maxStreakAtRisk}-day streak! ${routinesAtRisk} routine${routinesAtRisk === 1 ? '' : 's'} need${routinesAtRisk === 1 ? 's' : ''} your attention.`
      },
      afternoon: {
        title: `⚠️ Protect your ${maxStreakAtRisk}-day streak!`,
        body: `You've worked hard for ${maxStreakAtRisk} days straight. Complete ${routinesAtRisk} routine${routinesAtRisk === 1 ? '' : 's'} to keep it going!`
      },
      evening: {
        title: `🚨 Streak rescue time!`,
        body: `Your ${maxStreakAtRisk}-day streak is in danger! Just ${routinesAtRisk} routine${routinesAtRisk === 1 ? '' : 's'} left to save it.`
      },
      night: {
        title: `🔥 Last chance for your streak!`,
        body: `Don't let ${maxStreakAtRisk} days of progress slip away! Quick completion needed.`
      }
    };
    return streakMessages[timeOfDay];
  }
  
  // Escalated messages (more urgent)
  if (isEscalated && escalationLevel > 1) {
    const escalatedMessages = {
      morning: {
        title: remaining === 1 ? 'Still 1 routine waiting' : `${remaining} routines still pending`,
        body: escalationLevel > 3 
          ? `Time is ticking! ${remaining} routine${remaining === 1 ? '' : 's'} won't complete themselves.`
          : `Gentle reminder: ${remaining} routine${remaining === 1 ? '' : 's'} waiting for you.`
      },
      afternoon: {
        title: escalationLevel > 3 ? `Don't forget! ${remaining} left` : `Progress check: ${remaining} remaining`,
        body: escalationLevel > 3
          ? `Half the day is gone - time to tackle those ${remaining} routine${remaining === 1 ? '' : 's'}!`
          : `Making progress! ${completed} done, ${remaining} to go.`
      },  
      evening: {
        title: escalationLevel > 4 ? `Urgent: ${remaining} routines!` : `Evening reminder: ${remaining} left`,
        body: escalationLevel > 4
          ? `Day's almost over! These ${remaining} routine${remaining === 1 ? '' : 's'} need immediate attention.`
          : `Winding down? Don't forget ${remaining} routine${remaining === 1 ? '' : 's'} before bed.`
      },
      night: {
        title: 'Final opportunity!',
        body: escalationLevel > 5
          ? `Last call! Complete ${remaining} routine${remaining === 1 ? '' : 's'} before tomorrow.`
          : `Bedtime approaching - ${remaining} routine${remaining === 1 ? '' : 's'} left.`
      }
    };
    return escalatedMessages[timeOfDay];
  }
  
  // Standard messages (polite and encouraging)
  const standardMessages = {
    morning: {
      title: remaining === total ? '🌅 Start your day right!' : `${progressText} handled - Great start!`,
      body: remaining === total 
        ? `Ready to conquer the day? ${total} routine${total === 1 ? '' : 's'} awaiting you!`
        : `Good morning! You've got ${remaining} routine${remaining === 1 ? '' : 's'} remaining.`
    },
    afternoon: {
      title: `${progressText} handled - Keep going! 💪`,
      body: remaining === 1 
        ? `Excellent progress! Just 1 routine left to complete today.`
        : `You're doing great! ${remaining} routine${remaining === 1 ? '' : 's'} remaining.`
    },
    evening: {
      title: remaining === 1 ? '🌆 Last routine of the day!' : `${remaining} routines left`,
      body: remaining === 1
        ? `Almost perfect! Complete your final routine to finish strong.`
        : `Evening check-in: ${remaining} routine${remaining === 1 ? '' : 's'} still awaiting completion.`
    },
    night: {
      title: '🌙 Final call for today!',
      body: remaining === 1
        ? `One last routine before rest - you've got this!`
        : `Last chance to complete ${remaining} routine${remaining === 1 ? '' : 's'} today.`
    }
  };
  
  return standardMessages[timeOfDay];
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
 * Schedule enhanced notifications with smart escalation and validation
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
      console.log('📵 Notification permissions not granted');
      return;
    }

    // Load notification data
    const { routines, settings } = await getNotificationData();
    
    // STRICT VALIDATION: No notifications if disabled
    if (!settings.enabled) {
      console.log('🔕 Notifications disabled by user');
      return;
    }

    // Get completion status
    const status = getCompletionStatus(routines);
    console.log(`📊 Routine status: ${status.total} total, ${status.completed} completed, ${status.skipped} skipped, ${status.remaining} remaining`);
    
    // STRICT VALIDATION: No notifications if no active routines
    if (!status.hasActiveRoutines) {
      console.log('📝 No active routines - skipping notifications');
      return;
    }
    
    // CRITICAL VALIDATION: No notifications if all routines are handled (completed OR skipped)
    if (settings.onlyIfIncomplete && status.isAllHandled) {
      console.log(`✅ All routines handled (${status.completed} completed, ${status.skipped} skipped) - skipping notifications (onlyIfIncomplete=true)`);
      return;
    }

    // Determine base notification times
    let baseNotificationTimes: string[];
    
    if (settings.customTimes && settings.reminderTimes && settings.reminderTimes.length > 0) {
      baseNotificationTimes = settings.reminderTimes;
    } else if (settings.multipleReminders) {
      baseNotificationTimes = ['07:00', '14:00', '18:00', '20:00'];
    } else {
      baseNotificationTimes = [settings.globalTime || '07:00'];
    }

    // Apply escalating reminders if enabled
    let finalNotificationTimes = baseNotificationTimes;
    if (settings.escalatingReminders && status.remaining > 0) {
      finalNotificationTimes = calculateEscalatingTimes(
        baseNotificationTimes, 
        settings.maxEscalationLevel || 8
      );
      console.log(`📈 Escalating enabled: ${baseNotificationTimes.length} base → ${finalNotificationTimes.length} total`);
    }

    // Schedule notifications for each time
    let scheduledCount = 0;
    for (let i = 0; i < finalNotificationTimes.length; i++) {
      const time = finalNotificationTimes[i];
      const { hours, minutes } = parseTime(time);
      
      // Determine time of day for smart content
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hours < 12) timeOfDay = 'morning';
      else if (hours < 17) timeOfDay = 'afternoon';
      else if (hours < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';
      
      // Determine if this is an escalated reminder
      const isEscalated = i >= baseNotificationTimes.length;
      const escalationLevel = isEscalated ? i - baseNotificationTimes.length + 1 : 0;
      
      // Generate smart content
      const content = generateNotificationContent(status, timeOfDay, isEscalated, escalationLevel);
      
      if (content) {
        const notificationId = await scheduleDailyNotification(
          time,
          content.title,
          content.body,
          { 
            routines: status.incompleteRoutines.map((r: any) => ({ 
              id: r.id, 
              name: r.name, 
              streak: r.streak || 0 
            })),
            type: 'routine_reminder',
            timeOfDay,
            isEscalated,
            escalationLevel,
            completionStatus: status,
            scheduledAt: new Date().toISOString()
          }
        );
        
        if (notificationId) {
          scheduledCount++;
        }
      }
    }
    
    console.log(`🔔 Scheduled ${scheduledCount} notifications for ${status.remaining} incomplete routines (${status.completed} completed, ${status.skipped} skipped)`);
    
  } catch (error) {
    console.error('❌ Error scheduling routine notifications:', error);
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
      // Navigation handled by app state management
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
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
