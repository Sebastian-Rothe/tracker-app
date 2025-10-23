// Debug version of notification testing
// Add this to your main screen to test notifications

import { scheduleRoutineNotifications, requestNotificationPermissions } from '@/utils/notificationManager';
import * as Notifications from 'expo-notifications';

export const testNotifications = async () => {
  console.log('🔍 Testing notifications...');
  
  // 1. Check permissions
  const hasPermission = await requestNotificationPermissions();
  console.log('📱 Has notification permission:', hasPermission);
  
  if (!hasPermission) {
    console.log('❌ No notification permissions granted');
    return;
  }
  
  // 2. Schedule a test notification for 5 seconds from now
  const testNotification = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧪 Test Notification',
      body: 'If you see this, notifications are working!',
      data: { test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
  
  console.log('🧪 Test notification scheduled:', testNotification);
  
  // 3. Test the routine notification scheduling
  try {
    await scheduleRoutineNotifications();
    console.log('✅ Routine notifications scheduled successfully');
  } catch (error) {
    console.error('❌ Error scheduling routine notifications:', error);
  }
  
  // 4. Check scheduled notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('📋 All scheduled notifications:', scheduled.length);
  scheduled.forEach((notif, index) => {
    console.log(`  ${index + 1}. ${notif.content.title} - ${JSON.stringify(notif.trigger)}`);
  });
  
  return scheduled.length;
};

// Call this function from a button in your app to test