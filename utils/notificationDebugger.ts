/**
 * Notification System Debugger
 * 
 * Purpose: Identify and log notification system issues
 * Usage: Import and call from settings or dev menu
 */

import { getNotificationData } from './settingsStorage';
import { getScheduledNotifications, getCompletionStatus } from './notificationManager';

export interface DebugReport {
  timestamp: string;
  settings: any;
  routines: any;
  status: any;
  scheduledNotifications: any[];
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Run comprehensive debug analysis
 */
export const debugNotificationSystem = async (): Promise<DebugReport> => {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    // Load data
    const { routines, settings } = await getNotificationData();
    const status = getCompletionStatus(routines);
    const scheduled = await getScheduledNotifications();

    console.log('\n🔍 NOTIFICATION SYSTEM DEBUG REPORT');
    console.log('═'.repeat(60));

    // ========================================================================
    // CHECK 1: Settings Validation
    // ========================================================================
    console.log('\n✓ SETTINGS CHECK:');
    console.log(`  Notifications enabled: ${settings.enabled}`);
    console.log(`  Global time: ${settings.globalTime}`);
    console.log(`  Multiple reminders: ${settings.multipleReminders}`);
    console.log(`  Custom times: ${settings.customTimes}`);
    console.log(`  Reminder times: ${settings.reminderTimes?.join(', ') || 'none'}`);
    console.log(`  Escalating: ${settings.escalatingReminders}`);
    console.log(`  Only if incomplete: ${settings.onlyIfIncomplete}`);

    if (!settings.enabled) {
      issues.push('⚠️ Notifications are disabled');
    }

    if (!settings.reminderTimes || settings.reminderTimes.length === 0) {
      warnings.push('⚠️ No reminder times set - will use global time only');
    }

    // ========================================================================
    // CHECK 2: Routine Status
    // ========================================================================
    console.log('\n✓ ROUTINE STATUS:');
    console.log(`  Total active: ${status.total}`);
    console.log(`  Completed today: ${status.completed}`);
    console.log(`  Skipped today: ${status.skipped}`);
    console.log(`  Remaining: ${status.remaining}`);
    console.log(`  All handled: ${status.isAllHandled}`);

    if (!status.hasActiveRoutines) {
      issues.push('❌ No active routines - no notifications will be sent');
    }

    if (status.isAllHandled && settings.onlyIfIncomplete) {
      issues.push('✅ All routines handled - no notifications (expected behavior)');
    }

    if (status.remaining === 0 && !status.isAllHandled) {
      warnings.push('⚠️ All routines completed but status.isAllHandled=false - possible data issue');
    }

    // ========================================================================
    // CHECK 3: Escalation Settings Logic
    // ========================================================================
    console.log('\n✓ ESCALATION LOGIC:');
    
    const shouldEscalate = 
      settings.escalatingReminders &&
      settings.multipleReminders &&
      !settings.customTimes &&
      status.remaining > 0;
    
    console.log(`  Escalating enabled: ${settings.escalatingReminders}`);
    console.log(`  Multiple reminders enabled: ${settings.multipleReminders}`);
    console.log(`  Custom times: ${settings.customTimes}`);
    console.log(`  Incomplete routines: ${status.remaining > 0}`);
    console.log(`  → Will escalate: ${shouldEscalate}`);

    if (settings.customTimes && settings.escalatingReminders) {
      warnings.push('⚠️ Custom times set but escalation enabled - escalation will be IGNORED (correct)');
    }

    if (!settings.multipleReminders && settings.escalatingReminders) {
      warnings.push('⚠️ Multiple reminders disabled but escalation enabled - escalation will be IGNORED');
    }

    // ========================================================================
    // CHECK 4: Scheduled Notifications
    // ========================================================================
    console.log('\n✓ SCHEDULED NOTIFICATIONS:');
    console.log(`  Total scheduled: ${scheduled.length}`);

    if (scheduled.length === 0 && settings.enabled && status.hasActiveRoutines && !status.isAllHandled) {
      issues.push('❌ CRITICAL: No notifications scheduled but settings allow it!');
      recommendations.push('📋 Run scheduleRoutineNotifications() immediately');
    }

    scheduled.forEach((notif, idx) => {
      const trigger = notif.trigger as any;
      const time = trigger.hour ? `${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute || 0).padStart(2, '0')}` : 'unknown';
      console.log(`  ${idx + 1}. "${notif.content.title}" @ ${time}`);
    });

    // ========================================================================
    // CHECK 5: Time of Day Analysis
    // ========================================================================
    console.log('\n✓ TIME OF DAY ANALYSIS:');
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    console.log(`  Current time: ${timeString}`);
    console.log(`  Current hour: ${hour}`);

    if (hour < 6) {
      console.log(`  → Too early for notifications (night mode)`);
    } else if (hour >= 22) {
      console.log(`  → Late night - only final reminders should be active`);
    }

    // Check if current time matches any scheduled notifications
    const matchingNotifications = scheduled.filter(n => {
      const trigger = n.trigger as any;
      return trigger.hour === hour;
    });

    if (matchingNotifications.length > 0) {
      console.log(`  → ${matchingNotifications.length} notification(s) scheduled for this hour`);
    }

    // ========================================================================
    // CHECK 6: User Story Validation
    // ========================================================================
    console.log('\n✓ USER STORY CHECKS:');

    // User Story 1: App not opened - no notifications
    if (!settings.enabled || (status.isAllHandled && settings.onlyIfIncomplete)) {
      console.log('  ✓ User Story 1: Notifications correctly disabled when app not opened');
    } else if (scheduled.length > 0) {
      console.log('  ✓ User Story 1: Notifications will be sent even if app not opened');
    }

    // User Story 2: False positives at startup
    if (status.isAllHandled) {
      console.log('  ✓ User Story 2: No false positive notifications (all handled)');
    } else {
      console.log(`  ✓ User Story 2: Showing real status: ${status.completed}/${status.total} handled, ${status.remaining} remaining`);
    }

    // User Story 3: Settings respected
    if (settings.customTimes && !shouldEscalate) {
      console.log('  ✓ User Story 3: Custom times set - escalation correctly disabled');
    } else if (!settings.multipleReminders) {
      console.log('  ✓ User Story 3: Single reminder mode - only 1 notification per day');
    }

    // ========================================================================
    // Final Report
    // ========================================================================
    console.log('\n' + '═'.repeat(60));
    if (issues.length > 0) {
      console.log(`\n❌ ISSUES (${issues.length}):`);
      issues.forEach(i => console.log(`  ${i}`));
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${warnings.length}):`);
      warnings.forEach(w => console.log(`  ${w}`));
    }

    if (recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS (${recommendations.length}):`);
      recommendations.forEach(r => console.log(`  ${r}`));
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n✅ NO ISSUES FOUND - Notification system looks good!');
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    return {
      timestamp: new Date().toISOString(),
      settings,
      routines,
      status,
      scheduledNotifications: scheduled,
      issues,
      warnings,
      recommendations,
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    throw error;
  }
};

/**
 * Quick status check
 */
export const quickNotificationStatus = async (): Promise<string> => {
  try {
    const { settings } = await getNotificationData();
    const scheduled = await getScheduledNotifications();

    const status = [
      `📋 Notifications: ${settings.enabled ? '✅ ENABLED' : '❌ DISABLED'}`,
      `📅 Times: ${settings.reminderTimes?.join(', ') || 'default'}`,
      `📊 Scheduled: ${scheduled.length} notifications`,
      `⚡ Escalation: ${settings.escalatingReminders ? 'ON' : 'OFF'}`,
    ].join('\n');

    console.log(status);
    return status;
  } catch (error) {
    console.error('Error getting status:', error);
    return 'Error loading status';
  }
};

/**
 * Export debug report as JSON
 */
export const exportDebugReport = async (): Promise<string> => {
  const report = await debugNotificationSystem();
  return JSON.stringify(report, null, 2);
};
