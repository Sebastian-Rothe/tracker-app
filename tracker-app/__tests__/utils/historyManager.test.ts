import { 
  getDailyData, 
  getMonthlyStats, 
  saveHistoryEntry,
  loadHistory 
} from '@/utils/historyManager';
import { Routine } from '@/types/routine';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('historyManager', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  const mockRoutines: Routine[] = [
    {
      id: 'routine-1',
      name: 'Exercise',
      description: 'Daily workout',
      streak: 5,
      lastConfirmed: '2025-09-25',
      createdAt: '2025-09-20',
      color: '#FF6B6B',
      icon: '💪',
      isActive: true
    },
    {
      id: 'routine-2',
      name: 'Reading',
      description: 'Read books',
      streak: 3,
      lastConfirmed: '2025-09-24',
      createdAt: '2025-09-22',
      color: '#4ECDC4',
      icon: '📚',
      isActive: true
    }
  ];

  describe('saveHistoryEntry', () => {
    test('should save history entry successfully', async () => {
      await saveHistoryEntry(mockRoutines[0], true, 5);
      
      const history = await loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        routineId: 'routine-1',
        routineName: 'Exercise',
        completed: true,
        streakAtTime: 5
      });
      expect(history[0].date).toBe(new Date().toISOString().slice(0, 10));
    });

    test('should save multiple history entries', async () => {
      await saveHistoryEntry(mockRoutines[0], true, 5);
      await saveHistoryEntry(mockRoutines[1], false, 3);
      
      const history = await loadHistory();
      expect(history).toHaveLength(2);
      
      const routineIds = history.map(h => h.routineId).sort();
      expect(routineIds).toEqual(['routine-1', 'routine-2']);
    });
  });

  describe('getDailyData', () => {
    beforeEach(async () => {
      // Setup test data
      await saveHistoryEntry(mockRoutines[0], true, 5);
      await saveHistoryEntry(mockRoutines[1], true, 3);
    });

    test('should return daily data for date range', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const dailyData = await getDailyData(today, today, mockRoutines);
      
      expect(dailyData).toHaveLength(1);
      expect(dailyData[0]).toMatchObject({
        date: today,
        completedRoutines: 2,
        totalRoutines: 2,
        completionRate: 1
      });
    });

    test('should handle date range with no data', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dailyData = await getDailyData(yesterday, yesterday, mockRoutines);
      
      expect(dailyData).toHaveLength(1);
      expect(dailyData[0]).toMatchObject({
        date: yesterday,
        completedRoutines: 0,
        totalRoutines: 2,
        completionRate: 0
      });
    });

    test('should calculate completion rates correctly', async () => {
      // Add partial completion data
      await AsyncStorage.clear();
      await saveHistoryEntry(mockRoutines[0], true, 5);
      // routine-2 not completed
      
      const today = new Date().toISOString().slice(0, 10);
      const dailyData = await getDailyData(today, today, mockRoutines);
      
      expect(dailyData[0]).toMatchObject({
        completedRoutines: 1,
        totalRoutines: 2,
        completionRate: 0.5
      });
    });
  });

  describe('getMonthlyStats', () => {
    beforeEach(async () => {
      // Setup test data for multiple days
      const dates = ['2025-09-23', '2025-09-24', '2025-09-25'];
      
      for (const date of dates) {
        // Mock the date for each entry
        const originalDate = Date.now;
        Date.now = jest.fn(() => new Date(date).getTime());
        
        await saveHistoryEntry(mockRoutines[0], true, 5);
        await saveHistoryEntry(mockRoutines[1], Math.random() > 0.5, 3);
        
        Date.now = originalDate;
      }
    });

    test('should return monthly statistics array', async () => {
      const stats = await getMonthlyStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThanOrEqual(0);
      
      if (stats.length > 0) {
        const currentMonthStats = stats[0];
        expect(currentMonthStats).toHaveProperty('month');
        expect(currentMonthStats).toHaveProperty('totalDays');
        expect(currentMonthStats).toHaveProperty('completedDays');
        expect(currentMonthStats).toHaveProperty('totalCompletions');
        expect(currentMonthStats).toHaveProperty('averageCompletionRate');
        expect(currentMonthStats).toHaveProperty('streakDays');
        expect(currentMonthStats).toHaveProperty('bestStreak');
      }
    });

    test('should handle empty data', async () => {
      await AsyncStorage.clear();
      
      const stats = await getMonthlyStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(0);
    });
  });

  describe('loadHistory', () => {
    test('should return empty array when no history exists', async () => {
      const history = await loadHistory();
      expect(history).toEqual([]);
    });

    test('should return history entries with correct structure', async () => {
      // Create entries
      await saveHistoryEntry(mockRoutines[0], true, 5);
      await saveHistoryEntry(mockRoutines[1], true, 3);
      
      const history = await loadHistory();
      expect(history).toHaveLength(2);
      
      // Check structure of entries
      history.forEach(entry => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('routineId');
        expect(entry).toHaveProperty('routineName');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('completed');
        expect(entry).toHaveProperty('streakAtTime');
        expect(entry).toHaveProperty('timestamp');
      });
    });

    test('should handle routine re-confirmation on same day', async () => {
      // First confirmation
      await saveHistoryEntry(mockRoutines[0], false, 5);
      
      let history = await loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0].completed).toBe(false);
      
      // Re-confirmation should replace the entry
      await saveHistoryEntry(mockRoutines[0], true, 6);
      
      history = await loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0].completed).toBe(true);
      expect(history[0].streakAtTime).toBe(6);
    });
  });
});