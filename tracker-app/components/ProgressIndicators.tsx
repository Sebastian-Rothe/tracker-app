/**
 * Interactive Progress Indicators
 * Enhanced visual feedback components (simplified without animations)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/Theme';

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
  backgroundColor = Theme.Colors.gray[200],
  progressColor = Theme.Colors.primary[500],
  animated = true,
  showText = true,
  centerText,
  style,
}) => {
  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      <View 
        style={[
          styles.circularRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />
      
      {showText && (
        <View style={styles.circularTextContainer}>
          <Text style={styles.circularText}>
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
    if (count === 0) return Theme.Colors.gray[400];
    if (count < 7) return Theme.Colors.warning[500];
    if (count < 30) return Theme.Colors.primary[500];
    return Theme.Colors.success[500];
  };

  return (
    <View style={[styles.streakContainer, style]}>
      <View style={styles.streakIconContainer}>
        <Text style={styles.streakEmoji}>{getEmoji()}</Text>
      </View>
      
      <View style={styles.streakInfo}>
        <Text style={[styles.streakCount, { color: getColor() }]}>
          {count} {count === 1 ? 'Day' : 'Days'}
        </Text>
        
        {maxCount && (
          <View style={styles.streakProgressContainer}>
            <View 
              style={[
                styles.streakProgressBar, 
                { backgroundColor: Theme.Colors.gray[200] }
              ]} 
            />
            <View
              style={[
                styles.streakProgressFill,
                {
                  backgroundColor: getColor(),
                  width: `${progress * 100}%`,
                },
              ]}
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
  return (
    <View style={[
      styles.achievementContainer, 
      { opacity: unlocked ? 1 : 0.4 }, 
      style
    ]}>
      <View style={[styles.achievementIcon, unlocked && styles.achievementIconUnlocked]}>
        <Text style={styles.achievementEmoji}>{icon}</Text>
      </View>
      
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, unlocked && styles.achievementTitleUnlocked]}>
          {title}
        </Text>
        <Text style={styles.achievementDescription}>{description}</Text>
        
        {!unlocked && progress > 0 && (
          <View style={styles.achievementProgressContainer}>
            <View style={styles.achievementProgressBackground} />
            <View
              style={[
                styles.achievementProgressFill,
                { width: `${progress * 100}%` },
              ]}
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
  return (
    <View style={[styles.statsGrid, style]}>
      {stats.map((stat, index) => {
        return (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <View>
              <Text style={[styles.statValue, { color: stat.color || Theme.Colors.primary[500] }]}>
                {stat.value}
              </Text>
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Circular Progress Styles
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularRing: {
    position: 'absolute',
  },
  circularTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularText: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },

  // Streak Counter Styles
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.Colors.surface.card,
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.lg,
    ...Theme.Shadows.sm,
  },
  streakIconContainer: {
    marginRight: Theme.Spacing.md,
  },
  streakEmoji: {
    fontSize: Theme.Typography.fontSize['2xl'],
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.xs,
  },
  streakProgressContainer: {
    height: 4,
    backgroundColor: Theme.Colors.gray[200],
    borderRadius: Theme.BorderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  streakProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  streakProgressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: Theme.BorderRadius.full,
  },

  // Achievement Badge Styles
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.Colors.surface.card,
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.md,
    ...Theme.Shadows.sm,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: Theme.BorderRadius.full,
    backgroundColor: Theme.Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.Spacing.md,
  },
  achievementIconUnlocked: {
    backgroundColor: Theme.Colors.success[100],
  },
  achievementEmoji: {
    fontSize: Theme.Typography.fontSize.xl,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.semibold,
    color: Theme.Colors.gray[500],
    marginBottom: Theme.Spacing.xs,
  },
  achievementTitleUnlocked: {
    color: Theme.Colors.text.primary,
  },
  achievementDescription: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
    marginBottom: Theme.Spacing.xs,
  },
  achievementProgressContainer: {
    height: 3,
    backgroundColor: Theme.Colors.gray[200],
    borderRadius: Theme.BorderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  achievementProgressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.Colors.gray[200],
  },
  achievementProgressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: Theme.Colors.primary[500],
    borderRadius: Theme.BorderRadius.full,
  },

  // Stats Grid Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: Theme.Colors.surface.card,
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.lg,
    alignItems: 'center',
    marginBottom: Theme.Spacing.md,
    ...Theme.Shadows.sm,
  },
  statIcon: {
    fontSize: Theme.Typography.fontSize.xl,
    marginBottom: Theme.Spacing.sm,
  },
  statValue: {
    fontSize: Theme.Typography.fontSize['2xl'],
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.xs,
  },
  statLabel: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
});

export default {
  CircularProgress,
  StreakCounter,
  AchievementBadge,
  StatsGrid,
};