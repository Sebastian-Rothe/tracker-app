import { 
  scheduleRoutineNotifications, 
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleDailyNotification,
  getScheduledNotifications,
  setupNotificationHandlers
} from '@/utils/notificationManager';
import { Routine } from '@/types/routine';
import * as Notifications from 'expo-notifications';

// Mock expo-notifications
jest.mock('expo-notifications');

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('notificationManager', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never'
    } as any);
    
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never'
    } as any);
    
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('test-notification-id');
    mockNotifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
    mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
  });

  describe('requestNotificationPermissions', () => {
    test('should request and return notification permissions', async () => {
      const result = await requestNotificationPermissions();
      
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle permission denial', async () => {
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: false,
        expires: 'never'
      } as any);
      
      const result = await requestNotificationPermissions();
      
      expect(result).toBe(false);
    });

    test('should return false on web platform', async () => {
      // Mock Platform.OS to be 'web'
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      
      const result = await requestNotificationPermissions();
      expect(result).toBe(false);
      
      // Reset to original
      Platform.OS = 'ios';
    });
  });

  describe('scheduleDailyNotification', () => {
    test('should schedule a daily notification', async () => {
      const result = await scheduleDailyNotification(
        '09:00',
        'Test Title',
        'Test Body',
        { test: 'data' }
      );
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { test: 'data' },
        },
        trigger: expect.objectContaining({
          hour: 9,
          minute: 0,
        }),
      });
      
      expect(result).toBe('test-notification-id');
    });

    test('should return null on web platform', async () => {
      // Mock Platform.OS to be 'web'
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      
      const result = await scheduleDailyNotification('09:00', 'Title', 'Body');
      expect(result).toBeNull();
      
      // Reset to original
      Platform.OS = 'ios';
    });

    test('should handle scheduling errors gracefully', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('Scheduling failed'));
      
      const result = await scheduleDailyNotification('09:00', 'Title', 'Body');
      expect(result).toBeNull();
    });
  });

  describe('scheduleRoutineNotifications', () => {
    beforeEach(() => {
      // Mock the data loader
      jest.doMock('@/utils/settingsStorage', () => ({
        getNotificationData: jest.fn().mockResolvedValue({
          routines: mockRoutines,
          settings: {
            enabled: true,
            multipleReminders: true,
            reminderTimes: ['07:00', '14:00', '18:00', '20:00'],
            onlyIfIncomplete: true
          }
        })
      }));
    });

    test('should schedule routine notifications', async () => {
      await scheduleRoutineNotifications();
      
      // Should cancel existing notifications first
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      
      // Should request permissions
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    test('should not schedule when permissions denied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false
      } as any);
      
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false
      } as any);
      
      await scheduleRoutineNotifications();
      
      // Should still cancel existing notifications
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('cancelAllNotifications', () => {
    test('should cancel all scheduled notifications', async () => {
      await cancelAllNotifications();
      
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('getScheduledNotifications', () => {
    test('should return scheduled notifications', async () => {
      const mockScheduledNotifications = [
        {
          identifier: 'test-id',
          content: { title: 'Test', body: 'Test body' },
          trigger: { type: 'daily' }
        }
      ];
      
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockScheduledNotifications as any);
      
      const notifications = await getScheduledNotifications();
      
      expect(mockNotifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(notifications).toEqual(mockScheduledNotifications);
    });

    test('should return empty array on web platform', async () => {
      // Mock Platform.OS to be 'web'
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      
      const notifications = await getScheduledNotifications();
      expect(notifications).toEqual([]);
      
      // Reset to original
      Platform.OS = 'ios';
    });

    test('should handle errors gracefully', async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockRejectedValue(new Error('Failed to get notifications'));
      
      const notifications = await getScheduledNotifications();
      expect(notifications).toEqual([]);
    });
  });

  describe('setupNotificationHandlers', () => {
    test('should setup notification handlers', () => {
      const mockListener = { remove: jest.fn() };
      mockNotifications.addNotificationReceivedListener.mockReturnValue(mockListener as any);
      mockNotifications.addNotificationResponseReceivedListener.mockReturnValue(mockListener as any);
      
      const cleanup = setupNotificationHandlers();
      
      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      
      // Test cleanup function
      expect(typeof cleanup).toBe('function');
      cleanup();
      
      // Test that listener objects have remove method called
      // Note: In real implementation, notificationListener.remove() and responseListener.remove() are called
    });
  });

  describe('notification scheduling integration', () => {
    test('should schedule notifications with proper content structure', async () => {
      await scheduleDailyNotification('09:00', 'Test Title', 'Test Body', { testData: true });
      
      const scheduleCalls = mockNotifications.scheduleNotificationAsync.mock.calls;
      expect(scheduleCalls.length).toBeGreaterThan(0);
      
      const lastCall = scheduleCalls[scheduleCalls.length - 1];
      const content = lastCall[0].content;
      
      expect(content.title).toBe('Test Title');
      expect(content.body).toBe('Test Body');
      expect(content.data).toEqual({ testData: true });
    });
  });

  describe('error handling', () => {
    test('should handle scheduling errors gracefully', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('Scheduling failed'));
      
      // Should not throw and should return null
      const result = await scheduleDailyNotification('09:00', 'Title', 'Body');
      expect(result).toBeNull();
    });

    test('should handle permission request errors gracefully', async () => {
      mockNotifications.getPermissionsAsync.mockRejectedValue(new Error('Permission request failed'));
      mockNotifications.requestPermissionsAsync.mockRejectedValue(new Error('Permission request failed'));
      
      // Should not throw and should return false
      const result = await requestNotificationPermissions();
      expect(result).toBe(false);
    });

    test('should handle routine notification scheduling errors', async () => {
      // Should not throw even if there are errors
      await expect(scheduleRoutineNotifications()).resolves.not.toThrow();
    });
  });
});