import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  Alert,
  RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { CalendarGrid } from '@/components/CalendarGrid';
import { MotivationalDashboard } from '@/components/MotivationalDashboard';
import { WallpaperBackground } from '@/components/WallpaperBackground';
import { 
  getMonthlyStats, 
  MonthlyStats,
  DayData
} from '@/utils/historyManager';
import { loadRoutines, loadRoutineState } from '@/utils/settingsStorage';
import { Routine, RoutineState } from '@/types/routine';
import { Card } from '@/components/ui';

export default function StatusScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // Performance monitoring removed due to infinite render loop
  
  // State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
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
    }, [])
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
      
      // Load monthly statistics for current month
      const allStats = await getMonthlyStats();
      const currentStats = allStats.find(s => s.month === currentMonth);
      setMonthlyStats(currentStats || null);
      
    } catch (error) {
      console.error('Error loading history data:', error);
      Alert.alert(t.common.error, 'Failed to load history data');
    } finally {
      setIsLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };
  
  // Handle month change from calendar
  const handleMonthChange = async (month: string) => {
    setCurrentMonth(month);
    
    // Load stats for the new month
    const allStats = await getMonthlyStats();
    const currentStats = allStats.find(s => s.month === month);
    setMonthlyStats(currentStats || null);
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
        message += `✅ ${t.explore.completedDays} (${completedEntries.length}):\n`;
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
      
      Alert.alert(t.explore.selectedDay, message);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <WallpaperBackground style={{ 
        flex: 1,
        paddingTop: insets.top, 
        paddingLeft: insets.left, 
        paddingRight: insets.right,
      }}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.Colors.text.secondary }]}>{t.status.loading}</Text>
        </View>
      </WallpaperBackground>
    );
  }
  
  return (
    <WallpaperBackground style={{ 
      flex: 1,
      paddingTop: insets.top, 
      paddingLeft: insets.left, 
      paddingRight: insets.right,
    }}>
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
              <Text style={[styles.title, { color: theme.Colors.text.primary }]}>{t.status.title}</Text>
              <Text style={[styles.subtitle, { color: theme.Colors.text.secondary }]}>{t.status.subtitle}</Text>
            </View>
          </View>
        </Card>
        
        {/* Motivational Dashboard - Consolidated Stats */}
        <MotivationalDashboard
          totalStreakDays={routineState.totalStreakDays}
          completedToday={activeRoutines.filter(r => isRoutineCompletedToday(r)).length}
          totalRoutines={activeRoutines.length}
        />

        {/* Calendar Grid with built-in navigation */}
        {!isLoading && (
          <CalendarGrid
            activeRoutines={activeRoutines}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
          />
        )}
        
      </ScrollView>
    </WallpaperBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Will be overridden by dynamic padding
    flexGrow: 1,
  },
  header: {
    marginHorizontal: Theme.Spacing.md,
    marginTop: Theme.Spacing.md,
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
});