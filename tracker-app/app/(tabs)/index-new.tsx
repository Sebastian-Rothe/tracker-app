import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { 
  loadRoutines, 
  confirmRoutine, 
  loadRoutineState,
  checkAndUpdateStreaks 
} from '@/utils/settingsStorage';
import { Routine, RoutineState } from '@/types/routine';

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
};

export default function MultiRoutineTrackerScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineState, setRoutineState] = useState<RoutineState>({
    routines: [],
    activeRoutineCount: 0,
    totalStreakDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);

      // Check and update streaks for missed days
      await checkAndUpdateStreaks();

      // Load current data
      const [loadedRoutines, state] = await Promise.all([
        loadRoutines(),
        loadRoutineState(),
      ]);

      setRoutines(loadedRoutines.filter(r => r.isActive));
      setRoutineState(state);
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
  };

  const confirmRoutineAction = async (routine: Routine, completed: boolean) => {
    try {
      const updatedRoutine = await confirmRoutine(routine.id, completed);
      
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
        await loadData();
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already confirmed')) {
        Alert.alert(
          TEXTS.alreadyConfirmed,
          TEXTS.alreadyConfirmedMessage(routine.name)
        );
      } else {
        console.error('Error confirming routine:', error);
        Alert.alert('Error', 'Failed to update routine. Please try again.');
      }
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{TEXTS.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{TEXTS.errorLoading}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>{TEXTS.retryLoading}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{TEXTS.title}</Text>
        <Text style={styles.subtitle}>
          {TEXTS.subtitle(routineState.activeRoutineCount, routineState.totalStreakDays)}
        </Text>
      </View>

      {routines.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>{TEXTS.noRoutines}</Text>
            <Text style={styles.emptySubtext}>{TEXTS.noRoutinesSubtext}</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.routineList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {routines.map((routine) => {
            const isCompleted = isRoutineCompletedToday(routine);
            
            return (
              <View
                key={routine.id}
                style={[
                  styles.routineCard,
                  { borderLeftColor: routine.color },
                  isCompleted && styles.completedCard,
                ]}
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
                </View>

                <View style={styles.routineFooter}>
                  <Text style={styles.lastCompletedText}>
                    {TEXTS.lastCompleted}: {formatLastCompleted(routine.lastConfirmed)}
                  </Text>
                  
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>{TEXTS.alreadyDone}</Text>
                    </View>
                  ) : (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.skipButton]}
                        onPress={() => handleRoutineAction(routine, false)}
                      >
                        <Text style={styles.skipButtonText}>{TEXTS.confirmNo}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.doneButton]}
                        onPress={() => handleRoutineAction(routine, true)}
                      >
                        <Text style={styles.doneButtonText}>{TEXTS.confirmYes}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  routineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedCard: {
    backgroundColor: '#f8fff8',
    opacity: 0.8,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routineIcon: {
    fontSize: 24,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
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
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#ff4444',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
