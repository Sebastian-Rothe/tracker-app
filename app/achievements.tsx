import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { AchievementCard, AchievementProgress } from '@/components/AchievementComponents';
import { Achievement, updateAchievements } from '@/utils/achievementManager';
import { WallpaperBackground } from '@/components/WallpaperBackground';


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
    
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n${message}`,
      [{ text: 'OK' }] // 🚀 NUR OK BUTTON - KEIN SHARE MEHR!
    );
  };

  // 🚀 SHARE FUNKTIONALITÄT ENTFERNT!



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
    <WallpaperBackground style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea]} edges={['top', 'left', 'right']}>
        {/* 🚀 SCHWEBENDER BACK BUTTON - OBEN LINKS */}
      <TouchableOpacity 
        style={[styles.floatingBackButton, { 
          backgroundColor: 'transparent', // 🚀 TRANSPARENTER HINTERGRUND!
          shadowColor: theme.Colors.text.primary,
        }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={[styles.backButtonText, { color: theme.Colors.primary[500] }]}>‹</Text>
      </TouchableOpacity>

      <ScrollView 
        style={[styles.container]} 
        contentContainerStyle={styles.contentContainer}
      >
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
      </SafeAreaView>
    </WallpaperBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: 30, // 🚀🚀🚀 VIEL MEHR ABSTAND NACH OBEN!!!
    left: Theme.Spacing.lg,
    width: 44, // 🚀 ETWAS GRÖSSER FÜR BESSERE ZENTRIERUNG
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Über allem anderen
    // Shadow für iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow für Android
    elevation: 3,
  
  },
  backButtonText: {
    fontSize: 28, // 🚀 GRÖSSERER PFEIL!
    fontWeight: '600',
    textAlign: 'center', // 🚀 PERFEKTE ZENTRIERUNG!
    lineHeight: 32, // 🚀 BESSERE VERTIKALE AUSRICHTUNG!
  },
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
    marginTop: Theme.Spacing.md,
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
    // marginHorizontal: Theme.Spacing.lg, // 🚀 GLEICHE BREITE WIE ANDERE BOXEN!
    // marginBottom: Theme.Spacing.lg,
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