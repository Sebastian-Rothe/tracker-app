/**
 * Modern Design System for Tracker App
 * Enhanced UI/UX - Phase 5 Implementation
 */

/**
 * Modern Design System for Tracker App with Dark Mode Support
 * Enhanced UI/UX - Phase 5 Implementation
 */

// Light Mode Colors
const LightColors = {
  // Primary Brand Colors - 🚀 MODERN OCEAN-TEAL PALETTE!
  primary: {
    50: '#f0fdfa',   // Soft teal tint
    100: '#ccfbf1', 
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // Modern teal - calming and professional
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  
  // Success Colors (for streaks and completions)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Main success color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Main warning color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Main error color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main info color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Neutral Colors - 🚀 MODERN SLATE PALETTE!
  gray: {
    50: '#f8fafc',  // Slate-based grays für moderne Optik
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Surface Colors - 🚀 WARM & INVITING DESIGN!
  surface: {
    background: '#fafafb', // Warm off-white mit subtilen Beige-Tönen
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
    border: '#e4e7ec', // Wärmere Border mit Beige-Unterton
    divider: '#f2f4f7', // Sanfte Divider mit warmem Undertone
  },
  
  // Accent Colors - 🚀 NEUE WARM ACCENTS!
  accent: {
    purple: '#8b5cf6',   // Für besondere Highlights
    emerald: '#10b981',  // Für Success States
    amber: '#f59e0b',    // Für Warnings
    rose: '#f43f5e',     // Für Errors/Attention
  },
  
  // Text Colors - 🚀 WARME, LESBARE KONTRASTE!
  text: {
    primary: '#1f2937', // Wärmeres Anthrazit statt kaltes Schwarz
    secondary: '#6b7280', // Balanced warm gray
    tertiary: '#9ca3af', // Soft tertiary mit warmem Unterton
    inverse: '#ffffff',
    success: '#059669',  // Bleibt grün für Klarheit
    warning: '#d97706',  // Warmes Orange
    error: '#dc2626',    // Klares Rot
  },
};

// Dark Mode Colors
const DarkColors = {
  // Primary Brand Colors (teal for dark mode)
  primary: {
    50: '#134e4a',
    100: '#115e59', 
    200: '#0f766e',
    300: '#0d9488',
    400: '#14b8a6',
    500: '#2dd4bf',  // Brighter teal in dark mode
    600: '#5eead4',
    700: '#99f6e4',
    800: '#ccfbf1',
    900: '#f0fdfa',
  },
  
  // Success Colors
  success: {
    50: '#14532d',
    100: '#166534',
    200: '#15803d',
    300: '#16a34a',
    400: '#22c55e',
    500: '#4ade80',  // Brighter in dark mode
    600: '#86efac',
    700: '#bbf7d0',
    800: '#dcfce7',
    900: '#f0fdf4',
  },
  
  // Warning Colors
  warning: {
    50: '#78350f',
    100: '#92400e',
    200: '#b45309',
    300: '#d97706',
    400: '#f59e0b',
    500: '#fbbf24',  // Brighter in dark mode
    600: '#fcd34d',
    700: '#fde68a',
    800: '#fef3c7',
    900: '#fffbeb',
  },
  
  // Error Colors
  error: {
    50: '#7f1d1d',
    100: '#991b1b',
    200: '#b91c1c',
    300: '#dc2626',
    400: '#ef4444',
    500: '#f87171',  // Brighter in dark mode
    600: '#fca5a5',
    700: '#fecaca',
    800: '#fee2e2',
    900: '#fef2f2',
  },
  info: {
    50: '#1e3a8a',
    100: '#1e40af',
    200: '#1d4ed8',
    300: '#2563eb',
    400: '#3b82f6',
    500: '#60a5fa',  // Brighter in dark mode
    600: '#93c5fd',
    700: '#bfdbfe',
    800: '#dbeafe',
    900: '#eff6ff',
  },
  
  // Neutral Colors (inverted for dark mode)
  gray: {
    50: '#111827',
    100: '#1f2937',
    200: '#374151',
    300: '#4b5563',
    400: '#6b7280',
    500: '#9ca3af',
    600: '#d1d5db',
    700: '#e5e7eb',
    800: '#f3f4f6',
    900: '#f9fafb',
  },
  
  // Surface Colors (dark variants)
  surface: {
    background: '#111827',
    card: '#1f2937',
    overlay: 'rgba(0, 0, 0, 0.8)',
    border: '#374151',
    divider: '#4b5563',
  },
  
  // Text Colors (inverted for dark mode)
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
    inverse: '#111827',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
  },
  
  // Accent Colors - 🚀 DARK MODE ACCENTS!
  accent: {
    purple: '#a855f7',   // Heller für Dark Mode
    emerald: '#34d399',  // Leuchtender für Dark Mode
    amber: '#fbbf24',    // Heller für Dark Mode
    rose: '#fb7185',     // Softer für Dark Mode
  },
};

export type ThemeMode = 'light' | 'dark';
export type WallpaperType = 'none' | 'deep-blue' | 'sunset-orange' | 'forest-teal' | 'royal-purple' | 'midnight-navy' | 'light-sky' | 'soft-mint';

// Wallpaper configurations - Mix of dark and light designs with unique colors and patterns
export const Wallpapers = {
  none: {
    type: 'none' as const,
    name: 'Keine',
  },
  'deep-blue': {
    type: 'gradient' as const,
    name: 'Tiefblau',
    colors: ['#1e3a8a', '#0f172a'], // Deep blue to navy black
  },
  'sunset-orange': {
    type: 'geometric' as const,
    name: 'Sonnenuntergang',
    colors: ['#c2410c', '#7c2d12'], // Burnt orange to dark brown
  },
  'forest-teal': {
    type: 'organic' as const,
    name: 'Waldgrün',
    colors: ['#0f766e', '#134e4a'], // Deep teal forest colors
  },
  'royal-purple': {
    type: 'dots' as const,
    name: 'Königsviolett',
    colors: ['#7c3aed', '#3730a3'], // Rich purple variations
  },
  'midnight-navy': {
    type: 'waves' as const,
    name: 'Mitternacht',
    colors: ['#1e40af', '#1e293b'], // Navy to slate dark
  },
  'light-sky': {
    type: 'gradient' as const,
    name: 'Himmelblau',
    colors: ['#e0f2fe', '#bae6fd'], // Very light sky blue gradient
  },
  'soft-mint': {
    type: 'organic' as const,
    name: 'Sanfte Minze',
    colors: ['#f0fdf4', '#dcfce7'], // Very light mint green
  },
};

export const getColors = (mode: ThemeMode = 'light') => {
  return mode === 'dark' ? DarkColors : LightColors;
};

export const getWallpaper = (wallpaper: WallpaperType) => {
  return Wallpapers[wallpaper];
};

// Default to light mode for backward compatibility
export const Colors = LightColors;

export const Typography = {
  // Font Families
  fonts: {
    heading: 'System',
    body: 'System',
    mono: 'Courier',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const Spacing = {
  // Base spacing unit (4px)
  unit: 4,
  
  // Common spacing values
  xs: 4,   // 1 unit
  sm: 8,   // 2 units
  md: 12,  // 3 units
  lg: 14,  // 4 units
  xl: 20,  // 5 units
  '2xl': 24, // 6 units
  '3xl': 32, // 8 units
  '4xl': 40, // 10 units
  '5xl': 48, // 12 units
  '6xl': 64, // 16 units
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    elevation: 1,
  },
  md: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    elevation: 3,
  },
  lg: {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    elevation: 6,
  },
  xl: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    elevation: 10,
  },
};

export const Layout = {
  // Container widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Common dimensions
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },
    minWidth: {
      sm: 80,
      md: 100,
      lg: 120,
      xl: 140,
    },
  },
  
  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
};

export const Animation = {
  // Duration
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Easing
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    linear: 'linear',
  },
};

// Component-specific styles
export const getComponents = (colors: typeof LightColors) => ({
  // Button variants
  button: {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.text.inverse,
    },
    secondary: {
      backgroundColor: colors.gray[100],
      color: colors.text.primary,
    },
    success: {
      backgroundColor: colors.success[500],
      color: colors.text.inverse,
    },
    warning: {
      backgroundColor: colors.warning[500],
      color: colors.text.inverse,
    },
    error: {
      backgroundColor: colors.error[500],
      color: colors.text.inverse,
    },
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
});

// Create theme function that supports both light and dark mode
export const createTheme = (mode: ThemeMode = 'light') => {
  const colors = getColors(mode);
  
  return {
    Colors: colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
    Layout,
    Animation,
    Components: getComponents(colors),
    mode,
  };
};

// Export complete theme object (default light mode for backward compatibility)
export const Theme = createTheme('light');

export default Theme;
