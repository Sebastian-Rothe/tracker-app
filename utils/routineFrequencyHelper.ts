/**
 * Routine Frequency Helper
 * 
 * Core logic for determining when routines are due based on their frequency configuration.
 * Critical for notification scheduling - only send notifications for routines that are due today.
 */

import { Routine, FrequencyConfig } from '@/types/routine';

/**
 * Check if a routine is due today based on its frequency configuration
 */
export function isRoutineDueToday(routine: Routine, today: Date = new Date()): boolean {
  if (!routine.isActive) {
    return false;
  }

  const { frequency } = routine;
  
  switch (frequency.type) {
    case 'daily':
      return true; // Always due every day
      
    case 'interval':
      return isIntervalDueToday(routine, today);
      
    case 'weekly':
      return isWeeklyDueToday(frequency, today);
      
    case 'monthly':
      return isMonthlyDueToday(frequency, today);
      
    default:
      // Default to daily if unknown type
      return true;
  }
}

/**
 * Check if an interval-based routine is due today
 * Calculates days since last confirmation or creation
 */
function isIntervalDueToday(routine: Routine, today: Date): boolean {
  const intervalDays = routine.frequency.intervalDays || 1;
  
  // Use lastConfirmed if available, otherwise use createdAt
  const referenceDate = routine.lastConfirmed || routine.createdAt;
  const lastDate = new Date(referenceDate);
  
  // Calculate days since last confirmation/creation
  const daysSince = getDaysDifference(lastDate, today);
  
  // Due if enough days have passed
  return daysSince >= intervalDays;
}

/**
 * Check if a weekly routine is due today
 * Based on selected weekdays
 */
function isWeeklyDueToday(frequency: FrequencyConfig, today: Date): boolean {
  if (!frequency.weekdays || frequency.weekdays.length === 0) {
    return false; // No days selected = never due
  }
  
  const todayWeekday = today.getDay(); // 0 = Sunday, 6 = Saturday
  return frequency.weekdays.includes(todayWeekday);
}

/**
 * Check if a monthly routine is due today
 * Based on selected days of month
 */
function isMonthlyDueToday(frequency: FrequencyConfig, today: Date): boolean {
  if (!frequency.monthDays || frequency.monthDays.length === 0) {
    return false; // No days selected = never due
  }
  
  const todayDate = today.getDate(); // 1-31
  return frequency.monthDays.includes(todayDate);
}

/**
 * Calculate the next due date for a routine
 * Used for display and planning purposes
 */
export function calculateNextDueDate(routine: Routine, fromDate: Date = new Date()): Date {
  const { frequency } = routine;
  
  switch (frequency.type) {
    case 'daily':
      // If already due today, return today, otherwise tomorrow
      return isRoutineDueToday(routine, fromDate) ? fromDate : addDays(fromDate, 1);
      
    case 'interval':
      return calculateNextIntervalDate(routine, fromDate);
      
    case 'weekly':
      return calculateNextWeeklyDate(frequency, fromDate);
      
    case 'monthly':
      return calculateNextMonthlyDate(frequency, fromDate);
      
    default:
      return fromDate;
  }
}

/**
 * Calculate next due date for interval-based routine
 */
function calculateNextIntervalDate(routine: Routine, fromDate: Date): Date {
  const intervalDays = routine.frequency.intervalDays || 1;
  
  if (isRoutineDueToday(routine, fromDate)) {
    return fromDate; // Already due today
  }
  
  // Calculate from last confirmed date
  const referenceDate = routine.lastConfirmed || routine.createdAt;
  const lastDate = new Date(referenceDate);
  
  // Add interval days to find next due date
  let nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  
  // If next date is in the past, keep adding intervals until we find future date
  while (nextDate <= fromDate) {
    nextDate.setDate(nextDate.getDate() + intervalDays);
  }
  
  return nextDate;
}

/**
 * Calculate next due date for weekly routine
 */
function calculateNextWeeklyDate(frequency: FrequencyConfig, fromDate: Date): Date {
  if (!frequency.weekdays || frequency.weekdays.length === 0) {
    return addDays(fromDate, 7); // Default to next week
  }
  
  const todayWeekday = fromDate.getDay();
  const sortedWeekdays = [...frequency.weekdays].sort((a, b) => a - b);
  
  // Check if due today
  if (sortedWeekdays.includes(todayWeekday)) {
    return fromDate;
  }
  
  // Find next weekday after today
  const nextWeekday = sortedWeekdays.find(day => day > todayWeekday);
  
  if (nextWeekday !== undefined) {
    // Next due day is this week
    const daysUntil = nextWeekday - todayWeekday;
    return addDays(fromDate, daysUntil);
  } else {
    // Next due day is next week (first selected weekday)
    const daysUntil = (7 - todayWeekday) + sortedWeekdays[0];
    return addDays(fromDate, daysUntil);
  }
}

/**
 * Calculate next due date for monthly routine
 */
function calculateNextMonthlyDate(frequency: FrequencyConfig, fromDate: Date): Date {
  if (!frequency.monthDays || frequency.monthDays.length === 0) {
    return addDays(fromDate, 30); // Default to next month
  }
  
  const todayDate = fromDate.getDate();
  const sortedMonthDays = [...frequency.monthDays].sort((a, b) => a - b);
  
  // Check if due today
  if (sortedMonthDays.includes(todayDate)) {
    return fromDate;
  }
  
  // Find next day in this month
  const nextDayThisMonth = sortedMonthDays.find(day => day > todayDate);
  
  if (nextDayThisMonth !== undefined) {
    // Next due day is this month
    const result = new Date(fromDate);
    result.setDate(nextDayThisMonth);
    return result;
  } else {
    // Next due day is next month (first selected day)
    const result = new Date(fromDate);
    result.setMonth(result.getMonth() + 1);
    result.setDate(sortedMonthDays[0]);
    return result;
  }
}

/**
 * Get difference in days between two dates (ignoring time)
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format next due date for display
 */
export function formatNextDueDate(routine: Routine): string {
  const nextDue = calculateNextDueDate(routine);
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Normalize dates for comparison (remove time)
  const nextDueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
  if (nextDueDate.getTime() === todayDate.getTime()) {
    return 'Heute';
  } else if (nextDueDate.getTime() === tomorrowDate.getTime()) {
    return 'Morgen';
  } else {
    const daysDiff = getDaysDifference(todayDate, nextDueDate);
    if (daysDiff <= 7) {
      const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      return weekdays[nextDue.getDay()];
    } else {
      return nextDue.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  }
}

/**
 * Get human-readable frequency description
 */
export function getFrequencyDescription(frequency: FrequencyConfig): string {
  switch (frequency.type) {
    case 'daily':
      return 'Täglich';
      
    case 'interval':
      const intervalDays = frequency.intervalDays || 1;
      return intervalDays === 1 ? 'Täglich' : `Alle ${intervalDays} Tage`;
      
    case 'weekly':
      if (!frequency.weekdays || frequency.weekdays.length === 0) {
        return 'Wöchentlich';
      }
      const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const selectedDays = frequency.weekdays
        .sort((a, b) => a - b)
        .map(day => weekdayNames[day]);
      return selectedDays.join(', ');
      
    case 'monthly':
      if (!frequency.monthDays || frequency.monthDays.length === 0) {
        return 'Monatlich';
      }
      const sortedDays = frequency.monthDays.sort((a, b) => a - b);
      if (sortedDays.length <= 3) {
        return `${sortedDays.join(', ')}. des Monats`;
      } else {
        return `Monatlich (${sortedDays.length} Tage)`;
      }
      
    default:
      return 'Täglich';
  }
}
