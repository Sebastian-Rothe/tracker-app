import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { 
  loadRoutines, 
  confirmRoutine, 
  loadRoutineState,
  checkAndUpdateStreaks,
  performAutoMigration,
  deleteRoutine
} from '@/utils/settingsStorage';
import { StreakCounter, AchievementBadge, StatsGrid } from '../../components/ProgressIndicators';
import { 
  scheduleRoutineNotifications,
  setupNotificationHandlers,
  requestNotificationPermissions 
} from '@/utils/notificationManager';
import { Routine, RoutineState } from '@/types/routine';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';
import { Theme } from '@/constants/Theme';

const TEXTS = {
  title: 'Routine Tracker',
  subtitle: (activeCount: number, totalDays: number) => 
    `${activeCount} active routine${activeCount !== 1 ? 's' : ''} • ${totalDays} total streak days`,
  noRoutines: 'No routines yet!',
  noRoutinesSubtext: 'Add your first routine in the Routines tab to start tracking.',
  addFirstRoutine: 'Add Routine',
  streakDays: (days: number) => `${days} day${days !== 1 ? 's' : ''}`,
  confirmYes: 'Done ✓',
  confirmNo: 'Skip ✗',
  alreadyDone: 'Done Today ✓',
  lastCompleted: 'Last completed',
  never: 'Never',
  today: 'Today',
  yesterday: 'Yesterday',
  daysAgo: (days: number) => `${days} days ago`,
  confirmationTitle: 'Confirm Routine',
  confirmationMessage: (name: string) => `Did you complete "${name}" today?`,
  alreadyConfirmed: 'Already Confirmed',
  alreadyConfirmedMessage: (name: string) => `You already confirmed "${name}" today!`,
  routineCompleted: 'Great!',
  routineCompletedMessage: (name: string, streak: number) => 
    `"${name}" completed! Your streak is now ${streak} day${streak !== 1 ? 's' : ''}.`,
  routineSkipped: 'Routine Skipped',
  routineSkippedMessage: (name: string) => `"${name}" skipped. Streak has been reset.`,
  pullToRefresh: 'Pull down to refresh',
  loading: 'Loading routines...',
  errorLoading: 'Error loading routines',
  retryLoading: 'Tap to retry',
  deleteRoutine: 'Delete Routine',
  deleteConfirmTitle: 'Delete Routine?',
  deleteConfirmMessage: (name: string) => `Are you sure you want to delete "${name}"? This will permanently remove all streak data.`,
  routineDeleted: 'Routine Deleted',
  routineDeletedMessage: (name: string) => `"${name}" has been deleted successfully.`,
};

export default function MultiRoutineTrackerScreen() {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  
  // Enhanced bottom padding calculation for Android
  const getBottomPadding = () => {
    if (Platform.OS === 'ios') {
      return Math.max(insets.bottom + 20, 120);
    }
    
    // Android: Account for different navigation modes AND our dynamic tab bar
    const hasPhysicalNavBar = insets.bottom === 0; // Physical buttons
    const hasGestureNav = insets.bottom > 0; // Gesture navigation
    const tabBarHeight = 70; // Our tab bar base height
    const systemNavSpace = Math.max(insets.bottom, 0); // System navigation space
    
    if (hasPhysicalNavBar) {
      // Physical buttons: Tab bar + extra space for hardware buttons
      return tabBarHeight + 50; // More space for physical buttons
    } else if (hasGestureNav) {
      // Gesture navigation: Tab bar + system space + buffer
      return tabBarHeight + systemNavSpace + 30; // Account for gesture area
    } else {
      // Fallback: safe default
      return tabBarHeight + 60;
    }
  };

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineState, setRoutineState] = useState<RoutineState>({
    routines: [],
    activeRoutineCount: 0,
    totalStreakDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionTriggers, setCompletionTriggers] = useState<{ [key: string]: boolean }>({});

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Setup notification handlers
  useEffect(() => {
    const cleanup = setupNotificationHandlers();
    
    // Request permissions on app start
    requestNotificationPermissions().then(granted => {
      console.log('Notification permissions granted:', granted);
    });

    return cleanup;
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      console.log('loadData called, isRefresh:', isRefresh);
      if (!isRefresh) setIsLoading(true);
      setError(null);

      // Perform auto-migration from legacy data if needed
      await performAutoMigration();

      // Check and update streaks for missed days
      await checkAndUpdateStreaks();

      // Load current data
      const [loadedRoutines, state] = await Promise.all([
        loadRoutines(),
        loadRoutineState(),
      ]);

      console.log('Loaded routines from storage:', loadedRoutines);
      console.log('Loaded state from storage:', state);

      setRoutines(loadedRoutines.filter(r => r.isActive));
      setRoutineState(state);
      
      console.log('State updated - routines count:', loadedRoutines.filter(r => r.isActive).length);

      // Schedule notifications for active routines (only on first load, not refresh)
      if (!isRefresh) {
        await scheduleRoutineNotifications();
      }
    } catch (error) {
      console.error('Error loading routine data:', error);
      setError('Failed to load routines');
    } finally {
      setIsLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleRoutineAction = (routine: Routine, completed: boolean) => {
    console.log('Button pressed:', routine.name, completed ? 'completed' : 'skipped');
    
    // For debugging: directly call confirmRoutineAction without Alert
    // TODO: Add back Alert or make it optional in settings
    confirmRoutineAction(routine, completed);
    
    // Original Alert code commented out for debugging:
    /*
    Alert.alert(
      TEXTS.confirmationTitle,
      TEXTS.confirmationMessage(routine.name),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: completed ? 'Yes, Done!' : 'No, Skip',
          style: completed ? 'default' : 'destructive',
          onPress: () => confirmRoutineAction(routine, completed),
        },
      ]
    );
    */
  };

  const confirmRoutineAction = async (routine: Routine, completed: boolean) => {
    try {
      console.log('confirmRoutineAction called:', routine.name, completed);
      
      // Trigger bounce animation for completion
      if (completed) {
        setCompletionTriggers(prev => ({ ...prev, [routine.id]: true }));
        setTimeout(() => {
          setCompletionTriggers(prev => ({ ...prev, [routine.id]: false }));
        }, 500);
      }
      
      const updatedRoutine = await confirmRoutine(routine.id, completed);
      console.log('confirmRoutine returned:', updatedRoutine);
      
      if (updatedRoutine) {
        if (completed) {
          Alert.alert(
            TEXTS.routineCompleted,
            TEXTS.routineCompletedMessage(routine.name, updatedRoutine.streak),
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          Alert.alert(
            TEXTS.routineSkipped,
            TEXTS.routineSkippedMessage(routine.name),
            [{ text: 'OK', style: 'default' }]
          );
        }
        
        // Reload data to reflect changes
        console.log('Reloading data...');
        await loadData();
        console.log('Data reloaded');
      }
    } catch (error) {
      console.error('Error in confirmRoutineAction:', error);
      if (error instanceof Error && error.message.includes('already confirmed')) {
        Alert.alert(
          TEXTS.alreadyConfirmed,
          TEXTS.alreadyConfirmedMessage(routine.name)
        );
      } else {
        console.error('Error confirming routine:', error);
        Alert.alert('Error', `Failed to update routine: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      TEXTS.deleteConfirmTitle,
      TEXTS.deleteConfirmMessage(routine.name),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteRoutine(routine),
        },
      ]
    );
  };

  const confirmDeleteRoutine = async (routine: Routine) => {
    try {
      console.log('confirmDeleteRoutine called for:', routine.name);
      await deleteRoutine(routine.id);
      console.log('deleteRoutine completed successfully');
      Alert.alert(
        TEXTS.routineDeleted,
        TEXTS.routineDeletedMessage(routine.name),
        [{ text: 'OK', style: 'default' }]
      );
      console.log('Reloading data after delete...');
      await loadData();
      console.log('Data reloaded after delete');
    } catch (error) {
      console.error('Error deleting routine:', error);
      Alert.alert('Error', 'Failed to delete routine. Please try again.');
    }
  };

  const formatLastCompleted = (lastConfirmed: string): string => {
    if (!lastConfirmed) return TEXTS.never;
    
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    
    if (lastConfirmed === today) return TEXTS.today;
    if (lastConfirmed === yesterdayStr) return TEXTS.yesterday;
    
    const confirmedDate = new Date(lastConfirmed);
    const diffTime = Date.now() - confirmedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return TEXTS.daysAgo(diffDays);
  };

  const isRoutineCompletedToday = (routine: Routine): boolean => {
    const today = new Date().toISOString().slice(0, 10);
    return routine.lastConfirmed === today;
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingBottom: Math.max(insets.bottom, 20), 
        paddingLeft: insets.left, 
        paddingRight: insets.right 
      }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{TEXTS.loading}</Text>
        </View>
      </View>
    );
  }

  if (error && !isRefreshing) {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingBottom: Math.max(insets.bottom, 20), 
        paddingLeft: insets.left, 
        paddingRight: insets.right 
      }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{TEXTS.errorLoading}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>{TEXTS.retryLoading}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getBottomPadding() }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.header} shadow="sm" borderRadius="xl">
          <Text style={styles.title}>{TEXTS.title}</Text>
          <Text style={styles.subtitle}>
            {TEXTS.subtitle(routineState.activeRoutineCount, routineState.totalStreakDays)}
          </Text>
          <ProgressBar 
            progress={routineState.totalStreakDays / Math.max(routineState.totalStreakDays + 10, 30)} 
            style={styles.progressBar}
            progressColor={Theme.Colors.primary[500]}
            animated={true}
          />
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
                value: routines.filter(r => isRoutineCompletedToday(r)).length,
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
                value: routines.length,
                icon: '📊',
                color: Theme.Colors.info[500],
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

        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>{TEXTS.noRoutines}</Text>
            <Text style={styles.emptySubtext}>{TEXTS.noRoutinesSubtext}</Text>
          </View>
        ) : (
          <View style={styles.routineListContainer}>
            {routines.map((routine, index) => {
              const isCompleted = isRoutineCompletedToday(routine);
              
              return (
                <View 
                  key={routine.id}
                >
                  <Card
                    style={{
                      ...styles.routineCard,
                      borderLeftColor: routine.color, 
                      borderLeftWidth: 4,
                      ...(isCompleted && styles.completedCard)
                    }}
                  >
                <View style={styles.routineHeader}>
                  <View style={[styles.routineIconContainer, { backgroundColor: routine.color + '20' }]}>
                    <Text style={styles.routineIcon}>{routine.icon}</Text>
                  </View>
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {routine.description && (
                      <Text style={styles.routineDescription}>{routine.description}</Text>
                    )}
                    <Text style={styles.routineStreak}>
                      🔥 {TEXTS.streakDays(routine.streak)}
                    </Text>
                  </View>
                  {/* Delete button removed from tracker - only available in routines management */}
                </View>

                <View style={styles.routineFooter}>
                  <Text style={styles.lastCompletedText}>
                    {TEXTS.lastCompleted}: {formatLastCompleted(routine.lastConfirmed)}
                  </Text>
                  
                  {isCompleted ? (
                    <Badge 
                      count={routine.streak}
                      variant="success"
                      style={styles.completedBadge}
                    />
                  ) : (
                    <View style={styles.actionButtons}>
                      <Button
                        title={TEXTS.confirmNo}
                        variant="warning"
                        size="sm"
                        onPress={() => handleRoutineAction(routine, false)}
                        style={styles.actionButton}
                      />
                      <Button
                        title={TEXTS.confirmYes}
                        variant="success"
                        size="sm"
                        onPress={() => handleRoutineAction(routine, true)}
                        style={styles.actionButton}
                      />
                    </View>
                  )}
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        )}
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
  title: {
    fontSize: Theme.Typography.fontSize['3xl'],
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.xs,
  },
  subtitle: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
    marginBottom: Theme.Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  routineList: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: Theme.Spacing.sm,
  },
  routineCard: {
    marginHorizontal: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.lg,
    padding: 0, // Card component handles padding
  },
  completedCard: {
    backgroundColor: Theme.Colors.success[50],
    opacity: 0.8,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.Spacing.lg,
  },
  routineIconContainer: {
    width: 50,
    height: 50,
    borderRadius: Theme.BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.Spacing.lg,
  },
  routineIcon: {
    fontSize: Theme.Typography.fontSize['2xl'],
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.xs,
  },
  routineDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  routineStreak: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
  routineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastCompletedText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Theme.Spacing.sm,
    marginTop: Theme.Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  completedBadge: {
    alignSelf: 'flex-start',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  progressBar: {
    marginTop: Theme.Spacing.md,
    height: 6,
  },
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
  routineListContainer: {
    flex: 1,
    paddingBottom: Theme.Spacing.lg,
  },
});
