/**
 * Notification types and interfaces
 * Shared between notification and storage modules to avoid circular dependencies
 */

import { Routine } from './routine';

export interface NotificationConfig {
  enabled: boolean;
  time?: string; // Format: "HH:MM"
}

export interface NotificationScheduleData {
  routines: Routine[];
  settings: NotificationConfig;
}

export type NotificationLoadFunction = () => Promise<NotificationScheduleData>;