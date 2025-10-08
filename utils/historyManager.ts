import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, RoutineConfirmation } from '../types/routine';

export interface HistoryEntry {
  id: string;
  routineId: string;
  routineName: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  streakAtTime: number;
  timestamp: number; // Unix timestamp for sorting
}

export interface DayData {
  date: string; // YYYY-MM-DD
  completedRoutines: number;
  totalRoutines: number;
  completionRate: number; // 0-1
  entries: HistoryEntry[];
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalDays: number;
  completedDays: number;
  totalCompletions: number;
  averageCompletionRate: number;
  streakDays: number;
  bestStreak: number;
}

const STORAGE_KEYS = {
  HISTORY: 'routine_history',
  MONTHLY_STATS: 'monthly_stats',
} as const;

/**
 * Save a history entry when a routine is confirmed
 */
export const saveHistoryEntry = async (
  routine: Routine, 
  completed: boolean, 
  streakAtTime: number
): Promise<void> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const timestamp = Date.now();
    
    const entry: HistoryEntry = {
      id: `${routine.id}_${today}_${timestamp}`,
      routineId: routine.id,
      routineName: routine.name,
      date: today,
      completed,
      streakAtTime,
      timestamp,
    };
    
    // Load existing history
    const history = await loadHistory();
    
    // Remove any existing entry for this routine today (allow re-confirmation)
    const filteredHistory = history.filter(
      h => !(h.routineId === routine.id && h.date === today)
    );
    
    // Add new entry
    filteredHistory.push(entry);
    
    // Keep only last 90 days to prevent storage bloat
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().slice(0, 10);
    
    const recentHistory = filteredHistory.filter(h => h.date >= cutoffDate);
    
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(recentHistory));
    
    // Update monthly stats
    await updateMonthlyStats();
  } catch (error) {
    console.error('Error saving history entry:', error);
  }
};

/**
 * Load complete history
 */
export const loadHistory = async (): Promise<HistoryEntry[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
    return [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

/**
 * Get history for a specific date range
 */
export const getHistoryForDateRange = async (
  startDate: string, 
  endDate: string
): Promise<HistoryEntry[]> => {
  try {
    const history = await loadHistory();
    return history.filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    ).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting history for date range:', error);
    return [];
  }
};

/**
 * Get daily data for calendar view
 */
export const getDailyData = async (
  startDate: string, 
  endDate: string, 
  activeRoutines: Routine[]
): Promise<DayData[]> => {
  try {
    const history = await getHistoryForDateRange(startDate, endDate);
    const dayDataMap = new Map<string, DayData>();
    
    // Initialize all days in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      dayDataMap.set(dateStr, {
        date: dateStr,
        completedRoutines: 0,
        totalRoutines: activeRoutines.length,
        completionRate: 0,
        entries: [],
      });
    }
    
    // Populate with actual data
    history.forEach(entry => {
      const dayData = dayDataMap.get(entry.date);
      if (dayData) {
        dayData.entries.push(entry);
        if (entry.completed) {
          dayData.completedRoutines++;
        }
      }
    });
    
    // Calculate completion rates
    dayDataMap.forEach(dayData => {
      if (dayData.totalRoutines > 0) {
        dayData.completionRate = dayData.completedRoutines / dayData.totalRoutines;
      }
    });
    
    return Array.from(dayDataMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('Error getting daily data:', error);
    return [];
  }
};

/**
 * Update monthly statistics
 */
const updateMonthlyStats = async (): Promise<void> => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get data for current month
    const startDate = `${currentMonth}-01`;
    const endDate = `${currentMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
    
    const history = await getHistoryForDateRange(startDate, endDate);
    
    // Calculate stats
    const dayMap = new Map<string, { completed: number; total: number }>();
    
    history.forEach(entry => {
      if (!dayMap.has(entry.date)) {
        dayMap.set(entry.date, { completed: 0, total: 0 });
      }
      const dayStats = dayMap.get(entry.date)!;
      dayStats.total++;
      if (entry.completed) {
        dayStats.completed++;
      }
    });
    
    const totalDays = dayMap.size;
    const completedDays = Array.from(dayMap.values()).filter(d => d.completed > 0).length;
    const totalCompletions = Array.from(dayMap.values()).reduce((sum, d) => sum + d.completed, 0);
    const averageCompletionRate = totalDays > 0 ? 
      Array.from(dayMap.values()).reduce((sum, d) => sum + (d.completed / d.total), 0) / totalDays : 0;
    
    // Calculate streak (consecutive days with at least one completion)
    const sortedDays = Array.from(dayMap.keys()).sort();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (const day of sortedDays) {
      const dayStats = dayMap.get(day)!;
      if (dayStats.completed > 0) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Current streak (from today backwards)
    const today = now.toISOString().slice(0, 10);
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i];
      const dayStats = dayMap.get(day)!;
      if (dayStats.completed > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    const monthlyStats: MonthlyStats = {
      month: currentMonth,
      totalDays,
      completedDays,
      totalCompletions,
      averageCompletionRate,
      streakDays: currentStreak,
      bestStreak,
    };
    
    // Load existing monthly stats
    const existingStatsJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_STATS);
    const existingStats: MonthlyStats[] = existingStatsJson ? JSON.parse(existingStatsJson) : [];
    
    // Update or add current month
    const existingIndex = existingStats.findIndex(s => s.month === currentMonth);
    if (existingIndex >= 0) {
      existingStats[existingIndex] = monthlyStats;
    } else {
      existingStats.push(monthlyStats);
    }
    
    // Keep only last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const cutoffMonth = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    
    const recentStats = existingStats.filter(s => s.month >= cutoffMonth);
    
    await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_STATS, JSON.stringify(recentStats));
  } catch (error) {
    console.error('Error updating monthly stats:', error);
  }
};

/**
 * Get monthly statistics
 */
export const getMonthlyStats = async (): Promise<MonthlyStats[]> => {
  try {
    const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_STATS);
    if (statsJson) {
      return JSON.parse(statsJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    return [];
  }
};

/**
 * Export history data as JSON
 */
export const exportHistoryAsJSON = async (): Promise<string> => {
  try {
    const history = await loadHistory();
    const monthlyStats = await getMonthlyStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      history,
      monthlyStats,
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting history:', error);
    throw error;
  }
};

/**
 * Clear all history data (for testing/reset)
 */
export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
    await AsyncStorage.removeItem(STORAGE_KEYS.MONTHLY_STATS);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};