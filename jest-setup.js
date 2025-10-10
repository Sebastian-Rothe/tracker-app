// Mock global components before any imports
global.__reanimatedWorkletInit = jest.fn();

// Mock DevMenu directly
jest.mock('react-native/src/private/devsupport/devmenu/DevMenu', () => ({
  show: jest.fn(),
  hide: jest.fn(),
  reload: jest.fn(),
  debugRemoteJS: jest.fn(),
  setProfilingEnabled: jest.fn(),
  setHotLoadingEnabled: jest.fn(),
  setLiveReloadEnabled: jest.fn(),
}));

// Mock the DevMenu spec
jest.mock('react-native/src/private/devsupport/devmenu/specs/NativeDevMenu', () => ({
  show: jest.fn(),
  hide: jest.fn(),
  reload: jest.fn(),
  debugRemoteJS: jest.fn(),
  setProfilingEnabled: jest.fn(),
  setHotLoadingEnabled: jest.fn(),
  setLiveReloadEnabled: jest.fn(),
}));

import 'react-native-gesture-handler/jestSetup';

// Prevent window redefinition errors
jest.mock('react-native/jest/setup', () => {});

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((options) => options.ios || options.default),
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(),
      removeChangeListener: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    CALENDAR: 'calendar'
  }
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 44,
    right: 0,
    bottom: 34,
    left: 0,
  }),
}));

// Mock Theme Context
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      Colors: {
        primary: { 500: '#0ea5e9' },
        success: { 500: '#10b981', 50: '#ecfdf5' },
        warning: { 500: '#f59e0b', 400: '#fbbf24', 300: '#fcd34d', 200: '#fef3c7' },
        error: { 500: '#ef4444' },
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
        },
        surface: {
          background: '#ffffff',
          card: '#ffffff',
          overlay: 'rgba(0, 0, 0, 0.1)',
          border: '#e5e7eb',
        },
        gray: { 300: '#d1d5db' },
        info: { 50: '#eff6ff' },
      },
      Typography: {
        fontSize: {
          xl: 20,
          lg: 18,
          base: 16,
          sm: 14,
          '2xl': 24,
        },
        fontWeight: {
          bold: '700',
          semibold: '600',
        },
      },
      Spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
      },
      BorderRadius: {
        lg: 12,
        xl: 16,
        full: 9999,
      },
      Shadows: {
        sm: {},
        md: {},
      },
    },
    isDarkMode: false,
    themeMode: 'light',
    setThemeMode: jest.fn(),
    isAutoMode: false,
  }),
}));

global.__reanimatedWorkletInit = jest.fn();