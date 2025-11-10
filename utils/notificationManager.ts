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
  const today = new Date().toISOString().slice(0, 10);
  return routine.lastSkipped === today;
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
export const getCompletionStatus = (routines: any[]) => {
  // Filter only active routines (removed frequency check - all active routines should get notifications)
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
    handled: handledToday.length, // only completed for now
    remaining: incompleteRoutines.length, // truly incomplete (not completed)
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
 * 
 * OPTIMIZED: Much less aggressive, better spacing, respects business hours
 */
const calculateEscalatingTimes = (baseReminders: string[], maxLevel: number): string[] => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Start with base reminders
  const allTimes = [...baseReminders];
  
  // Add escalating reminders only if it's past the first reminder time
  const firstReminderHour = parseInt(baseReminders[0].split(':')[0]);
  
  // Only escalate if current time is past first reminder and we have time left in the day
  if (currentHour >= firstReminderHour && currentHour < 22) {
    // Much more conservative escalation:
    // Instead of hourly reminders, add reminders every 2-3 hours
    // Maximum 2-3 additional escalations per day (not 8!)
    
    const escalatingHours: number[] = [];
    
    // Add escalating reminders at strategic times (not more than 2-3)
    if (currentHour < 12 && !baseReminders.some(t => parseInt(t.split(':')[0]) === 11)) {
      escalatingHours.push(11); // Mid-morning escalation
    }
    
    if (currentHour < 15 && !baseReminders.some(t => parseInt(t.split(':')[0]) === 15)) {
      escalatingHours.push(15); // Afternoon escalation
    }
    
    if (currentHour < 19 && !baseReminders.some(t => parseInt(t.split(':')[0]) === 19)) {
      escalatingHours.push(19); // Evening escalation
    }
    
    // Add these strategic escalations
    escalatingHours.forEach(hour => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      if (!allTimes.includes(timeStr)) {
        allTimes.push(timeStr);
      }
    });
  }
  
  return allTimes.sort();
};

/**
 * Generate smart notification content based on REAL-TIME completion status
 * 
 * CRITICAL FIX: Directly uses current status passed in, no caching from yesterday
 */
const generateNotificationContent = (
  status: any, 
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  isEscalated: boolean = false,
  escalationLevel: number = 0
) => {
  const { total, completed, skipped, handled, remaining, isAllHandled, hasStreakRisk, maxStreakAtRisk, routinesAtRisk } = status;
  
  // CRITICAL: No notifications if all routines are handled (completed OR skipped)
  if (!status.hasActiveRoutines || isAllHandled) {
    return null;
  }
  
  // Safety check: Never show "completed" count that's higher than remaining
  const actualCompleted = Math.min(completed, total - remaining);
  const progressText = remaining === 0 ? `${total}/${total}` : `${actualCompleted}/${total}`;
  const isUrgent = hasStreakRisk || escalationLevel > 2;
  
  // =========================================================================
  // PRIORITY 1: STREAK PROTECTION (highest priority)
  // =========================================================================
  
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
  
  // =========================================================================
  // PRIORITY 2: ESCALATED REMINDERS (medium-high priority)
  // =========================================================================
  
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
          : `Making progress! ${actualCompleted} done, ${remaining} to go.`
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
  
  // =========================================================================
  // PRIORITY 3: STANDARD MESSAGES (polite and encouraging)
  // =========================================================================
  
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
 * 
 * REWRITTEN with critical fixes:
 * 1. Respects user settings strictly
 * 2. No escalation when user sets custom single time
 * 3. Real-time status calculation at scheduling time
 * 4. Prevents too many notifications
 * 5. Smart time spacing
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

    // Load notification data - FRESH LOAD
    const { routines, settings } = await getNotificationData();
    
    // ========================================================================
    // STEP 1: VALIDATION LAYER
    // ========================================================================
    
    // STRICT VALIDATION: No notifications if disabled
    if (!settings.enabled) {
      console.log('🔕 Notifications disabled by user');
      return;
    }

    // Get completion status - REAL-TIME calculation
    const status = getCompletionStatus(routines);
    console.log(`📊 Routine status: ${status.total} total, ${status.completed} completed, ${status.skipped} skipped, ${status.remaining} remaining`);
    
    // STRICT VALIDATION: No notifications if no active routines
    if (!status.hasActiveRoutines) {
      console.log('📝 No active routines - skipping notifications');
      return;
    }
    
    // CRITICAL VALIDATION: No notifications if all routines are handled
    if (settings.onlyIfIncomplete && status.isAllHandled) {
      console.log(`✅ All routines handled - skipping notifications`);
      return;
    }

    // ========================================================================
    // STEP 2: DETERMINE NOTIFICATION TIMES (RESPECT USER SETTINGS)
    // ========================================================================
    
    let baseNotificationTimes: string[];
    
    // Priority 1: Use custom times if set
    if (settings.customTimes && settings.reminderTimes && settings.reminderTimes.length > 0) {
      baseNotificationTimes = [...settings.reminderTimes].sort();
      console.log(`📅 Using custom times (${baseNotificationTimes.length}): ${baseNotificationTimes.join(', ')}`);
    } 
    // Priority 2: Use multiple reminders if enabled
    else if (settings.multipleReminders && settings.reminderTimes && settings.reminderTimes.length > 1) {
      baseNotificationTimes = [...settings.reminderTimes].sort();
      console.log(`📅 Using multiple reminders (${baseNotificationTimes.length}): ${baseNotificationTimes.join(', ')}`);
    }
    // Priority 3: Fall back to global time
    else {
      baseNotificationTimes = [settings.globalTime || '07:00'];
      console.log(`📅 Using single global time: ${baseNotificationTimes[0]}`);
    }

    // ========================================================================
    // STEP 3: HANDLE ESCALATION (WITH STRICT RULES)
    // ========================================================================
    
    let finalNotificationTimes = baseNotificationTimes;
    let escalationApplied = false;
    
    // Only apply escalation if ALL these conditions are true:
    // 1. Escalation is enabled
    // 2. There are incomplete routines
    // 3. User did NOT set custom times (only apply to defaults)
    // 4. Multiple reminders mode is active
    if (
      settings.escalatingReminders &&
      settings.multipleReminders &&
      !settings.customTimes &&
      status.remaining > 0 &&
      baseNotificationTimes.length < (settings.maxEscalationLevel || 8)
    ) {
      finalNotificationTimes = calculateEscalatingTimes(
        baseNotificationTimes, 
        settings.maxEscalationLevel || 6 // Reduced from 8 to 6
      );
      escalationApplied = true;
      console.log(`📈 Escalation applied: ${baseNotificationTimes.length} base → ${finalNotificationTimes.length} total`);
    } else {
      const reasons: string[] = [];
      if (!settings.escalatingReminders) reasons.push('escalation disabled');
      if (!settings.multipleReminders) reasons.push('multiple reminders disabled');
      if (settings.customTimes) reasons.push('custom times set');
      if (status.remaining === 0) reasons.push('all complete');
      console.log(`📈 Escalation NOT applied (${reasons.join(', ')})`);
    }

    // ========================================================================
    // STEP 4: DEDUPLICATION & VALIDATION
    // ========================================================================
    
    // Remove duplicates and sort
    const uniqueTimes = Array.from(new Set(finalNotificationTimes)).sort();
    
    // Cap maximum notifications to 6 per day (even with escalation)
    const maxNotificationsPerDay = 6;
    const cappedTimes = uniqueTimes.slice(0, maxNotificationsPerDay);
    
    if (cappedTimes.length < uniqueTimes.length) {
      console.log(`⚠️  Capped notifications: ${uniqueTimes.length} → ${cappedTimes.length} (max ${maxNotificationsPerDay}/day)`);
    }

    // ========================================================================
    // STEP 5: SCHEDULE NOTIFICATIONS
    // ========================================================================
    
    let scheduledCount = 0;
    for (let i = 0; i < cappedTimes.length; i++) {
      const time = cappedTimes[i];
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
    
    console.log(`✅ Scheduled ${scheduledCount} notifications`);
    
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
