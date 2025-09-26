/**
 * Notification types and interfaces
 * Shared between notification and storage modules to avoid circular dependencies
 */

import { Routine } from './routine';

export interface NotificationConfig {
  enabled: boolean;
  time?: string; // Format: "HH:MM"
  globalTime?: string; // Backward compatibility
  multipleReminders?: boolean; // Enable multiple daily reminders
  reminderTimes?: string[]; // Multiple reminder times ["07:00", "14:00", "18:00", "20:00"]
  onlyIfIncomplete?: boolean; // Only send if routines are incomplete
}

export interface NotificationScheduleData {
  routines: Routine[];
  settings: NotificationConfig;
}

export type NotificationLoadFunction = () => Promise<NotificationScheduleData>;