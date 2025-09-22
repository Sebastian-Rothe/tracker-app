import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AchievementProvider } from '@/contexts/AchievementContext';
import { setupGlobalErrorHandling } from '@/services/ErrorHandling';

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
      <AchievementProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="achievements" options={{ headerShown: true, title: "Achievements" }} />
            <Stack.Screen name="community" options={{ headerShown: true, title: "Community" }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" backgroundColor="transparent" translucent={true} />
        </ThemeProvider>
      </AchievementProvider>
    </SafeAreaProvider>
  );
}
