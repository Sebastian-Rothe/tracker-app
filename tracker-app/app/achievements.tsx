import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { Theme } from '@/constants/Theme';
import { AchievementCard, AchievementGrid, AchievementProgress } from '@/components/AchievementComponents';
import { Achievement, updateAchievements } from '@/utils/achievementManager';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const allAchievements = await updateAchievements();
      const unlockedAchievements = allAchievements.filter((a: Achievement) => a.isUnlocked);
      
      setAchievements(allAchievements);
      setUnlockedCount(unlockedAchievements.length);
      
      // Animate in
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading achievements:', error);
      Alert.alert('Error', 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleAchievementPress = (achievement: Achievement) => {
    const message = achievement.isUnlocked 
      ? `Achievement unlocked on ${new Date(achievement.unlockedAt!).toLocaleDateString()}`
      : `Progress: ${Math.round(achievement.progress * 100)}%`;
    
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n${message}`,
      [{ text: 'OK' }]
    );
  };

  const renderCategorySection = (category: Achievement['category'], title: string, icon: string) => {
    const categoryAchievements = achievements.filter(a => a.category === category);
    const unlockedInCategory = categoryAchievements.filter(a => a.isUnlocked).length;
    
    if (categoryAchievements.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryIcon}>{icon}</Text>
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={styles.categoryCount}>
            {unlockedInCategory}/{categoryAchievements.length}
          </Text>
        </View>
        
        <View style={styles.categoryContent}>
          {categoryAchievements.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onPress={handleAchievementPress}
              size="medium"
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View style={[styles.content, { opacity: animatedValue }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Achievements</Text>
          <Text style={styles.subtitle}>
            Track your progress and unlock rewards
          </Text>
        </View>

        {/* Progress Summary */}
        <AchievementProgress
          total={achievements.length}
          unlocked={unlockedCount}
          style={styles.progressSection}
        />

        {/* Recent Unlocks */}
        {(() => {
          const recentUnlocks = achievements
            .filter(a => a.isUnlocked && a.unlockedAt)
            .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
            .slice(0, 3);

          if (recentUnlocks.length > 0) {
            return (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>🎉 Recently Unlocked</Text>
                {recentUnlocks.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    onPress={handleAchievementPress}
                    size="large"
                  />
                ))}
              </View>
            );
          }
          return null;
        })()}

        {/* Category Sections */}
        {renderCategorySection('streak', 'Streak Achievements', '🔥')}
        {renderCategorySection('consistency', 'Consistency Achievements', '📈')}
        {renderCategorySection('milestone', 'Milestone Achievements', '🎯')}
        {renderCategorySection('special', 'Special Achievements', '⭐')}

        {/* Motivation Message */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationIcon}>💪</Text>
          <Text style={styles.motivationTitle}>Keep Going!</Text>
          <Text style={styles.motivationText}>
            {unlockedCount === 0 
              ? "Start your journey by completing your first routine!"
              : unlockedCount === achievements.length
              ? "Congratulations! You've unlocked all achievements!"
              : `You've unlocked ${unlockedCount} out of ${achievements.length} achievements. Keep up the great work!`
            }
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            New achievements are unlocked automatically as you use the app
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.gray[50],
  },
  contentContainer: {
    paddingBottom: Theme.Spacing.xl,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.Colors.gray[50],
  },
  loadingText: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
  },
  header: {
    padding: Theme.Spacing.lg,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.gray[200],
  },
  title: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.xs,
  },
  subtitle: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
  progressSection: {
    margin: Theme.Spacing.lg,
  },
  recentSection: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.md,
  },
  categorySection: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: Theme.BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.Spacing.lg,
    backgroundColor: Theme.Colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.gray[200],
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: Theme.Spacing.md,
  },
  categoryTitle: {
    flex: 1,
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },
  categoryCount: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.primary[500],
    backgroundColor: Theme.Colors.primary[50],
    paddingHorizontal: Theme.Spacing.md,
    paddingVertical: Theme.Spacing.xs,
    borderRadius: Theme.BorderRadius.sm,
  },
  categoryContent: {
    padding: Theme.Spacing.lg,
  },
  motivationSection: {
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.lg,
    backgroundColor: Theme.Colors.primary[50],
    borderRadius: Theme.BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.Colors.primary[200],
  },
  motivationIcon: {
    fontSize: 48,
    marginBottom: Theme.Spacing.md,
  },
  motivationTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.primary[700],
    marginBottom: Theme.Spacing.sm,
  },
  motivationText: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.primary[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.md,
    backgroundColor: Theme.Colors.gray[50],
    borderRadius: Theme.BorderRadius.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});