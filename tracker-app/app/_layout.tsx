import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { AchievementProvider } from '@/contexts/AchievementContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { setupGlobalErrorHandling } from '@/services/ErrorHandling';

function RootNavigator() {
  const { isDarkMode, theme } = useTheme();
  
  useEffect(() => {
    // Set system UI background color based on theme using proper theme colors
    SystemUI.setBackgroundColorAsync(theme.Colors.surface.background);
  }, [isDarkMode, theme]);
  
  return (
    <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="achievements" options={{ headerShown: false }} />
        {/* <Stack.Screen name="community" options={{ headerShown: true, title: "Community" }} /> */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
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
