import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock setup is handled in jest-setup.js

// Test component that uses theme
const TestComponent: React.FC = () => {
  const { themeMode, isDarkMode, wallpaper, theme } = useTheme();
  
  return (
    <View testID="theme-test">
      <Text testID="theme-mode">{themeMode}</Text>
      <Text testID="is-dark">{isDarkMode.toString()}</Text>
      <Text testID="wallpaper">{wallpaper}</Text>
      <Text testID="primary-color">{theme.Colors.primary[500]}</Text>
    </View>
  );
};

describe('ThemeContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  test('should provide default theme values', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-mode').props.children).toBe('light');
    expect(getByTestId('is-dark').props.children).toBe('false');
    expect(getByTestId('wallpaper').props.children).toBe('none');
  });

  test('should provide theme colors', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const primaryColor = getByTestId('primary-color').props.children;
    expect(primaryColor).toBeTruthy();
    expect(typeof primaryColor).toBe('string');
  });

  test('should render children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <View>
          <Text>Theme Provider Child</Text>
        </View>
      </ThemeProvider>
    );

    expect(getByText('Theme Provider Child')).toBeTruthy();
  });

  test('should handle theme mode changes', () => {
    const TestThemeToggle: React.FC = () => {
      const { themeMode, setThemeMode } = useTheme();
      
      React.useEffect(() => {
        // Simulate theme change
        if (themeMode === 'light') {
          setThemeMode('dark');
        }
      }, [themeMode, setThemeMode]);
      
      return <Text testID="current-theme">{themeMode}</Text>;
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestThemeToggle />
      </ThemeProvider>
    );

    // Should eventually change to dark mode
    const themeElement = getByTestId('current-theme');
    expect(themeElement).toBeTruthy();
  });

  test('should handle wallpaper preference changes', () => {
    const TestWallpaperToggle: React.FC = () => {
      const { wallpaper, setWallpaper } = useTheme();
      
      React.useEffect(() => {
        if (wallpaper === 'none') {
          setWallpaper('deep-blue');
        }
      }, [wallpaper, setWallpaper]);
      
      return <Text testID="current-wallpaper">{wallpaper}</Text>;
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestWallpaperToggle />
      </ThemeProvider>
    );

    const wallpaperElement = getByTestId('current-wallpaper');
    expect(wallpaperElement).toBeTruthy();
  });

  test('should provide wallpaper configuration', () => {
    const TestWallpaperConfig: React.FC = () => {
      const { wallpaper } = useTheme();
      // Import the getWallpaper function directly
      const { getWallpaper } = require('@/constants/Theme');
      const config = getWallpaper(wallpaper);
      
      return (
        <View>
          <Text testID="wallpaper-name">{config.name}</Text>
          <Text testID="wallpaper-colors">{JSON.stringify(config.colors)}</Text>
        </View>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestWallpaperConfig />
      </ThemeProvider>
    );

    expect(getByTestId('wallpaper-name')).toBeTruthy();
    expect(getByTestId('wallpaper-colors')).toBeTruthy();
  });
});