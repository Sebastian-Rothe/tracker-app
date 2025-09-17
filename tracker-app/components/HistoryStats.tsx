import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';
import { MonthlyStats } from '@/utils/historyManager';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = Theme.Colors.primary[500] 
}) => {
  return (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsHeader}>
        {icon && <Text style={styles.statsIcon}>{icon}</Text>}
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );
};

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color = Theme.Colors.primary[500], 
  height = 8 
}) => {
  return (
    <View style={[styles.progressContainer, { height }]}>
      <View 
        style={[
          styles.progressBar, 
          { 
            width: `${Math.max(0, Math.min(100, progress * 100))}%`, 
            backgroundColor: color,
            height 
          }
        ]} 
      />
    </View>
  );
};

interface HistoryStatsProps {
  monthlyStats: MonthlyStats | null;
  weeklyData?: {
    thisWeek: number;
    lastWeek: number;
    weeklyChange: number;
  };
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ 
  monthlyStats, 
  weeklyData 
}) => {
  if (!monthlyStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No data available yet</Text>
        <Text style={styles.noDataSubtext}>Complete some routines to see your statistics!</Text>
      </View>
    );
  }
  
  const completionRate = monthlyStats.averageCompletionRate;
  const consistency = monthlyStats.completedDays / Math.max(monthlyStats.totalDays, 1);
  
  return (
    <View style={styles.container}>
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatsCard
          title="Current Streak"
          value={`${monthlyStats.streakDays} days`}
          icon="🔥"
          color={Theme.Colors.warning[500]}
        />
        <StatsCard
          title="Best Streak"
          value={`${monthlyStats.bestStreak} days`}
          icon="🏆"
          color={Theme.Colors.success[500]}
        />
      </View>
      
      <View style={styles.statsGrid}>
        <StatsCard
          title="Total Completions"
          value={monthlyStats.totalCompletions}
          icon="✅"
          color={Theme.Colors.info[500]}
        />
        <StatsCard
          title="Active Days"
          value={`${monthlyStats.completedDays}/${monthlyStats.totalDays}`}
          icon="📅"
          color={Theme.Colors.primary[500]}
        />
      </View>
      
      {/* Progress Indicators */}
      <View style={styles.progressSection}>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Average Completion Rate</Text>
            <Text style={styles.progressValue}>{Math.round(completionRate * 100)}%</Text>
          </View>
          <ProgressBar 
            progress={completionRate} 
            color={completionRate > 0.8 ? Theme.Colors.success[500] : 
                   completionRate > 0.5 ? Theme.Colors.warning[500] : 
                   Theme.Colors.error[500]}
          />
        </View>
        
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Consistency Score</Text>
            <Text style={styles.progressValue}>{Math.round(consistency * 100)}%</Text>
          </View>
          <ProgressBar 
            progress={consistency} 
            color={consistency > 0.7 ? Theme.Colors.success[500] : 
                   consistency > 0.4 ? Theme.Colors.warning[500] : 
                   Theme.Colors.error[500]}
          />
        </View>
      </View>
      
      {/* Weekly Comparison */}
      {weeklyData && (
        <View style={styles.weeklySection}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="This Week"
              value={weeklyData.thisWeek}
              subtitle="completions"
              icon="📊"
              color={Theme.Colors.primary[500]}
            />
            <StatsCard
              title="Last Week"
              value={weeklyData.lastWeek}
              subtitle={weeklyData.weeklyChange >= 0 ? 
                `+${weeklyData.weeklyChange}% improvement` : 
                `${weeklyData.weeklyChange}% decrease`}
              icon={weeklyData.weeklyChange >= 0 ? "📈" : "📉"}
              color={weeklyData.weeklyChange >= 0 ? 
                Theme.Colors.success[500] : 
                Theme.Colors.error[500]}
            />
          </View>
        </View>
      )}
      
      {/* Motivational Messages */}
      <View style={styles.motivationSection}>
        {monthlyStats.streakDays > 7 && (
          <Text style={styles.motivationText}>
            🎉 Amazing! You're on a {monthlyStats.streakDays}-day streak!
          </Text>
        )}
        {completionRate > 0.8 && (
          <Text style={styles.motivationText}>
            ⭐ Excellent consistency! You're completing over 80% of your routines!
          </Text>
        )}
        {monthlyStats.bestStreak >= 30 && (
          <Text style={styles.motivationText}>
            👑 Legendary! You've achieved a 30+ day streak!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  statsGrid: {
    flexDirection: 'row',
    marginBottom: Theme.Spacing.md,
    gap: Theme.Spacing.sm,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Theme.Colors.gray[50],
    borderRadius: Theme.BorderRadius.md,
    padding: Theme.Spacing.md,
    borderLeftWidth: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.Spacing.xs,
  },
  statsIcon: {
    fontSize: 16,
    marginRight: Theme.Spacing.xs,
  },
  statsTitle: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.text.secondary,
    flex: 1,
  },
  statsValue: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    marginBottom: Theme.Spacing.xs,
  },
  statsSubtitle: {
    fontSize: Theme.Typography.fontSize.xs,
    color: Theme.Colors.text.secondary,
  },
  progressSection: {
    marginBottom: Theme.Spacing.lg,
  },
  progressItem: {
    marginBottom: Theme.Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.xs,
  },
  progressTitle: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.text.primary,
  },
  progressValue: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },
  progressContainer: {
    backgroundColor: Theme.Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
  weeklySection: {
    marginBottom: Theme.Spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.md,
  },
  motivationSection: {
    paddingTop: Theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.Colors.gray[200],
  },
  motivationText: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.success[600],
    fontWeight: Theme.Typography.fontWeight.medium,
    marginBottom: Theme.Spacing.xs,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.semibold,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.Spacing.sm,
  },
  noDataSubtext: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
});