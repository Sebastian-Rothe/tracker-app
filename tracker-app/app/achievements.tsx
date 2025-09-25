import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated, TouchableOpacity } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { AchievementCard, AchievementProgress } from '@/components/AchievementComponents';
import { Achievement, updateAchievements } from '@/utils/achievementManager';
import { SocialShareManager } from '@/utils/socialShareManager';

export default function AchievementsPage() {
  const { theme } = useTheme();
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
    
    const buttons = achievement.isUnlocked 
      ? [
          { text: 'Share', onPress: () => handleShareAchievement(achievement) },
          { text: 'OK', style: 'cancel' as const }
        ]
      : [{ text: 'OK' }];
    
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n${message}`,
      buttons
    );
  };

  const handleShareAchievement = async (achievement: Achievement) => {
    try {
      const userStats = {
        streakDays: 0, // This would come from actual user data
        totalRoutines: 0,
        completedToday: 0,
        monthlyRate: 0,
        achievementsUnlocked: unlockedCount,
      };
      
      await SocialShareManager.shareAchievement(achievement, userStats);
    } catch (error) {
      Alert.alert('Error', 'Failed to share achievement. Please try again.');
    }
  };

  const handleShareProgress = async () => {
    try {
      const userStats = {
        streakDays: 0, // This would come from actual user data
        totalRoutines: achievements.length,
        completedToday: 0,
        monthlyRate: 75, // Example data
        achievementsUnlocked: unlockedCount,
      };
      
      await SocialShareManager.shareProgress(userStats);
    } catch (error) {
      Alert.alert('Error', 'Failed to share progress. Please try again.');
    }
  };

  const renderCategorySection = (category: Achievement['category'], title: string, icon: string) => {
    const categoryAchievements = achievements.filter(a => a.category === category);
    const unlockedInCategory = categoryAchievements.filter(a => a.isUnlocked).length;
    
    if (categoryAchievements.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={[styles.categoryHeader, { 
          borderBottomColor: theme.Colors.surface.border 
        }]}>
          <Text style={styles.categoryIcon}>{icon}</Text>
          <Text style={[styles.categoryTitle, { color: theme.Colors.text.primary }]}>{title}</Text>
          <Text style={[styles.categoryCount, { color: theme.Colors.text.secondary }]}>
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.Colors.surface.background }]}>
        <Text style={[styles.loadingText, { color: theme.Colors.text.primary }]}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.Colors.surface.background }]} contentContainerStyle={styles.contentContainer}>
      <Animated.View style={[styles.content, { opacity: animatedValue }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.Colors.text.primary }]}>🏆 Achievements</Text>
          <Text style={[styles.subtitle, { color: theme.Colors.text.secondary }]}>
            Track your progress and unlock rewards
          </Text>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressSectionContainer}>
          <AchievementProgress
            total={achievements.length}
            unlocked={unlockedCount}
            style={styles.progressSection}
          />
          
          {unlockedCount > 0 && (
            <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.Colors.primary[500] }]} onPress={handleShareProgress}>
              <Text style={[styles.shareButtonText, { color: theme.Colors.text.inverse }]}>📤 Share Progress</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Unlocks */}
        {(() => {
          const recentUnlocks = achievements
            .filter(a => a.isUnlocked && a.unlockedAt)
            .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
            .slice(0, 3);

          if (recentUnlocks.length > 0) {
            return (
              <View style={styles.recentSection}>
                <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>🎉 Recently Unlocked</Text>
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
          <Text style={[styles.motivationTitle, { color: theme.Colors.text.primary }]}>Keep Going!</Text>
          <Text style={[styles.motivationText, { color: theme.Colors.text.secondary }]}>
            {unlockedCount === 0 
              ? "Start your journey by completing your first routine!"
              : unlockedCount === achievements.length
              ? "Congratulations! You've unlocked all achievements!"
              : `You've unlocked ${unlockedCount} out of ${achievements.length} achievements. Keep up the great work!`
            }
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.Colors.text.tertiary }]}>
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
  },
  loadingText: {
    fontSize: Theme.Typography.fontSize.base,
  },
  header: {
    padding: Theme.Spacing.lg,
    alignItems: 'center',
    marginBottom: Theme.Spacing.md,
  },
  title: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.xs,
  },
  subtitle: {
    fontSize: Theme.Typography.fontSize.base,
    textAlign: 'center',
  },
  progressSection: {
    margin: Theme.Spacing.lg,
  },
  progressSectionContainer: {
    margin: Theme.Spacing.lg,
  },
  shareButton: {
    paddingVertical: Theme.Spacing.md,
    paddingHorizontal: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    alignItems: 'center',
    marginTop: Theme.Spacing.md,
  },
  shareButtonText: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
  },
  recentSection: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.md,
  },
  categorySection: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Theme.Spacing.md,
    marginBottom: Theme.Spacing.md,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: Theme.Spacing.md,
  },
  categoryTitle: {
    flex: 1,
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  categoryCount: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
    paddingHorizontal: Theme.Spacing.md,
    paddingVertical: Theme.Spacing.xs,
    borderRadius: Theme.BorderRadius.sm,
  },
  categoryContent: {
    // Removed padding since it's now handled by parent
  },
  motivationSection: {
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.lg,
    alignItems: 'center',
  },
  motivationIcon: {
    fontSize: 48,
    marginBottom: Theme.Spacing.md,
  },
  motivationTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.sm,
  },
  motivationText: {
    fontSize: Theme.Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Theme.Typography.fontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});