/**
 * Theme Context for Dark Mode Support
 * Manages app-wide theme state and provides theme switching functionality
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { createTheme, ThemeMode, WallpaperType, getWallpaper } from '@/constants/Theme';

type Theme = ReturnType<typeof createTheme>;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode | 'auto') => void;
  isDarkMode: boolean;
  isAutoMode: boolean;
  wallpaper: WallpaperType;
  setWallpaper: (wallpaper: WallpaperType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_preference';
const WALLPAPER_STORAGE_KEY = 'wallpaper_preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setInternalThemeMode] = useState<ThemeMode>('light');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperType>('none');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Calculate effective theme mode
  const effectiveThemeMode: ThemeMode = isAutoMode 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const theme = createTheme(effectiveThemeMode);
  const isDarkMode = effectiveThemeMode === 'dark';

  // Load saved theme and wallpaper preferences on app start
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedWallpaper] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(WALLPAPER_STORAGE_KEY)
        ]);
        
        if (savedTheme) {
          if (savedTheme === 'auto') {
            setIsAutoMode(true);
            setInternalThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
          } else {
            setIsAutoMode(false);
            setInternalThemeMode(savedTheme as ThemeMode);
          }
        } else {
          // Default to auto mode (System Default) if no preference saved
          setIsAutoMode(true);
          setInternalThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
        
        if (savedWallpaper) {
          setWallpaper(savedWallpaper as WallpaperType);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Listen to system color scheme changes when in auto mode
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
      if (isAutoMode) {
        setInternalThemeMode(colorScheme === 'dark' ? 'dark' : 'light');
      }
    });

    return () => subscription?.remove();
  }, [isAutoMode]);

  // Save theme preference when it changes
  const setThemeMode = async (mode: ThemeMode | 'auto') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      if (mode === 'auto') {
        setIsAutoMode(true);
        setInternalThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
      } else {
        setIsAutoMode(false);
        setInternalThemeMode(mode);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Save wallpaper preference when it changes
  const setWallpaperPreference = async (newWallpaper: WallpaperType) => {
    try {
      await AsyncStorage.setItem(WALLPAPER_STORAGE_KEY, newWallpaper);
      setWallpaper(newWallpaper);
    } catch (error) {
      console.error('Error saving wallpaper preference:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeMode: effectiveThemeMode,
    setThemeMode,
    isDarkMode,
    isAutoMode,
    wallpaper,
    setWallpaper: setWallpaperPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;