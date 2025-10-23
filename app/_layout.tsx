import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar, setStatusBarBackgroundColor, setStatusBarTranslucent } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AchievementProvider } from '@/contexts/AchievementContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { setupGlobalErrorHandling } from '@/services/ErrorHandling';
import { requestNotificationPermissions } from '@/utils/notificationManager';

function RootNavigator() {
  const { isDarkMode, theme } = useTheme();
  
  // Function to force transparent status bar
  const forceTransparentStatusBar = useCallback(() => {
    // Keep system UI background transparent for consistent statusbar
    SystemUI.setBackgroundColorAsync('transparent');
    
    // Force status bar to be transparent on all platforms
    if (Platform.OS === 'android') {
      setStatusBarBackgroundColor('transparent', false);
      setStatusBarTranslucent(true);
    }
  }, []);

  // Force transparent status bar on theme changes
  useEffect(() => {
    forceTransparentStatusBar();
  }, [isDarkMode, theme, forceTransparentStatusBar]);

  // Force transparent status bar on focus (when navigating between screens)
  useFocusEffect(
    useCallback(() => {
      forceTransparentStatusBar();
    }, [forceTransparentStatusBar])
  );

  // Force transparent status bar on app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      if (nextAppState === 'active') {
        forceTransparentStatusBar();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [forceTransparentStatusBar]);

  // Continuously ensure transparent status bar (as fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      forceTransparentStatusBar();
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [forceTransparentStatusBar]);
  
  return (
    <NavigationThemeProvider 
      value={{
        ...(isDarkMode ? DarkTheme : DefaultTheme),
        colors: {
          ...(isDarkMode ? DarkTheme : DefaultTheme).colors,
          // Ensure navigation doesn't override status bar
          background: 'transparent',
        },
      }}
    >
      <Stack
        screenOptions={{
          // Ensure no stack screens override status bar
          statusBarBackgroundColor: 'transparent',
          statusBarTranslucent: true,
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            statusBarBackgroundColor: 'transparent',
            statusBarTranslucent: true,
          }} 
        />
        <Stack.Screen 
          name="achievements" 
          options={{ 
            headerShown: false,
            statusBarBackgroundColor: 'transparent',
            statusBarTranslucent: true,
          }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{
            statusBarBackgroundColor: 'transparent',
            statusBarTranslucent: true,
          }}
        />
      </Stack>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor="transparent" 
        translucent={true} 
        hidden={false}
        animated={false}
      />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Setup global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AchievementProvider>
          <RootNavigator />
        </AchievementProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
