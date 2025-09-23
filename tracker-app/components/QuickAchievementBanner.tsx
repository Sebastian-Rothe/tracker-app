import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getAchievementStats, getRecentlyUnlocked } from '@/utils/achievementManager';

export const QuickAchievementBanner: React.FC = () => {
  const { theme } = useTheme();
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, progress: 0 });
  const [hasRecentUnlock, setHasRecentUnlock] = useState(false);

  useEffect(() => {
    loadAchievementData();
  }, []);

  const loadAchievementData = async () => {
    try {
      const stats = await getAchievementStats();
      setAchievementStats(stats);

      const recent = await getRecentlyUnlocked();
      const hasRecent = recent.some(a => 
        a.unlockedAt && 
        new Date(a.unlockedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
      setHasRecentUnlock(hasRecent);
    } catch (error) {
      console.error('Error loading achievement data:', error);
    }
  };

  const getProgressColor = (): string => {
    if (achievementStats.progress >= 0.8) return Theme.Colors.success[500];
    if (achievementStats.progress >= 0.5) return Theme.Colors.warning[500];
    return Theme.Colors.primary[500];
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          backgroundColor: theme.Colors.surface.card,
          borderColor: hasRecentUnlock ? Theme.Colors.success[300] : theme.Colors.surface.border
        },
        hasRecentUnlock && { backgroundColor: Theme.Colors.success[50] }
      ]}
      onPress={() => router.push('/achievements')}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.icon}>🏆</Text>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: theme.Colors.text.primary }]}>
              {hasRecentUnlock ? '🎉 New Achievement!' : 'Achievements'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.Colors.text.secondary }]}>
              {achievementStats.unlocked}/{achievementStats.total} unlocked
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBackground, {
              backgroundColor: theme.Colors.surface.overlay
            }]}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${achievementStats.progress * 100}%`,
                    backgroundColor: getProgressColor()
                  }
                ]}
              />
            </View>
          </View>
          <Text style={[styles.progressText, { color: theme.Colors.text.secondary }]}>
            {Math.round(achievementStats.progress * 100)}%
          </Text>
        </View>
      </View>
      
      {hasRecentUnlock && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.BorderRadius.lg,
    margin: Theme.Spacing.md,
    padding: Theme.Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    position: 'relative',
  },
  containerHighlight: {
    borderColor: Theme.Colors.success[300],
    backgroundColor: Theme.Colors.success[50],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: Theme.Spacing.md,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Theme.Typography.fontSize.sm,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  progressContainer: {
    width: 50,
    marginBottom: Theme.Spacing.xs,
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Theme.Typography.fontSize.xs,
    fontWeight: Theme.Typography.fontWeight.medium,
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Theme.Colors.success[500],
    borderRadius: 10,
    paddingHorizontal: Theme.Spacing.sm,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});