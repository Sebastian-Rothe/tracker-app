import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  TouchableOpacity, 
  Alert,
  RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { CalendarGrid } from '@/components/CalendarGrid';
import { HistoryStats } from '@/components/HistoryStats';
import { StreakCounter, AchievementBadge, StatsGrid } from '@/components/ProgressIndicators';
import { MotivationalDashboard } from '@/components/MotivationalDashboard';
import { QuickAchievementBanner } from '@/components/QuickAchievementBanner';
import { 
  getDailyData, 
  getMonthlyStats, 
  MonthlyStats,
  DayData,
  HistoryEntry 
} from '@/utils/historyManager';
import { loadRoutines, loadRoutineState } from '@/utils/settingsStorage';
import { Routine, RoutineState } from '@/types/routine';
import { Card } from '@/components/ui';

export default function StatusScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState<DayData[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [activeRoutines, setActiveRoutines] = useState<Routine[]>([]);
  const [routineState, setRoutineState] = useState<RoutineState>({
    routines: [],
    activeRoutineCount: 0,
    totalStreakDays: 0,
  });
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Enhanced bottom padding calculation
  const getBottomPadding = () => {
    if (Platform.OS === 'ios') {
      return Math.max(insets.bottom + 20, 120);
    }
    
    const hasPhysicalNavBar = insets.bottom === 0;
    const hasGestureNav = insets.bottom > 0;
    const tabBarHeight = 70;
    
    if (hasPhysicalNavBar) {
      return tabBarHeight + 50;
    } else if (hasGestureNav) {
      return tabBarHeight + insets.bottom + 30;
    } else {
      return tabBarHeight + 60;
    }
  };
  
  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentMonth])
  );
  
  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      
      // Load active routines and routine state
      const [routines, state] = await Promise.all([
        loadRoutines(),
        loadRoutineState(),
      ]);
      const active = routines.filter(r => r.isActive);
      setActiveRoutines(active);
      setRoutineState(state);
      
      // Calculate date range for current month
      const [year, month] = currentMonth.split('-').map(Number);
      const startDate = `${currentMonth}-01`;
      const endDate = `${currentMonth}-${new Date(year, month, 0).getDate()}`;
      
      // Load daily data for calendar
      const dailyData = await getDailyData(startDate, endDate, active);
      setMonthlyData(dailyData);
      
      // Load monthly statistics
      const allStats = await getMonthlyStats();
      const currentStats = allStats.find(s => s.month === currentMonth);
      setMonthlyStats(currentStats || null);
      
    } catch (error) {
      console.error('Error loading history data:', error);
      Alert.alert('Error', 'Failed to load history data');
    } finally {
      setIsLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;
    
    if (direction === 'prev') {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }
    
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };
  
  const formatMonthTitle = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const isRoutineCompletedToday = useCallback((routine: Routine): boolean => {
    const today = new Date().toISOString().slice(0, 10);
    return routine.lastConfirmed === today;
  }, []);
  
  const handleDayPress = (dayData: DayData) => {
    if (dayData.entries.length > 0) {
      setSelectedDay(dayData);
      // Show day details in alert for now
      const completedEntries = dayData.entries.filter(e => e.completed);
      const skippedEntries = dayData.entries.filter(e => !e.completed);
      
      let message = `Date: ${dayData.date}\n\n`;
      
      if (completedEntries.length > 0) {
        message += `✅ Completed (${completedEntries.length}):\n`;
        completedEntries.forEach(entry => {
          message += `• ${entry.routineName}\n`;
        });
        message += '\n';
      }
      
      if (skippedEntries.length > 0) {
        message += `❌ Skipped (${skippedEntries.length}):\n`;
        skippedEntries.forEach(entry => {
          message += `• ${entry.routineName}\n`;
        });
      }
      
      Alert.alert('Day Details', message);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingLeft: insets.left, 
        paddingRight: insets.right,
        backgroundColor: theme.Colors.surface.background 
      }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.Colors.text.primary }]}>Loading history...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingLeft: insets.left, 
      paddingRight: insets.right,
      backgroundColor: theme.Colors.surface.background 
    }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getBottomPadding() }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={styles.header} shadow="sm" borderRadius="xl">
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: theme.Colors.text.primary }]}>Status & Analytics</Text>
              <Text style={[styles.subtitle, { color: theme.Colors.text.secondary }]}>Deine Fortschritte und Statistiken</Text>
            </View>
          </View>
        </Card>
        
        {/* Enhanced Progress Indicators */}
        <View style={styles.progressIndicatorsContainer}>
          {/* Streak Counter */}
          <StreakCounter
            count={routineState.totalStreakDays}
            variant="fire"
            animated={true}
            style={styles.streakIndicator}
          />

          {/* Stats Grid */}
          <StatsGrid
            stats={[
              {
                label: 'Active Routines',
                value: routineState.activeRoutineCount,
                icon: '🎯',
                color: Theme.Colors.primary[500],
              },
              {
                label: 'Completed Today',
                value: activeRoutines.filter(r => isRoutineCompletedToday(r)).length,
                icon: '✅',
                color: Theme.Colors.success[500],
              },
              {
                label: 'Current Streak',
                value: routineState.totalStreakDays,
                icon: '🔥',
                color: Theme.Colors.warning[500],
              },
              {
                label: 'Total Routines',
                value: activeRoutines.length,
                icon: '📊',
                color: Colors.primary[500],
              },
            ]}
            animated={true}
            style={styles.statsGrid}
          />

          {/* Achievement Badges */}
          <View style={styles.achievementsContainer}>
            <AchievementBadge
              title="First Steps"
              description="Complete your first routine"
              icon="🚀"
              unlocked={routineState.totalStreakDays > 0}
              animated={true}
            />
            <AchievementBadge
              title="Week Warrior"
              description="Maintain a 7-day streak"
              icon="⚔️"
              unlocked={routineState.totalStreakDays >= 7}
              progress={Math.min(routineState.totalStreakDays / 7, 1)}
              animated={true}
            />
            <AchievementBadge
              title="Consistency Champion"
              description="Maintain a 30-day streak"
              icon="👑"
              unlocked={routineState.totalStreakDays >= 30}
              progress={Math.min(routineState.totalStreakDays / 30, 1)}
              animated={true}
            />
          </View>
        </View>

        {/* Motivational Dashboard */}
        <MotivationalDashboard
          totalStreakDays={routineState.totalStreakDays}
          completedToday={activeRoutines.filter(r => isRoutineCompletedToday(r)).length}
          totalRoutines={activeRoutines.length}
        />

        {/* Quick Achievement Access */}
        <QuickAchievementBanner />
        
        {/* Monthly Statistics */}
        <HistoryStats monthlyStats={monthlyStats} />
        
        {/* Calendar Navigation */}
        <Card style={styles.calendarHeader} shadow="sm">
          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateMonth('prev')}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {formatMonthTitle(currentMonth)}
            </Text>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateMonth('next')}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Calendar Grid */}
        <CalendarGrid
          monthData={monthlyData}
          currentMonth={currentMonth}
          onDayPress={handleDayPress}
        />
        
        {/* Quick Stats Summary */}
        <Card style={styles.summaryCard} shadow="sm">
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {monthlyData.filter(d => d.completionRate > 0).length}
              </Text>
              <Text style={styles.summaryLabel}>Active Days</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {monthlyData.reduce((sum, d) => sum + d.completedRoutines, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Completions</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {Math.round((monthlyData.filter(d => d.completionRate === 1).length / Math.max(monthlyData.length, 1)) * 100)}%
              </Text>
              <Text style={styles.summaryLabel}>Perfect Days</Text>
            </View>
          </View>
        </Card>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Will be overridden by dynamic padding
    flexGrow: 1,
  },
  header: {
    margin: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.Typography.fontSize['3xl'],
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.xs,
  },
  subtitle: {
    fontSize: Theme.Typography.fontSize.lg,
    color: Theme.Colors.text.secondary,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Theme.Typography.fontSize.lg,
    color: Theme.Colors.text.secondary,
  },
  calendarHeader: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.sm,
    padding: Theme.Spacing.md,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },
  summaryCard: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
    padding: Theme.Spacing.lg,
  },
  summaryTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Theme.Typography.fontSize['2xl'],
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.primary[500],
    marginBottom: Theme.Spacing.xs,
  },
  summaryLabel: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: Theme.BorderRadius.lg,
    elevation: 4,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
  },
  sectionTitle: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.semibold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.md,
  },
  description: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
    lineHeight: 22,
  },
  // Progress indicators styles
  progressIndicatorsContainer: {
    paddingHorizontal: Theme.Spacing.lg,
    paddingVertical: Theme.Spacing.md,
  },
  streakIndicator: {
    marginBottom: Theme.Spacing.lg,
  },
  statsGrid: {
    marginBottom: Theme.Spacing.lg,
  },
  achievementsContainer: {
    marginBottom: Theme.Spacing.lg,
  },
});
