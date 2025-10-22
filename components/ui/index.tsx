/**
 * Modern UI Components for Enhanced UX
 * Based on the new Design System (simplified without animations)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Theme } from '../../constants/Theme';
import { useTheme } from '../../contexts/ThemeContext';

// Button Component Types
export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// Modern Button Component (Simplified)
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  
  const getButtonColors = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.Colors.primary[500],
          color: theme.Colors.text.inverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.Colors.gray[100],
          color: theme.Colors.text.primary,
        };
      case 'success':
        return {
          backgroundColor: theme.Colors.success[500],
          color: theme.Colors.text.inverse,
        };
      default:
        return {
          backgroundColor: theme.Colors.primary[500],
          color: theme.Colors.text.inverse,
        };
    }
  };
  
  const colors = getButtonColors(variant);
  const buttonStyle: any[] = [
    styles.button,
    styles[`button_${size}` as keyof typeof styles],
    {
      backgroundColor: colors.backgroundColor,
    },
    fullWidth && styles.button_fullWidth,
    (disabled || loading) && styles.button_disabled,
    style,
  ];

  const textStyle: any[] = [
    styles.buttonText,
    styles[`buttonText_${size}` as keyof typeof styles],
    {
      color: colors.color,
    },
    (disabled || loading) && styles.buttonText_disabled,
  ];

  const handlePress = (event: any) => {
    if (!disabled && !loading && onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'secondary' || variant === 'ghost' ? Theme.Colors.primary[500] : Theme.Colors.text.inverse}
            size="small"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text style={textStyle}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Card Component Types
export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Theme.Spacing;
  shadow?: keyof typeof Theme.Shadows;
  borderRadius?: keyof typeof Theme.BorderRadius;
}

// Modern Card Component
export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'lg',
  shadow = 'md',
  borderRadius = 'lg',
}) => {
  const { theme } = useTheme();
  
  const cardStyle = [
    {
      backgroundColor: theme.Colors.surface.card,
      padding: theme.Spacing[padding],
      borderRadius: theme.BorderRadius[borderRadius],
      ...theme.Shadows[shadow],
    },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

// Badge Component Types
export interface BadgeProps {
  count: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

// Modern Badge Component
export const Badge: React.FC<BadgeProps> = ({
  count,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const badgeStyle: any[] = [
    styles.badge,
    styles[`badge_${size}` as keyof typeof styles],
    styles[`badge_${variant}` as keyof typeof styles],
    style,
  ];

  const textStyle: any[] = [
    styles.badgeText,
    styles[`badgeText_${size}` as keyof typeof styles],
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{count > 99 ? '99+' : count.toString()}</Text>
    </View>
  );
};

// Progress Bar Component Types
export interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  animated?: boolean;
  style?: ViewStyle;
}

// Modern Progress Bar Component (Simplified)
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = Theme.Colors.gray[200],
  progressColor = Theme.Colors.success[500],
  borderRadius = Theme.BorderRadius.full,
  animated = true,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[
        styles.progressContainer,
        {
          height,
          backgroundColor,
          borderRadius,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.progressBar,
          {
            backgroundColor: progressColor,
            borderRadius,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // Button Styles
  button: {
    borderRadius: Theme.BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.Shadows.sm,
  },
  
  // Button Sizes
  button_sm: {
    height: Theme.Layout.button.height.sm,
    paddingHorizontal: Theme.Spacing.md,
    minWidth: Theme.Layout.button.minWidth.sm,
  },
  button_md: {
    height: Theme.Layout.button.height.md,
    paddingHorizontal: Theme.Spacing.lg,
    minWidth: Theme.Layout.button.minWidth.md,
  },
  button_lg: {
    height: Theme.Layout.button.height.lg,
    paddingHorizontal: Theme.Spacing.xl,
    minWidth: Theme.Layout.button.minWidth.lg,
  },
  button_xl: {
    height: Theme.Layout.button.height.xl,
    paddingHorizontal: Theme.Spacing['2xl'],
    minWidth: Theme.Layout.button.minWidth.xl,
  },
  
  // Button Variants
  button_primary: {
    backgroundColor: Theme.Colors.primary[500],
  },
  button_secondary: {
    backgroundColor: Theme.Colors.gray[100],
    borderWidth: 1,
    borderColor: Theme.Colors.gray[300],
  },
  button_success: {
    backgroundColor: Theme.Colors.success[500],
  },
  button_warning: {
    backgroundColor: Theme.Colors.warning[500],
  },
  button_error: {
    backgroundColor: Theme.Colors.error[500],
  },
  button_ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  button_fullWidth: {
    width: '100%',
  },
  
  button_disabled: {
    opacity: 0.6,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconLeft: {
    marginRight: Theme.Spacing.sm,
  },
  
  iconRight: {
    marginLeft: Theme.Spacing.sm,
  },
  
  // Button Text Styles
  buttonText: {
    fontWeight: Theme.Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  
  buttonText_sm: {
    fontSize: Theme.Typography.fontSize.sm,
  },
  buttonText_md: {
    fontSize: Theme.Typography.fontSize.base,
  },
  buttonText_lg: {
    fontSize: Theme.Typography.fontSize.lg,
  },
  buttonText_xl: {
    fontSize: Theme.Typography.fontSize.xl,
  },
  
  buttonText_primary: {
    color: Theme.Colors.text.inverse,
  },
  buttonText_secondary: {
    color: Theme.Colors.text.primary,
  },
  buttonText_success: {
    color: Theme.Colors.text.inverse,
  },
  buttonText_warning: {
    color: Theme.Colors.text.inverse,
  },
  buttonText_error: {
    color: Theme.Colors.text.inverse,
  },
  buttonText_ghost: {
    color: Theme.Colors.primary[500],
  },
  
  buttonText_disabled: {
    opacity: 0.7,
  },
  
  // Card Styles
  card: {
    backgroundColor: Theme.Colors.surface.card,
    borderWidth: 1,
    borderColor: Theme.Colors.surface.border,
  },
  
  // Badge Styles
  badge: {
    borderRadius: Theme.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  
  badge_sm: {
    height: 16,
    paddingHorizontal: Theme.Spacing.xs,
  },
  badge_md: {
    height: 20,
    paddingHorizontal: Theme.Spacing.sm,
  },
  badge_lg: {
    height: 24,
    paddingHorizontal: Theme.Spacing.md,
  },
  
  badge_primary: {
    backgroundColor: Theme.Colors.primary[500],
  },
  badge_success: {
    backgroundColor: Theme.Colors.success[500],
  },
  badge_warning: {
    backgroundColor: Theme.Colors.warning[500],
  },
  badge_error: {
    backgroundColor: Theme.Colors.error[500],
  },
  
  badgeText: {
    color: Theme.Colors.text.inverse,
    fontWeight: Theme.Typography.fontWeight.semibold,
  },
  
  badgeText_sm: {
    fontSize: Theme.Typography.fontSize.xs,
  },
  badgeText_md: {
    fontSize: Theme.Typography.fontSize.sm,
  },
  badgeText_lg: {
    fontSize: Theme.Typography.fontSize.base,
  },
  
  // Progress Bar Styles
  progressContainer: {
    overflow: 'hidden',
  },
  
  progressBar: {
    height: '100%',
  },
});

export default {
  Button,
  Card,
  Badge,
  ProgressBar,
};
