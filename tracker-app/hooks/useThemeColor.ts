/**
 * Modern theme color hook using the unified Theme system
 */

import { useTheme } from '@/contexts/ThemeContext';

// Legacy color mapping for backward compatibility
const colorMapping = {
  text: (colors: any) => colors.text.primary,
  background: (colors: any) => colors.surface.background,
  tint: (colors: any) => colors.primary[500],
  icon: (colors: any) => colors.text.secondary,
  tabIconDefault: (colors: any) => colors.text.secondary,
  tabIconSelected: (colors: any) => colors.primary[500],
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof colorMapping
) {
  const { theme, isDarkMode } = useTheme();
  const colorFromProps = props[isDarkMode ? 'dark' : 'light'];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const colorGetter = colorMapping[colorName];
    return colorGetter ? colorGetter(theme.Colors) : theme.Colors.text.primary;
  }
}
