/**
 * Multi-Routine Architecture - Core Types
 * Phase 3: Transforming from single to multiple routine tracking
 */

export interface Routine {
  id: string;
  name: string;
  description?: string;
  streak: number;
  lastConfirmed: string; // ISO date string (YYYY-MM-DD)
  createdAt: string; // ISO date string
  color: string; // Hex color code for visual identification
  icon: string; // Emoji or icon identifier
  isActive: boolean; // Whether routine is currently being tracked
  reminderTime?: string; // Optional time for notifications (HH:MM format)
}

export interface RoutineState {
  routines: Routine[];
  activeRoutineCount: number;
  totalStreakDays: number; // Sum of all routine streaks
}

export interface CreateRoutineRequest {
  name: string;
  description?: string;
  color: string;
  icon: string;
  reminderTime?: string;
  initialStreak?: number;
}

export interface UpdateRoutineRequest {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  reminderTime?: string;
}

export interface RoutineConfirmation {
  routineId: string;
  confirmed: boolean;
  timestamp: string; // ISO date string
}

// Pre-defined color palette for routine customization
export const ROUTINE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
] as const;

// Pre-defined emoji icons for routine identification
export const ROUTINE_ICONS = [
  '💪', // Exercise
  '📚', // Reading
  '🧘', // Meditation
  '💧', // Water
  '🥗', // Healthy Eating
  '😴', // Sleep
  '🚶', // Walking
  '📝', // Writing
  '🎯', // Goals
  '🌱', // Growth
  '☕', // Morning Coffee
  '🎵', // Music
  '🔥', // Motivation
  '⭐', // Achievement
  '💡', // Learning
  '🌟', // Success
] as const;

export type RoutineColor = typeof ROUTINE_COLORS[number];
export type RoutineIcon = typeof ROUTINE_ICONS[number];
