import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { 
  exportHistoryAsJSON, 
  loadHistory, 
  getMonthlyStats,
  HistoryEntry,
  MonthlyStats 
} from './historyManager';
import { loadRoutines, loadRoutineState } from './settingsStorage';
import { Routine, RoutineState } from '../types/routine';

export interface ExportData {
  exportInfo: {
    exportDate: string;
    appVersion: string;
    dataVersion: string;
    exportType: 'full' | 'history' | 'routines';
  };
  routines: Routine[];
  routineState: RoutineState;
  history: HistoryEntry[];
  monthlyStats: MonthlyStats[];
}

export interface ExportOptions {
  format: 'json' | 'csv';
  dataType: 'full' | 'history' | 'routines';
  dateRange?: {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
  };
  includeInactive?: boolean;
}

/**
 * Generate complete export data
 */
export const generateExportData = async (options: ExportOptions): Promise<ExportData> => {
  try {
    const exportDate = new Date().toISOString();
    
    // Load base data
    const [routines, routineState, history, monthlyStats] = await Promise.all([
      loadRoutines(),
      loadRoutineState(),
      loadHistory(),
      getMonthlyStats(),
    ]);
    
    // Filter routines if needed
    let filteredRoutines = routines;
    if (!options.includeInactive) {
      filteredRoutines = routines.filter(r => r.isActive);
    }
    
    // Filter history by date range if specified
    let filteredHistory = history;
    if (options.dateRange) {
      filteredHistory = history.filter(entry => 
        entry.date >= options.dateRange!.startDate && 
        entry.date <= options.dateRange!.endDate
      );
    }
    
    // Filter monthly stats by date range if specified
    let filteredMonthlyStats = monthlyStats;
    if (options.dateRange) {
      const startMonth = options.dateRange.startDate.slice(0, 7); // YYYY-MM
      const endMonth = options.dateRange.endDate.slice(0, 7);
      filteredMonthlyStats = monthlyStats.filter(stat => 
        stat.month >= startMonth && stat.month <= endMonth
      );
    }
    
    return {
      exportInfo: {
        exportDate,
        appVersion: '1.0.0',
        dataVersion: '1.0',
        exportType: options.dataType,
      },
      routines: options.dataType === 'history' ? [] : filteredRoutines,
      routineState: options.dataType === 'history' ? {
        routines: [],
        activeRoutineCount: 0,
        totalStreakDays: 0,
      } : routineState,
      history: options.dataType === 'routines' ? [] : filteredHistory,
      monthlyStats: options.dataType === 'routines' ? [] : filteredMonthlyStats,
    };
  } catch (error) {
    console.error('Error generating export data:', error);
    throw new Error('Failed to generate export data');
  }
};

/**
 * Convert export data to JSON string
 */
export const exportToJSON = async (options: ExportOptions): Promise<string> => {
  try {
    const exportData = await generateExportData(options);
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
};

/**
 * Convert export data to CSV format
 */
export const exportToCSV = async (options: ExportOptions): Promise<string> => {
  try {
    const exportData = await generateExportData(options);
    
    if (options.dataType === 'routines') {
      return exportRoutinesToCSV(exportData.routines);
    } else if (options.dataType === 'history') {
      return exportHistoryToCSV(exportData.history);
    } else {
      // Full export: create multiple CSV sections
      let csvContent = '';
      
      // Routines section
      csvContent += '=== ROUTINES ===\n';
      csvContent += exportRoutinesToCSV(exportData.routines);
      csvContent += '\n\n';
      
      // History section
      csvContent += '=== HISTORY ===\n';
      csvContent += exportHistoryToCSV(exportData.history);
      csvContent += '\n\n';
      
      // Monthly stats section
      csvContent += '=== MONTHLY STATISTICS ===\n';
      csvContent += exportMonthlyStatsToCSV(exportData.monthlyStats);
      
      return csvContent;
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Convert routines to CSV format
 */
const exportRoutinesToCSV = (routines: Routine[]): string => {
  if (routines.length === 0) {
    return 'No routines data available';
  }
  
  const headers = [
    'ID',
    'Name',
    'Description',
    'Icon',
    'Color',
    'Streak',
    'Last Confirmed',
    'Is Active',
    'Created Date',
    'Target Days',
    'Notification Time'
  ];
  
  const rows = routines.map(routine => [
    routine.id,
    `"${routine.name}"`,
    `"${routine.description || ''}"`,
    routine.icon,
    routine.color,
    routine.streak.toString(),
    routine.lastConfirmed || '',
    routine.isActive ? 'Yes' : 'No',
    routine.createdAt || '',
    '', // targetDays - not implemented yet
    '' // notificationTime - not implemented yet
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

/**
 * Convert history to CSV format
 */
const exportHistoryToCSV = (history: HistoryEntry[]): string => {
  if (history.length === 0) {
    return 'No history data available';
  }
  
  const headers = [
    'Date',
    'Routine ID',
    'Routine Name',
    'Completed',
    'Streak at Time',
    'Timestamp'
  ];
  
  const rows = history
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
    .map(entry => [
      entry.date,
      entry.routineId,
      `"${entry.routineName}"`,
      entry.completed ? 'Yes' : 'No',
      entry.streakAtTime.toString(),
      new Date(entry.timestamp).toISOString()
    ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

/**
 * Convert monthly stats to CSV format
 */
const exportMonthlyStatsToCSV = (stats: MonthlyStats[]): string => {
  if (stats.length === 0) {
    return 'No monthly statistics available';
  }
  
  const headers = [
    'Month',
    'Total Days',
    'Completed Days',
    'Total Completions',
    'Average Completion Rate',
    'Current Streak Days',
    'Best Streak'
  ];
  
  const rows = stats
    .sort((a, b) => b.month.localeCompare(a.month)) // Most recent first
    .map(stat => [
      stat.month,
      stat.totalDays.toString(),
      stat.completedDays.toString(),
      stat.totalCompletions.toString(),
      (stat.averageCompletionRate * 100).toFixed(1) + '%',
      stat.streakDays.toString(),
      stat.bestStreak.toString()
    ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

/**
 * Save and share export file
 */
export const saveAndShareExport = async (
  content: string, 
  filename: string,
  mimeType: string = 'text/plain'
): Promise<void> => {
  try {
    // For now, just use alert to show the export is ready
    // In a production app, this would save to device storage
    console.log('Export content length:', content.length);
    console.log('Export filename:', filename);
    
    Alert.alert(
      'Export Ready',
      `${filename} has been prepared for export.\n\nContent preview:\n${content.slice(0, 200)}...`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  } catch (error) {
    console.error('Error saving and sharing export:', error);
    throw new Error('Failed to save and share export file');
  }
};

/**
 * Quick export functions for common use cases
 */
export const quickExportJSON = async (): Promise<void> => {
  try {
    const content = await exportToJSON({ format: 'json', dataType: 'full' });
    const filename = `routine-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    await saveAndShareExport(content, filename, 'application/json');
  } catch (error) {
    console.error('Quick JSON export failed:', error);
    Alert.alert('Export Failed', 'Could not export data as JSON');
  }
};

export const quickExportCSV = async (): Promise<void> => {
  try {
    const content = await exportToCSV({ format: 'csv', dataType: 'full' });
    const filename = `routine-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
    await saveAndShareExport(content, filename, 'text/csv');
  } catch (error) {
    console.error('Quick CSV export failed:', error);
    Alert.alert('Export Failed', 'Could not export data as CSV');
  }
};

export const exportHistoryOnly = async (format: 'json' | 'csv' = 'csv'): Promise<void> => {
  try {
    const content = format === 'json' 
      ? await exportToJSON({ format: 'json', dataType: 'history' })
      : await exportToCSV({ format: 'csv', dataType: 'history' });
    
    const filename = `routine-history-${new Date().toISOString().slice(0, 10)}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    
    await saveAndShareExport(content, filename, mimeType);
  } catch (error) {
    console.error('History export failed:', error);
    Alert.alert('Export Failed', `Could not export history as ${format.toUpperCase()}`);
  }
};

/**
 * Get export file info
 */
export const getExportFileInfo = async (): Promise<{
  totalSize: number;
  availableSpace: number;
  canExport: boolean;
}> => {
  try {
    // Estimate export size (rough calculation)
    const [routines, history] = await Promise.all([
      loadRoutines(),
      loadHistory(),
    ]);
    
    const estimatedSize = 
      (routines.length * 500) + // ~500 bytes per routine
      (history.length * 200) +  // ~200 bytes per history entry
      10000; // Base overhead
    
    // For now, assume we have enough space (in production, use FileSystem.getFreeDiskStorageAsync)
    const freeSpace = 100000000; // 100MB assumed
    
    return {
      totalSize: estimatedSize,
      availableSpace: freeSpace,
      canExport: freeSpace > (estimatedSize * 2), // 2x safety margin
    };
  } catch (error) {
    console.error('Error getting export file info:', error);
    return {
      totalSize: 0,
      availableSpace: 0,
      canExport: false,
    };
  }
};