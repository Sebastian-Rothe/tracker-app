/**
 * Interactive Progress Indicators
 * Enhanced visual feedback components (simplified without animations)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/Theme';
import { useTheme } from '../contexts/ThemeContext';

// Circular Progress Indicator Props
export interface CircularProgressProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  showText?: boolean;
  centerText?: string;
  style?: any;
}

// Circular Progress Component (Simplified for React Native)
export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  backgroundColor,
  progressColor,
  animated = true,
  showText = true,
  centerText,
  style,
}) => {
  const { theme } = useTheme();
  
  const bgColor = backgroundColor || theme.Colors.gray[200];
  const pColor = progressColor || theme.Colors.primary[500];

  return (
    <View style={[{
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    }, { width: size, height: size }, style]}>
      <View 
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: bgColor,
        }}
      />
      
      {showText && (
        <View style={{
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: theme.Typography.fontSize.lg,
            fontWeight: theme.Typography.fontWeight.bold,
            color: theme.Colors.text.primary,
          }}>
            {centerText || `${Math.round(progress * 100)}%`}
          </Text>
        </View>
      )}
    </View>
  );
};

// Streak Counter Props
export interface StreakCounterProps {
  count: number;
  maxCount?: number;
  animated?: boolean;
  variant?: 'fire' | 'star' | 'heart' | 'trophy';
  style?: any;
}

// Streak Counter Component (Simplified)
export const StreakCounter: React.FC<StreakCounterProps> = ({
  count,
  maxCount = 365,
  animated = true,
  variant = 'fire',
  style,
}) => {
  const { theme } = useTheme();
  const progress = Math.min(count / maxCount, 1);
  
  const getEmoji = () => {
    switch (variant) {
      case 'fire': return '🔥';
      case 'star': return '⭐';
      case 'heart': return '❤️';
      case 'trophy': return '🏆';
      default: return '🔥';
    }
  };

  const getColor = () => {
    if (count === 0) return theme.Colors.gray[400];
    if (count < 7) return theme.Colors.warning[500];
    if (count < 30) return theme.Colors.primary[500];
    return theme.Colors.success[500];
  };

  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.Colors.surface.card,
      borderRadius: theme.BorderRadius.lg,
      padding: theme.Spacing.lg,
      ...theme.Shadows.sm,
    }, style]}>
      <View style={{
        marginRight: theme.Spacing.md,
      }}>
        <Text style={{
          fontSize: theme.Typography.fontSize['2xl'],
        }}>{getEmoji()}</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={[{
          fontSize: theme.Typography.fontSize.lg,
          fontWeight: theme.Typography.fontWeight.bold,
          marginBottom: theme.Spacing.xs,
        }, { color: getColor() }]}>
          {count} {count === 1 ? 'Day' : 'Days'}
        </Text>
        
        {maxCount && (
          <View style={{
            height: 4,
            backgroundColor: theme.Colors.gray[200],
            borderRadius: theme.BorderRadius.full,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${progress * 100}%`,
                backgroundColor: getColor(),
                borderRadius: theme.BorderRadius.full,
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
};

// Achievement Badge Props
export interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  animated?: boolean;
  style?: any;
}

// Achievement Badge Component (Simplified)
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  unlocked,
  progress = 0,
  animated = true,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.Colors.surface.card,
        borderRadius: theme.BorderRadius.lg,
        padding: theme.Spacing.lg,
        marginBottom: theme.Spacing.md,
        ...theme.Shadows.sm,
        opacity: unlocked ? 1 : 0.4,
      }, 
      style
    ]}>
      <View style={[
        {
          width: 50,
          height: 50,
          borderRadius: theme.BorderRadius.full,
          backgroundColor: unlocked ? theme.Colors.success[100] : theme.Colors.gray[200],
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: theme.Spacing.md,
        }
      ]}>
        <Text style={{
          fontSize: theme.Typography.fontSize.xl,
        }}>{icon}</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: theme.Typography.fontSize.base,
          fontWeight: theme.Typography.fontWeight.semibold,
          color: unlocked ? theme.Colors.text.primary : theme.Colors.gray[500],
          marginBottom: theme.Spacing.xs,
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: theme.Typography.fontSize.sm,
          color: theme.Colors.text.secondary,
          marginBottom: theme.Spacing.xs,
        }}>{description}</Text>
        
        {!unlocked && progress > 0 && (
          <View style={{
            height: 3,
            backgroundColor: theme.Colors.gray[200],
            borderRadius: theme.BorderRadius.full,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                backgroundColor: theme.Colors.primary[500],
                borderRadius: theme.BorderRadius.full,
                width: `${progress * 100}%`,
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
};

// Interactive Stats Grid Props
export interface StatsGridProps {
  stats: Array<{
    label: string;
    value: number;
    icon: string;
    color?: string;
  }>;
  animated?: boolean;
  style?: any;
}

// Interactive Stats Grid Component (Simplified)
export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  animated = true,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, style]}>
      {stats.map((stat, index) => {
        return (
          <View key={index} style={{
            width: '48%',
            backgroundColor: theme.Colors.surface.card,
            borderRadius: theme.BorderRadius.lg,
            padding: theme.Spacing.lg,
            alignItems: 'center',
            marginBottom: theme.Spacing.md,
            ...theme.Shadows.sm,
          }}>
            <Text style={{
              fontSize: theme.Typography.fontSize.xl,
              marginBottom: theme.Spacing.sm,
            }}>{stat.icon}</Text>
            <View>
              <Text style={[{
                fontSize: theme.Typography.fontSize['2xl'],
                fontWeight: theme.Typography.fontWeight.bold,
                marginBottom: theme.Spacing.xs,
              }, { color: stat.color || theme.Colors.primary[500] }]}>
                {stat.value}
              </Text>
            </View>
            <Text style={{
              fontSize: theme.Typography.fontSize.sm,
              color: theme.Colors.text.secondary,
              textAlign: 'center',
            }}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Empty StyleSheet - all styles are now dynamic based on theme
});

export default {
  CircularProgress,
  StreakCounter,
  AchievementBadge,
  StatsGrid,
};