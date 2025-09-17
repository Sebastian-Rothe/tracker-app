import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '@/constants/Theme';
import { Achievement } from '@/utils/achievementManager';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  style?: any;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  onPress, 
  style,
  size = 'medium' 
}) => {
  const isUnlocked = achievement.isUnlocked;
  const progress = achievement.progress;
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: styles.iconSmall,
          title: styles.titleSmall,
          description: styles.descriptionSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: styles.iconLarge,
          title: styles.titleLarge,
          description: styles.descriptionLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          icon: styles.iconMedium,
          title: styles.titleMedium,
          description: styles.descriptionMedium,
        };
    }
  };
  
  const getCategoryColor = (category: Achievement['category']): string => {
    switch (category) {
      case 'streak': return Theme.Colors.warning[500];
      case 'consistency': return Theme.Colors.success[500];
      case 'milestone': return Theme.Colors.primary[500];
      case 'special': return Theme.Colors.info[500];
      default: return Theme.Colors.gray[500];
    }
  };
  
  const sizeStyles = getSizeStyles();
  const categoryColor = getCategoryColor(achievement.category);
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        {
          backgroundColor: isUnlocked ? '#ffffff' : Theme.Colors.gray[100],
          borderLeftColor: categoryColor,
          opacity: isUnlocked ? 1 : 0.7,
        },
        style
      ]}
      onPress={() => onPress?.(achievement)}
      disabled={!onPress}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { opacity: isUnlocked ? 1 : 0.5 }]}>
        <Text style={[styles.icon, sizeStyles.icon]}>
          {achievement.icon}
        </Text>
        {isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedBadgeText}>✓</Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={[
          styles.title, 
          sizeStyles.title,
          { color: isUnlocked ? Theme.Colors.text.primary : Theme.Colors.text.secondary }
        ]}>
          {achievement.title}
        </Text>
        
        <Text style={[
          styles.description, 
          sizeStyles.description,
          { color: isUnlocked ? Theme.Colors.text.secondary : Theme.Colors.text.tertiary }
        ]}>
          {achievement.description}
        </Text>
        
        {/* Progress Bar */}
        {!isUnlocked && size !== 'small' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${progress * 100}%`,
                    backgroundColor: categoryColor,
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
        
        {/* Unlocked Date */}
        {isUnlocked && achievement.unlockedAt && size === 'large' && (
          <Text style={styles.unlockedDate}>
            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      
      {/* Category Badge */}
      {size === 'large' && (
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>
            {achievement.category.toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface AchievementGridProps {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
  columns?: number;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  onAchievementPress,
  columns = 2,
  size = 'medium'
}) => {
  return (
    <View style={styles.grid}>
      {achievements.map((achievement, index) => (
        <View 
          key={achievement.id} 
          style={[
            styles.gridItem,
            { width: `${100 / columns - 2}%` }
          ]}
        >
          <AchievementCard
            achievement={achievement}
            onPress={onAchievementPress}
            size={size}
          />
        </View>
      ))}
    </View>
  );
};

interface AchievementProgressProps {
  total: number;
  unlocked: number;
  style?: any;
}

export const AchievementProgress: React.FC<AchievementProgressProps> = ({
  total,
  unlocked,
  style
}) => {
  const progress = total > 0 ? unlocked / total : 0;
  
  return (
    <View style={[styles.progressSummary, style]}>
      <View style={styles.progressSummaryHeader}>
        <Text style={styles.progressSummaryTitle}>Achievement Progress</Text>
        <Text style={styles.progressSummaryValue}>
          {unlocked}/{total}
        </Text>
      </View>
      
      <View style={styles.progressSummaryBar}>
        <View 
          style={[
            styles.progressSummaryFill,
            { width: `${progress * 100}%` }
          ]}
        />
      </View>
      
      <Text style={styles.progressSummaryText}>
        {Math.round(progress * 100)}% Complete
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.md,
    marginBottom: Theme.Spacing.md,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerSmall: {
    padding: Theme.Spacing.sm,
    marginBottom: Theme.Spacing.sm,
  },
  containerMedium: {
    padding: Theme.Spacing.md,
    marginBottom: Theme.Spacing.md,
  },
  containerLarge: {
    padding: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
  },
  iconContainer: {
    position: 'relative',
    marginRight: Theme.Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  iconSmall: {
    fontSize: 24,
    width: 32,
    height: 32,
  },
  iconMedium: {
    fontSize: 32,
    width: 48,
    height: 48,
  },
  iconLarge: {
    fontSize: 48,
    width: 64,
    height: 64,
  },
  unlockedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Theme.Colors.success[500],
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.xs,
  },
  titleSmall: {
    fontSize: Theme.Typography.fontSize.sm,
  },
  titleMedium: {
    fontSize: Theme.Typography.fontSize.base,
  },
  titleLarge: {
    fontSize: Theme.Typography.fontSize.lg,
  },
  description: {
    lineHeight: 20,
  },
  descriptionSmall: {
    fontSize: Theme.Typography.fontSize.xs,
  },
  descriptionMedium: {
    fontSize: Theme.Typography.fontSize.sm,
  },
  descriptionLarge: {
    fontSize: Theme.Typography.fontSize.base,
  },
  progressContainer: {
    marginTop: Theme.Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.Spacing.sm,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Theme.Typography.fontSize.xs,
    color: Theme.Colors.text.secondary,
    fontWeight: Theme.Typography.fontWeight.medium,
    minWidth: 35,
  },
  unlockedDate: {
    fontSize: Theme.Typography.fontSize.xs,
    color: Theme.Colors.text.tertiary,
    marginTop: Theme.Spacing.sm,
    fontStyle: 'italic',
  },
  categoryBadge: {
    position: 'absolute',
    top: Theme.Spacing.sm,
    right: Theme.Spacing.sm,
    paddingHorizontal: Theme.Spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.BorderRadius.sm,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: Theme.Spacing.md,
  },
  progressSummary: {
    backgroundColor: '#ffffff',
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.md,
  },
  progressSummaryTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },
  progressSummaryValue: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.primary[500],
  },
  progressSummaryBar: {
    height: 12,
    backgroundColor: Theme.Colors.gray[200],
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Theme.Spacing.sm,
  },
  progressSummaryFill: {
    height: '100%',
    backgroundColor: Theme.Colors.primary[500],
    borderRadius: 6,
  },
  progressSummaryText: {
    textAlign: 'center',
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
    fontWeight: Theme.Typography.fontWeight.medium,
  },
});