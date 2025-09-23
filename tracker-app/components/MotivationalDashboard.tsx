import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Achievement, getAchievementStats } from '@/utils/achievementManager';
import { getMonthlyStats } from '@/utils/historyManager';

interface MotivationalDashboardProps {
  totalStreakDays: number;
  completedToday: number;
  totalRoutines: number;
  style?: any;
}

const { width } = Dimensions.get('window');

export const MotivationalDashboard: React.FC<MotivationalDashboardProps> = ({
  totalStreakDays,
  completedToday,
  totalRoutines,
  style
}) => {
  const { theme } = useTheme();
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, progress: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ totalDays: 0, completedDays: 0, completionRate: 0 });
  const [motivationMessage, setMotivationMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadDashboardData();
  }, [totalStreakDays, completedToday]);

  const loadDashboardData = async () => {
    try {
      // Load achievement stats
      const stats = await getAchievementStats();
      setAchievementStats(stats);

      // Load monthly stats
      const monthlyStatsArray = await getMonthlyStats();
      const now = new Date();
      const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const currentMonthStats = monthlyStatsArray.find(
        stats => stats.month === currentMonthString
      );
      
      if (currentMonthStats) {
        setMonthlyStats({
          totalDays: currentMonthStats.totalDays,
          completedDays: currentMonthStats.completedDays,
          completionRate: currentMonthStats.averageCompletionRate
        });
      } else {
        setMonthlyStats({ totalDays: 0, completedDays: 0, completionRate: 0 });
      }

      // Generate motivation message
      const message = generateMotivationMessage();
      setMotivationMessage(message);

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const generateMotivationMessage = (): string => {
    const messages = {
      streak: [
        "🔥 You're on fire! Keep that streak alive!",
        "💪 Consistency is key - you're crushing it!",
        "🌟 Every day counts. You're building something amazing!",
        "🚀 Your dedication is paying off. Keep going!",
      ],
      completion: [
        "✨ Great job completing your routines today!",
        "🎯 You're hitting your targets like a champion!",
        "🏆 Another successful day in the books!",
        "💯 Your commitment is inspiring!",
      ],
      encouragement: [
        "🌱 Small steps lead to big changes!",
        "⭐ You're building habits that will last a lifetime!",
        "🎪 Progress, not perfection - you're doing great!",
        "🌈 Every routine completed is a victory!",
      ],
      milestone: [
        "🎉 Look how far you've come! Amazing progress!",
        "💎 Your persistence is turning into real results!",
        "🏅 You're becoming the person you want to be!",
        "🌟 Your future self will thank you for this dedication!",
      ]
    };

    // Choose message type based on current state
    if (totalStreakDays >= 7) {
      return messages.streak[Math.floor(Math.random() * messages.streak.length)];
    } else if (completedToday > 0) {
      return messages.completion[Math.floor(Math.random() * messages.completion.length)];
    } else if (totalStreakDays >= 30) {
      return messages.milestone[Math.floor(Math.random() * messages.milestone.length)];
    } else {
      return messages.encouragement[Math.floor(Math.random() * messages.encouragement.length)];
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 0.8) return Theme.Colors.success[500];
    if (progress >= 0.5) return Theme.Colors.warning[500];
    return Theme.Colors.primary[500];
  };

  const formatStreak = (days: number): string => {
    if (days === 0) return "Start your journey today!";
    if (days === 1) return "1 day strong! 💪";
    if (days < 7) return `${days} days rolling! 🔥`;
    if (days < 30) return `${days} days streak! 🌟`;
    if (days < 100) return `${days} days unstoppable! 🚀`;
    return `${days} days legendary! 👑`;
  };

  return (
    <Animated.View style={[styles.container, { 
      opacity: fadeAnim,
      backgroundColor: theme.Colors.surface.card
    }, style]}>
      {/* Motivation Message */}
      <View style={[styles.motivationSection, {
        backgroundColor: theme.Colors.primary[50]
      }]}>
        <Text style={[styles.motivationText, {
          color: theme.Colors.primary[700]
        }]}>{motivationMessage}</Text>
      </View>

      {/* Stats Overview - Compact 2x2 Grid */}
      <View style={styles.statsGrid}>
        {/* Main Streak Display */}
        <View style={[styles.statCard, styles.streakCard, {
          backgroundColor: theme.Colors.warning[50]
        }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={[styles.statValue, { color: theme.Colors.text.primary }]}>{totalStreakDays}</Text>
          <Text style={[styles.statLabel, { color: theme.Colors.text.secondary }]}>Day Streak</Text>
        </View>

        {/* Today's Progress */}
        <View style={[styles.statCard, styles.progressCard, {
          backgroundColor: theme.Colors.primary[50]
        }]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={[styles.statValue, { color: theme.Colors.text.primary }]}>{completedToday}/{totalRoutines}</Text>
          <Text style={[styles.statLabel, { color: theme.Colors.text.secondary }]}>Today</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBackground, {
              backgroundColor: theme.Colors.surface.overlay
            }]}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${totalRoutines > 0 ? (completedToday / totalRoutines) * 100 : 0}%`,
                    backgroundColor: getProgressColor(totalRoutines > 0 ? completedToday / totalRoutines : 0)
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Monthly Progress */}
        <View style={[styles.statCard, styles.monthCard, {
          backgroundColor: theme.Colors.info[50]
        }]}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={[styles.statValue, { color: theme.Colors.text.primary }]}>{Math.round(monthlyStats.completionRate * 100)}%</Text>
          <Text style={[styles.statLabel, { color: theme.Colors.text.secondary }]}>Month Avg</Text>
        </View>

        {/* Achievement Progress */}
        <View style={[styles.statCard, styles.achievementCard, {
          backgroundColor: theme.Colors.success[50]
        }]}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={[styles.statValue, { color: theme.Colors.text.primary }]}>{achievementStats.unlocked}</Text>
          <Text style={[styles.statLabel, { color: theme.Colors.text.secondary }]}>Unlocked</Text>
        </View>
      </View>

      {/* Next Milestone */}
      <View style={[styles.nextMilestone, {
        backgroundColor: theme.Colors.primary[50]
      }]}>
        <Text style={[styles.milestoneTitle, {
          color: theme.Colors.primary[700]
        }]}>🎯 Next Milestone</Text>
        <Text style={[styles.milestoneText, {
          color: theme.Colors.primary[600]
        }]}>
          {(() => {
            if (totalStreakDays < 7) return `${7 - totalStreakDays} days to Week Warrior! 🔥`;
            if (totalStreakDays < 30) return `${30 - totalStreakDays} days to Month Master! 👑`;
            if (totalStreakDays < 100) return `${100 - totalStreakDays} days to Hundred Club! 💯`;
            return "You're a legend! Keep going! 🌟";
          })()}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.BorderRadius.lg,
    margin: Theme.Spacing.md,
    padding: Theme.Spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  motivationSection: {
    alignItems: 'center',
    marginBottom: Theme.Spacing.lg,
    paddingVertical: Theme.Spacing.md,
    borderRadius: Theme.BorderRadius.md,
  },
  motivationText: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.Spacing.lg,
  },
  statCard: {
    width: '48%',
    borderRadius: Theme.BorderRadius.md,
    padding: Theme.Spacing.md,
    alignItems: 'center',
    marginBottom: Theme.Spacing.md,
    minHeight: 100,
  },
  streakCard: {
    borderColor: Theme.Colors.warning[200],
    borderWidth: 1,
  },
  progressCard: {
    borderColor: Theme.Colors.primary[200],
    borderWidth: 1,
  },
  monthCard: {
    borderColor: Theme.Colors.info[200],
    borderWidth: 1,
  },
  achievementCard: {
    borderColor: Theme.Colors.success[200],
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Theme.Spacing.xs,
  },
  statValue: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.medium,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: Theme.Spacing.xs,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  nextMilestone: {
    borderRadius: Theme.BorderRadius.md,
    padding: Theme.Spacing.md,
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.xs,
  },
  milestoneText: {
    fontSize: Theme.Typography.fontSize.sm,
    textAlign: 'center',
  },
});