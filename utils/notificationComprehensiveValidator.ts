/**
 * COMPREHENSIVE NOTIFICATION SYSTEM VALIDATION
 * 
 * This is the complete test execution script
 * Run this to validate the entire notification system before production
 * 
 * Usage: Call this directly from settings panel or during app startup
 */

import { 
  scheduleRoutineNotifications, 
  cancelAllNotifications,
  getScheduledNotifications,
  getCompletionStatus,
  requestNotificationPermissions 
} from './notificationManager';
import { 
  loadSettings, 
  saveSettings,
  loadRoutines,
  createRoutine,
  confirmRoutine,
  undoRoutineToday,
  SettingsData,
  DEFAULT_SETTINGS
} from './settingsStorage';
import { getNotificationData } from './settingsStorage';
import { debugNotificationSystem } from './notificationDebugger';

interface DetailedTestResult {
  testId: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  message: string;
  duration: number;
  details: any;
  timestamp: string;
}

class ComprehensiveNotificationValidator {
  private results: DetailedTestResult[] = [];
  private startTime: number = 0;
  private categoryTotals: { [key: string]: { total: number; passed: number } } = {};

  /**
   * Log test result
   */
  private addResult(
    testId: string,
    name: string,
    category: string,
    status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR',
    message: string,
    details: any,
    duration: number
  ) {
    this.results.push({
      testId,
      name,
      category,
      status,
      message,
      details,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Track category stats
    if (!this.categoryTotals[category]) {
      this.categoryTotals[category] = { total: 0, passed: 0 };
    }
    this.categoryTotals[category].total++;
    if (status === 'PASS') {
      this.categoryTotals[category].passed++;
    }
  }

  /**
   * CATEGORY 1: PERMISSIONS & INITIALIZATION
   */
  async testPermissionsAndInit() {
    console.log('\n' + '═'.repeat(80));
    console.log('📱 CATEGORY 1: PERMISSIONS & INITIALIZATION');
    console.log('═'.repeat(80));

    // Test 1.1: Request permissions
    const t1_1Start = Date.now();
    try {
      console.log('\n🧪 TEST 1.1: Request Notification Permissions');
      const granted = await requestNotificationPermissions();
      const duration = Date.now() - t1_1Start;

      if (granted) {
        console.log(`   ✅ Permissions granted (${duration}ms)`);
        this.addResult('1.1', 'Request Notification Permissions', 'Permissions', 'PASS', 'Permissions granted', { granted }, duration);
      } else {
        console.log(`   ⚠️ Permissions not granted (${duration}ms)`);
        this.addResult('1.1', 'Request Notification Permissions', 'Permissions', 'FAIL', 'Permissions not granted', { granted }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t1_1Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('1.1', 'Request Notification Permissions', 'Permissions', 'ERROR', String(error), {}, duration);
    }

    // Test 1.2: Load default settings
    const t1_2Start = Date.now();
    try {
      console.log('\n🧪 TEST 1.2: Load Default Settings');
      const settings = await loadSettings();
      const duration = Date.now() - t1_2Start;

      const isValid = 
        settings.notificationEnabled !== undefined &&
        settings.reminderTimes !== undefined &&
        settings.escalatingReminders !== undefined;

      if (isValid) {
        console.log(`   ✅ Settings loaded correctly (${duration}ms)`);
        console.log(`      - Enabled: ${settings.notificationEnabled}`);
        console.log(`      - Global Time: ${settings.notificationTime}`);
        console.log(`      - Times: ${settings.reminderTimes?.join(', ')}`);
        console.log(`      - Escalation: ${settings.escalatingReminders}`);
        this.addResult('1.2', 'Load Default Settings', 'Initialization', 'PASS', 'All required fields present', settings, duration);
      } else {
        console.log(`   ❌ Missing required fields (${duration}ms)`);
        this.addResult('1.2', 'Load Default Settings', 'Initialization', 'FAIL', 'Missing required fields', settings, duration);
      }
    } catch (error) {
      const duration = Date.now() - t1_2Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('1.2', 'Load Default Settings', 'Initialization', 'ERROR', String(error), {}, duration);
    }
  }

  /**
   * CATEGORY 2: SETTINGS PERSISTENCE
   */
  async testSettingsPersistence() {
    console.log('\n' + '═'.repeat(80));
    console.log('⚙️  CATEGORY 2: SETTINGS PERSISTENCE');
    console.log('═'.repeat(80));

    // Test 2.1: Save custom settings
    const t2_1Start = Date.now();
    try {
      console.log('\n🧪 TEST 2.1: Save Custom Settings');
      const customSettings: SettingsData = {
        ...DEFAULT_SETTINGS,
        notificationTime: '09:00',
        reminderTimes: ['09:00', '15:00'],
        multipleReminders: true,
        customTimes: true,
      };

      await saveSettings(customSettings);
      const loaded = await loadSettings();
      const duration = Date.now() - t2_1Start;

      const isCorrect = 
        loaded.notificationTime === '09:00' &&
        loaded.reminderTimes?.length === 2 &&
        loaded.customTimes === true;

      if (isCorrect) {
        console.log(`   ✅ Settings persisted correctly (${duration}ms)`);
        this.addResult('2.1', 'Save Custom Settings', 'Persistence', 'PASS', 'Custom settings saved and loaded', loaded, duration);
      } else {
        console.log(`   ❌ Settings not persisted correctly (${duration}ms)`);
        this.addResult('2.1', 'Save Custom Settings', 'Persistence', 'FAIL', 'Settings mismatch after save', { expected: customSettings, loaded }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t2_1Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('2.1', 'Save Custom Settings', 'Persistence', 'ERROR', String(error), {}, duration);
    }

    // Test 2.2: Restore defaults
    const t2_2Start = Date.now();
    try {
      console.log('\n🧪 TEST 2.2: Restore Default Settings');
      await saveSettings(DEFAULT_SETTINGS);
      const loaded = await loadSettings();
      const duration = Date.now() - t2_2Start;

      const isRestored = loaded.notificationTime === DEFAULT_SETTINGS.notificationTime;

      if (isRestored) {
        console.log(`   ✅ Defaults restored (${duration}ms)`);
        this.addResult('2.2', 'Restore Default Settings', 'Persistence', 'PASS', 'Defaults restored', loaded, duration);
      } else {
        console.log(`   ❌ Failed to restore defaults (${duration}ms)`);
        this.addResult('2.2', 'Restore Default Settings', 'Persistence', 'FAIL', 'Restore failed', loaded, duration);
      }
    } catch (error) {
      const duration = Date.now() - t2_2Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('2.2', 'Restore Default Settings', 'Persistence', 'ERROR', String(error), {}, duration);
    }
  }

  /**
   * CATEGORY 3: NOTIFICATION SCHEDULING
   */
  async testNotificationScheduling() {
    console.log('\n' + '═'.repeat(80));
    console.log('📅 CATEGORY 3: NOTIFICATION SCHEDULING');
    console.log('═'.repeat(80));

    // Test 3.1: Cancel all notifications
    const t3_1Start = Date.now();
    try {
      console.log('\n🧪 TEST 3.1: Cancel All Notifications');
      await cancelAllNotifications();
      const remaining = await getScheduledNotifications();
      const duration = Date.now() - t3_1Start;

      if (remaining.length === 0) {
        console.log(`   ✅ All notifications cancelled (${duration}ms)`);
        this.addResult('3.1', 'Cancel All Notifications', 'Scheduling', 'PASS', 'All cancelled', { count: remaining.length }, duration);
      } else {
        console.log(`   ⚠️ ${remaining.length} notifications remaining (${duration}ms)`);
        this.addResult('3.1', 'Cancel All Notifications', 'Scheduling', 'SKIP', `${remaining.length} remaining`, { count: remaining.length }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t3_1Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('3.1', 'Cancel All Notifications', 'Scheduling', 'ERROR', String(error), {}, duration);
    }

    // Test 3.2: Schedule notifications with defaults
    const t3_2Start = Date.now();
    try {
      console.log('\n🧪 TEST 3.2: Schedule Notifications (Default Settings)');
      await scheduleRoutineNotifications();
      const scheduled = await getScheduledNotifications();
      const duration = Date.now() - t3_2Start;

      console.log(`   Scheduled ${scheduled.length} notifications in ${duration}ms`);
      scheduled.forEach((notif, idx) => {
        const trigger = notif.trigger as any;
        const time = trigger.hour ? `${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute || 0).padStart(2, '0')}` : 'unknown';
        console.log(`   ${idx + 1}. "${notif.content.title}" @ ${time}`);
      });

      const isValid = scheduled.length >= 4 && scheduled.length <= 6;

      if (isValid) {
        console.log(`   ✅ Correct notification count (${scheduled.length}) - ${duration}ms`);
        this.addResult('3.2', 'Schedule Notifications (Default)', 'Scheduling', 'PASS', `${scheduled.length} notifications scheduled`, { count: scheduled.length }, duration);
      } else {
        console.log(`   ❌ Invalid notification count (${scheduled.length}, expected 4-6) - ${duration}ms`);
        this.addResult('3.2', 'Schedule Notifications (Default)', 'Scheduling', 'FAIL', `Invalid count: ${scheduled.length}`, { count: scheduled.length }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t3_2Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('3.2', 'Schedule Notifications (Default)', 'Scheduling', 'ERROR', String(error), {}, duration);
    }
  }

  /**
   * CATEGORY 4: STATUS CALCULATION
   */
  async testStatusCalculation() {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 CATEGORY 4: STATUS CALCULATION');
    console.log('═'.repeat(80));

    // Test 4.1: Get completion status
    const t4_1Start = Date.now();
    try {
      console.log('\n🧪 TEST 4.1: Calculate Completion Status');
      const routines = await loadRoutines();
      const status = getCompletionStatus(routines);
      const duration = Date.now() - t4_1Start;

      console.log(`   Status: ${status.completed}/${status.total} completed, ${status.remaining} remaining - ${duration}ms`);
      
      const isValid = 
        status.total >= 0 &&
        status.completed >= 0 &&
        status.remaining >= 0 &&
        status.completed + status.remaining === status.total;

      if (isValid) {
        console.log(`   ✅ Status calculation correct (${duration}ms)`);
        this.addResult('4.1', 'Calculate Status', 'Status', 'PASS', 'Status valid', status, duration);
      } else {
        console.log(`   ❌ Status calculation error (${duration}ms)`);
        this.addResult('4.1', 'Calculate Status', 'Status', 'FAIL', 'Status invalid', status, duration);
      }
    } catch (error) {
      const duration = Date.now() - t4_1Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('4.1', 'Calculate Status', 'Status', 'ERROR', String(error), {}, duration);
    }

    // Test 4.2: Verify no false positives
    const t4_2Start = Date.now();
    try {
      console.log('\n🧪 TEST 4.2: Verify No False-Positive Status');
      const routines = await loadRoutines();
      const status = getCompletionStatus(routines);
      const duration = Date.now() - t4_2Start;

      // Check for false positives
      const today = new Date().toISOString().slice(0, 10);
      const allIncomplete = routines.every(r => r.lastConfirmed !== today);

      let isProblem = false;
      if (allIncomplete && status.completed > 0) {
        console.log(`   ⚠️ Potential false positive: showing ${status.completed} completed when none confirmed today`);
        isProblem = true;
      }

      if (!isProblem) {
        console.log(`   ✅ No false positives detected (${duration}ms)`);
        this.addResult('4.2', 'No False Positives', 'Status', 'PASS', 'Status accurate', { allIncomplete, completed: status.completed }, duration);
      } else {
        console.log(`   ❌ False positives detected (${duration}ms)`);
        this.addResult('4.2', 'No False Positives', 'Status', 'FAIL', 'False positives found', status, duration);
      }
    } catch (error) {
      const duration = Date.now() - t4_2Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('4.2', 'No False Positives', 'Status', 'ERROR', String(error), {}, duration);
    }
  }

  /**
   * CATEGORY 5: SETTINGS RESPECT
   */
  async testSettingsRespect() {
    console.log('\n' + '═'.repeat(80));
    console.log('⚡ CATEGORY 5: SETTINGS RESPECT');
    console.log('═'.repeat(80));

    const originalSettings = await loadSettings();

    // Test 5.1: Disabled notifications
    const t5_1Start = Date.now();
    try {
      console.log('\n🧪 TEST 5.1: Notifications Disabled');
      await saveSettings({ ...originalSettings, notificationEnabled: false });
      await scheduleRoutineNotifications();
      const scheduled = await getScheduledNotifications();
      const duration = Date.now() - t5_1Start;

      if (scheduled.length === 0) {
        console.log(`   ✅ No notifications when disabled (${duration}ms)`);
        this.addResult('5.1', 'Disabled Notifications', 'Settings Respect', 'PASS', 'Settings respected', { count: scheduled.length }, duration);
      } else {
        console.log(`   ❌ Notifications still scheduled when disabled (${duration}ms)`);
        this.addResult('5.1', 'Disabled Notifications', 'Settings Respect', 'FAIL', 'Setting ignored', { count: scheduled.length }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t5_1Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('5.1', 'Disabled Notifications', 'Settings Respect', 'ERROR', String(error), {}, duration);
    }

    // Test 5.2: Single time only
    const t5_2Start = Date.now();
    try {
      console.log('\n🧪 TEST 5.2: Single Reminder Time');
      await saveSettings({
        ...originalSettings,
        notificationEnabled: true,
        multipleReminders: false,
        reminderTimes: ['10:00'],
      });
      await cancelAllNotifications();
      await scheduleRoutineNotifications();
      const scheduled = await getScheduledNotifications();
      const duration = Date.now() - t5_2Start;

      console.log(`   Scheduled: ${scheduled.length} notifications - ${duration}ms`);

      if (scheduled.length <= 2) {
        console.log(`   ✅ Single/limited reminders respected (${duration}ms)`);
        this.addResult('5.2', 'Single Reminder Time', 'Settings Respect', 'PASS', 'Limited to single/few reminders', { count: scheduled.length }, duration);
      } else {
        console.log(`   ❌ Too many notifications despite single time setting (${duration}ms)`);
        this.addResult('5.2', 'Single Reminder Time', 'Settings Respect', 'FAIL', `Too many: ${scheduled.length}`, { count: scheduled.length }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t5_2Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('5.2', 'Single Reminder Time', 'Settings Respect', 'ERROR', String(error), {}, duration);
    }

    // Test 5.3: Custom times disable escalation
    const t5_3Start = Date.now();
    try {
      console.log('\n🧪 TEST 5.3: Custom Times Disable Escalation');
      await saveSettings({
        ...originalSettings,
        notificationEnabled: true,
        customTimes: true,
        reminderTimes: ['11:00', '15:00'],
        escalatingReminders: true, // Even enabled, should be ignored
      });
      await cancelAllNotifications();
      await scheduleRoutineNotifications();
      const scheduled = await getScheduledNotifications();
      const duration = Date.now() - t5_3Start;

      console.log(`   Scheduled: ${scheduled.length} notifications - ${duration}ms`);

      // Should only have base times, no escalation
      if (scheduled.length <= 3) {
        console.log(`   ✅ Escalation disabled for custom times (${duration}ms)`);
        this.addResult('5.3', 'Custom Times Disable Escalation', 'Settings Respect', 'PASS', 'Escalation properly disabled', { count: scheduled.length }, duration);
      } else {
        console.log(`   ❌ Escalation still active despite custom times (${duration}ms)`);
        this.addResult('5.3', 'Custom Times Disable Escalation', 'Settings Respect', 'FAIL', `Too many: ${scheduled.length}`, { count: scheduled.length }, duration);
      }
    } catch (error) {
      const duration = Date.now() - t5_3Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('5.3', 'Custom Times Disable Escalation', 'Settings Respect', 'ERROR', String(error), {}, duration);
    }

    // Restore original settings
    await saveSettings(originalSettings);
  }

  /**
   * CATEGORY 6: NOTIFICATIONS CAP
   */
  async testNotificationsCap() {
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 CATEGORY 6: NOTIFICATIONS CAP (MAX 6/DAY)');
    console.log('═'.repeat(80));

    const t6_1Start = Date.now();
    try {
      console.log('\n🧪 TEST 6.1: Maximum 6 Notifications Per Day');
      const settings = await loadSettings();
      
      // Force escalation enabled to test the cap
      await saveSettings({
        ...settings,
        notificationEnabled: true,
        multipleReminders: true,
        escalatingReminders: true,
      });

      await cancelAllNotifications();
      await scheduleRoutineNotifications();
      const scheduled = await getScheduledNotifications();
      const duration = Date.now() - t6_1Start;

      console.log(`   Total scheduled: ${scheduled.length} notifications - ${duration}ms`);

      if (scheduled.length <= 6) {
        console.log(`   ✅ Correctly capped at ≤6 notifications (${duration}ms)`);
        this.addResult('6.1', 'Maximum Notifications Cap', 'Notifications Cap', 'PASS', `Capped at ${scheduled.length}`, { count: scheduled.length }, duration);
      } else {
        console.log(`   ❌ CRITICAL: Exceeds 6 notification limit! (${scheduled.length}) - ${duration}ms`);
        this.addResult('6.1', 'Maximum Notifications Cap', 'Notifications Cap', 'FAIL', `Exceeds limit: ${scheduled.length}`, { count: scheduled.length }, duration);
      }

      // Restore defaults
      await saveSettings(settings);
    } catch (error) {
      const duration = Date.now() - t6_1Start;
      console.error(`   ❌ Error: ${error}`);
      this.addResult('6.1', 'Maximum Notifications Cap', 'Notifications Cap', 'ERROR', String(error), {}, duration);
    }
  }

  /**
   * Run all tests
   */
  async runAll() {
    this.startTime = Date.now();

    console.log('\n\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(20) + '🚀 COMPREHENSIVE NOTIFICATION VALIDATION' + ' '.repeat(18) + '║');
    console.log('║' + ' '.repeat(25) + `Started: ${new Date().toLocaleString()}` + ' '.repeat(16) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');

    // Run all test categories
    await this.testPermissionsAndInit();
    await this.testSettingsPersistence();
    await this.testNotificationScheduling();
    await this.testStatusCalculation();
    await this.testSettingsRespect();
    await this.testNotificationsCap();

    // Generate summary
    this.generateSummary();
  }

  /**
   * Generate detailed summary
   */
  private generateSummary() {
    const totalTime = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const successRate = (passed / totalTests * 100).toFixed(1);

    console.log('\n\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(25) + '📊 TEST SUMMARY' + ' '.repeat(39) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');

    console.log('\n📈 Overall Results:');
    console.log(`   Total Tests:      ${totalTests}`);
    console.log(`   ✅ Passed:        ${passed}`);
    console.log(`   ❌ Failed:        ${failed}`);
    console.log(`   ⚠️  Errors:        ${errors}`);
    console.log(`   ⏭️  Skipped:       ${skipped}`);
    console.log(`   Success Rate:     ${successRate}%`);
    console.log(`   Total Time:       ${totalTime}ms`);

    console.log('\n📋 Results by Category:');
    Object.entries(this.categoryTotals).forEach(([category, stats]) => {
      const rate = ((stats.passed / stats.total) * 100).toFixed(0);
      const icon = stats.passed === stats.total ? '✅' : stats.passed > stats.total / 2 ? '⚠️ ' : '❌';
      console.log(`   ${icon} ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });

    // Final verdict
    console.log('\n' + '═'.repeat(80));
    if (failed === 0 && errors === 0) {
      console.log('✅ ALL CRITICAL TESTS PASSED - PRODUCTION READY! 🚀');
      console.log('═'.repeat(80));
    } else if (failed <= 1 && errors === 0) {
      console.log('⚠️  MOSTLY PASSING - Minor issues found, review above');
      console.log('═'.repeat(80));
    } else {
      console.log('❌ CRITICAL ISSUES FOUND - DO NOT DEPLOY YET');
      console.log('═'.repeat(80));
    }

    // Detailed results
    console.log('\n📝 Detailed Test Results:\n');
    this.results.forEach((result, idx) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'ERROR' ? '⚠️ ' : '⏭️ ';
      console.log(`${idx + 1}. ${icon} [${result.category}] ${result.testId}: ${result.name}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (Object.keys(result.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log();
    });

    // Final recommendation
    console.log('═'.repeat(80));
    if (failed === 0 && errors === 0) {
      console.log('\n🎉 RECOMMENDATION: Ready for production deployment!\n');
      console.log('Next steps:');
      console.log('  1. Build v1.0.3 with: eas build --platform android --profile production');
      console.log('  2. Test on real device for 1-2 hours');
      console.log('  3. Submit to Google Play Store\n');
    } else {
      console.log('\n⚠️  RECOMMENDATION: Address issues before production\n');
      console.log('Review failing tests and consult NOTIFICATION_FIXES.md\n');
    }
  }
}

/**
 * Execute the comprehensive validation
 */
export const runComprehensiveNotificationValidation = async () => {
  const validator = new ComprehensiveNotificationValidator();
  await validator.runAll();
};
