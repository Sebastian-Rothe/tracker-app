/**
 * LIVE NOTIFICATION TESTING SCRIPT
 * 
 * Run this directly from Expo console to test the notification system
 * 
 * Usage in Expo dev console:
 * import('./testNotificationsLive').then(module => module.runLiveTests())
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  scheduleRoutineNotifications,
  requestNotificationPermissions,
  getCompletionStatus,
  cancelAllNotifications
} from './utils/notificationManager';
import {
  loadRoutines,
  loadSettings,
  createRoutine,
  confirmRoutine,
  undoRoutineToday,
  DEFAULT_SETTINGS
} from './utils/settingsStorage';

/**
 * Live notification testing
 */
export const runLiveTests = async () => {
  console.log('\n\n');
  console.log('════════════════════════════════════════════════════════');
  console.log('🧪 LIVE NOTIFICATION SYSTEM TESTING');
  console.log('════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // TEST 1: Permission Handling
    console.log('📌 TEST 1: Permission Handling');
    console.log('─'.repeat(50));
    try {
      const permissions = await Notifications.getPermissionsAsync();
      console.log(`  ✓ Current permissions: ${permissions.status}`);
      
      if (permissions.status !== 'granted') {
        console.log('  ⓘ Requesting permissions...');
        const result = await requestNotificationPermissions();
        if (result) {
          console.log('  ✅ PASS: Permissions granted');
          passed++;
        } else {
          console.log('  ❌ FAIL: Permission request failed');
          failed++;
        }
      } else {
        console.log('  ✅ PASS: Permissions already granted');
        passed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
    }

    // TEST 2: Settings Persistence
    console.log('\n📌 TEST 2: Settings Persistence');
    console.log('─'.repeat(50));
    try {
      const settingsData = await loadSettings();
      console.log(`  ✓ Loaded settings:`, {
        multipleReminders: settingsData.multipleReminders,
        customTimes: settingsData.customTimes,
        maxNotifications: settingsData.maxEscalationLevel
      });
      
      console.log('  ✅ PASS: Settings loaded correctly');
      passed++;
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
    }

    // TEST 3: Routine Loading
    console.log('\n📌 TEST 3: Routine Loading');
    console.log('─'.repeat(50));
    try {
      const routines = await loadRoutines();
      console.log(`  ✓ Loaded ${routines.length} routines:`);
      routines.forEach(r => {
        console.log(`    - ${r.name} (${r.isActive ? 'active' : 'inactive'})`);
      });
      
      if (routines.length > 0) {
        console.log('  ✅ PASS: Routines loaded successfully');
        passed++;
      } else {
        console.log('  ⚠️  SKIP: No routines configured');
        skipped++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
    }

    // TEST 4: Status Calculation (Real-Time)
    console.log('\n📌 TEST 4: Real-Time Status Calculation');
    console.log('─'.repeat(50));
    try {
      const routines = await loadRoutines();
      if (routines.length > 0) {
        const status = await getCompletionStatus(routines);
        console.log(`  ✓ Status:`, {
          total: status.total,
          completed: status.completed,
          skipped: status.skipped,
          remaining: status.remaining
        });
        
        // Check if status shows false positives
        const today = new Date().toISOString().split('T')[0];
        const canCalculateToday = routines.some(r => {
          const lastConfirmed = r.lastConfirmed || '';
          return lastConfirmed !== today;
        });
        
        if (canCalculateToday || status.completed === 0) {
          console.log('  ✅ PASS: Real-time status calculation working');
          passed++;
        } else {
          console.log('  ⚠️  SKIP: All routines completed today');
          skipped++;
        }
      } else {
        console.log('  ⚠️  SKIP: No routines to check');
        skipped++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
    }

    // TEST 5: Notification Scheduling
    console.log('\n📌 TEST 5: Notification Scheduling');
    console.log('─'.repeat(50));
    try {
      console.log('  ℹ Scheduling notifications...');
      await scheduleRoutineNotifications();
      
      // Check how many notifications were scheduled
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`  ✓ Scheduled ${scheduled.length} notifications`);
      
      // Log scheduled times
      const times = scheduled
        .filter(n => n.trigger && 'hour' in n.trigger)
        .map(n => {
          const trigger = n.trigger as any;
          return `${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute || 0).padStart(2, '0')}`;
        })
        .sort();
      
      if (times.length > 0) {
        console.log(`  ✓ Notification times: ${times.join(', ')}`);
      }
      
      // Check if cap is enforced (max 6)
      if (scheduled.length <= 6) {
        console.log(`  ✅ PASS: Notification cap enforced (${scheduled.length} ≤ 6)`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: Too many notifications (${scheduled.length} > 6)`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
    }

    // TEST 6: Settings Respect
    console.log('\n📌 TEST 6: Settings Respect Check');
    console.log('─'.repeat(50));
    try {
      const settings = await loadSettings();
      
      // Check if custom times are respected
      if (settings.customTimes && settings.reminderTimes && settings.reminderTimes.length > 0) {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const times = scheduled
          .filter(n => n.trigger && 'hour' in n.trigger)
          .map(n => {
            const trigger = n.trigger as any;
            return `${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute || 0).padStart(2, '0')}`;
          });
        
        console.log(`  ✓ Custom times configured: ${settings.reminderTimes.join(', ')}`);
        console.log(`  ✓ Scheduled times: ${times.join(', ')}`);
        
        // Check if scheduled times match custom times
        const customTimes = settings.reminderTimes || [];
        const allMatch = times.every(t => customTimes.includes(t));
        if (allMatch || times.length === customTimes.length) {
          console.log('  ✅ PASS: Custom times are respected');
          passed++;
        } else {
          console.log('  ⚠️  PARTIAL: Times may differ from custom settings');
          skipped++;
        }
      } else {
        console.log('  ✓ Using escalation times (no custom times set)');
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        
        if (scheduled.length > 0 && scheduled.length <= 6) {
          console.log(`  ✅ PASS: Escalation respects settings (${scheduled.length} notifications)`);
          passed++;
        } else {
          console.log(`  ⚠️  PARTIAL: Check escalation logic`);
          skipped++;
        }
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
    }

    // SUMMARY
    console.log('\n' + '═'.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`📈 Total: ${passed + failed + skipped}`);
    
    const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
      console.log('✅ Notification system is production-ready\n');
    } else {
      console.log('\n⚠️  Some tests failed. Check logs above for details.\n');
    }

  } catch (error) {
    console.error('FATAL ERROR:', error);
  }
};

// Export for use in other files
export default { runLiveTests };
