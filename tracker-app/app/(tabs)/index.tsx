import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
  ListRenderItem,
  ActionSheetIOS,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAchievements } from '@/contexts/AchievementContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  loadRoutines, 
  confirmRoutine, 
  loadRoutineState,
  checkAndUpdateStreaks,
  performAutoMigration,
  deleteRoutine,
  createRoutine,
  updateRoutine,
  undoRoutineToday
} from '@/utils/settingsStorage';
import { routineStorage } from '@/services/RoutineStorageService';
import { StreakCounter, StatsGrid } from '../../components/ProgressIndicators';
import { MotivationalDashboard } from '../../components/MotivationalDashboard';
import { QuickAchievementBanner } from '../../components/QuickAchievementBanner';
import { 
  scheduleRoutineNotifications,
  setupNotificationHandlers,
  requestNotificationPermissions 
} from '@/utils/notificationManager';
import { Routine, RoutineState, CreateRoutineRequest, ROUTINE_COLORS, ROUTINE_ICONS, RoutineColor, RoutineIcon } from '@/types/routine';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';
import { Theme } from '@/constants/Theme';

const TEXTS = {
  title: 'My Routines',
  subtitle: (activeCount: number, longestStreak: number) => 
    `${activeCount} active routine${activeCount !== 1 ? 's' : ''} • ${longestStreak} longest streak`,
  noRoutines: 'No routines yet!',
  noRoutinesSubtext: 'Tap the + button to add your first routine and start tracking.',
  addFirstRoutine: 'Add Routine',
  streakDays: (days: number) => `${days} day${days !== 1 ? 's' : ''}`,
  confirmYes: 'Done ✓',
  confirmNo: 'Skip ✗',
  alreadyDone: 'Done Today ✓',
  lastCompleted: 'Last completed',
  editRoutine: 'Edit Routine',
  deleteRoutine: 'Delete Routine',
  undoToday: 'Undo Today',
  cancel: 'Cancel',
  confirmDelete: 'Confirm Delete',
  deleteMessage: (name: string) => `Are you sure you want to delete "${name}"? This cannot be undone.`,
  routineName: 'Routine Name',
  routineDescription: 'Description (optional)',
  chooseColor: 'Choose Color', 
  chooseIcon: 'Choose Icon',
  save: 'Save',
  addRoutine: 'Add New Routine',
  viewStats: 'View Statistics',
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
  deleteConfirmTitle: 'Delete Routine?',
  deleteConfirmMessage: (name: string) => `Are you sure you want to delete "${name}"? This will permanently remove all streak data.`,
  routineDeleted: 'Routine Deleted',
  routineDeletedMessage: (name: string) => `"${name}" has been deleted successfully.`,
};

interface RoutineFormData {
  name: string;
  description: string;
  color: RoutineColor;
  icon: RoutineIcon;
  initialStreak: number;
}

const INITIAL_FORM_DATA: RoutineFormData = {
  name: '',
  description: '',
  color: ROUTINE_COLORS[0],
  icon: ROUTINE_ICONS[0],
  initialStreak: 0,
};

export default function MultiRoutineTrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const { theme } = useTheme();
  
  // Enhanced bottom padding calculation for Android
  const bottomPadding = useMemo(() => {
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
  }, [insets.bottom]);

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
  
  // Form state for adding/editing routines
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [formData, setFormData] = useState<RoutineFormData>(INITIAL_FORM_DATA);
  
  const { checkAndUpdateAchievements } = useAchievements();

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
      // Permissions handled
    });

    return cleanup;
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);

      // Force cache invalidation and clear old stored state to ensure new streak calculation logic is used
      routineStorage.invalidateCache();
      await routineStorage.clearStoredState();

      // Perform auto-migration from legacy data if needed
      await performAutoMigration();

      // Check and update streaks for missed days
      await checkAndUpdateStreaks();

      // Load current data
      const [loadedRoutines, state] = await Promise.all([
        loadRoutines(),
        loadRoutineState(),
      ]);

      setRoutines(loadedRoutines.filter(r => r.isActive));
      setRoutineState(state);

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
  }, [checkAndUpdateAchievements]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleRoutineAction = (routine: Routine, completed: boolean) => {
    // Directly confirm routine action without popup
    confirmRoutineAction(routine, completed);
  };

  const confirmRoutineAction = useCallback(async (routine: Routine, completed: boolean) => {
    try {
      // Trigger bounce animation for completion
      if (completed) {
        setCompletionTriggers(prev => ({ ...prev, [routine.id]: true }));
        setTimeout(() => {
          setCompletionTriggers(prev => ({ ...prev, [routine.id]: false }));
        }, 500);
      }
      
      const updatedRoutine = await confirmRoutine(routine.id, completed);
      
      // Check for achievement unlocks after completing a routine
      if (completed) {
        await checkAndUpdateAchievements();
      }
      
      if (updatedRoutine) {
        // Update only the specific routine in the state - no full page reload
        setRoutines(prevRoutines => 
          prevRoutines.map(r => 
            r.id === updatedRoutine.id ? updatedRoutine : r
          )
        );
        
        // Update routine state for stats
        const updatedRoutines = routines.map(r => 
          r.id === updatedRoutine.id ? updatedRoutine : r
        );
        const activeRoutines = updatedRoutines.filter(r => r.isActive);
        const longestStreak = activeRoutines.length > 0 
          ? Math.max(...activeRoutines.map(r => r.streak))
          : 0;
        
        setRoutineState(prev => ({
          ...prev,
          routines: updatedRoutines,
          totalStreakDays: longestStreak
        }));
      }
    } catch (error) {
      console.error('Error in confirmRoutineAction:', error);
      if (error instanceof Error && error.message.includes('already confirmed')) {
        Alert.alert(
          TEXTS.alreadyConfirmed,
          TEXTS.alreadyConfirmedMessage(routine.name)
        );
      } else {
        Alert.alert('Error', `Failed to update routine: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [checkAndUpdateAchievements, loadData]);

  const handleDeleteRoutine = useCallback((routine: Routine) => {
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
  }, []);

  const confirmDeleteRoutine = useCallback(async (routine: Routine) => {
    try {
      await deleteRoutine(routine.id);
      Alert.alert(
        TEXTS.routineDeleted,
        TEXTS.routineDeletedMessage(routine.name),
        [{ text: 'OK', style: 'default' }]
      );
      await loadData();
    } catch (error) {
      console.error('Error deleting routine:', error);
      Alert.alert('Error', 'Failed to delete routine. Please try again.');
    }
  }, [loadData]);

  const handleUndoRoutineToday = useCallback(async (routine: Routine) => {
    try {
      const updatedRoutine = await undoRoutineToday(routine.id);
      if (updatedRoutine) {
        // Update only the specific routine in the state - no full page reload
        setRoutines(prevRoutines => 
          prevRoutines.map(r => 
            r.id === updatedRoutine.id ? updatedRoutine : r
          )
        );
        
        // Update routine state for stats
        const updatedRoutines = routines.map(r => 
          r.id === updatedRoutine.id ? updatedRoutine : r
        );
        const activeRoutines = updatedRoutines.filter(r => r.isActive);
        const longestStreak = activeRoutines.length > 0 
          ? Math.max(...activeRoutines.map(r => r.streak))
          : 0;
        
        setRoutineState(prev => ({
          ...prev,
          routines: updatedRoutines,
          totalStreakDays: longestStreak
        }));
        // No popup - just silent undo for better UX
      } else {
        Alert.alert(
          'Cannot Undo',
          `"${routine.name}" was not completed today, so there's nothing to undo.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error undoing routine:', error);
      Alert.alert('Error', 'Failed to undo routine completion. Please try again.');
    }
  }, [routines]);

  const handleRoutineCardPress = useCallback((routine: Routine) => {
    const isCompletedToday = isRoutineCompletedToday(routine);
    
    if (Platform.OS === 'ios') {
      // Build options dynamically based on completion status
      const options = [TEXTS.cancel, TEXTS.editRoutine];
      if (isCompletedToday) {
        options.push(TEXTS.undoToday);
      }
      options.push(TEXTS.deleteRoutine);
      
      const destructiveButtonIndex = options.length - 1; // Delete is always last
      const cancelButtonIndex = 0;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Edit routine
            setEditingRoutine(routine);
            setFormData({
              name: routine.name,
              description: routine.description || '',
              color: routine.color as RoutineColor,
              icon: routine.icon as RoutineIcon,
              initialStreak: 0, // Not used for editing
            });
            setIsFormVisible(true);
          } else if (isCompletedToday && buttonIndex === 2) {
            // Undo today (only available if completed today)
            handleUndoRoutineToday(routine);
          } else if (buttonIndex === options.length - 1) {
            // Delete routine (always last option)
            handleDeleteRoutine(routine);
          }
        }
      );
    } else {
      // Android: Show simple alert with options
      const alertOptions: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}> = [
        { text: TEXTS.cancel, style: 'cancel' },
        { text: TEXTS.editRoutine, onPress: () => {
          setEditingRoutine(routine);
          setFormData({
            name: routine.name,
            description: routine.description || '',
            color: routine.color as RoutineColor,
            icon: routine.icon as RoutineIcon,
            initialStreak: 0, // Not used for editing
          });
          setIsFormVisible(true);
        }},
      ];
      
      // Add undo option if completed today
      if (isCompletedToday) {
        alertOptions.push({ 
          text: TEXTS.undoToday, 
          onPress: () => handleUndoRoutineToday(routine) 
        });
      }
      
      // Add delete option
      alertOptions.push({ 
        text: TEXTS.deleteRoutine, 
        style: 'destructive', 
        onPress: () => handleDeleteRoutine(routine) 
      });
      
      Alert.alert(
        routine.name,
        'What would you like to do?',
        alertOptions
      );
    }
  }, [handleDeleteRoutine, handleUndoRoutineToday]);

  const handleSaveRoutine = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    try {
      if (editingRoutine) {
        // Update existing routine
        await updateRoutine({
          id: editingRoutine.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          icon: formData.icon,
        });
      } else {
        // Create new routine
        await createRoutine({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          icon: formData.icon,
          initialStreak: formData.initialStreak,
        });
      }
      
      setIsFormVisible(false);
      setEditingRoutine(null);
      setFormData(INITIAL_FORM_DATA);
      await loadData();
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine. Please try again.');
    }
  }, [formData, editingRoutine, loadData]);

  const formatLastCompleted = useCallback((lastConfirmed: string): string => {
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
  }, []);

  const isRoutineCompletedToday = useCallback((routine: Routine): boolean => {
    const today = new Date().toISOString().slice(0, 10);
    return routine.lastConfirmed === today;
  }, []);

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
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingLeft: insets.left, 
      paddingRight: insets.right,
      backgroundColor: theme.Colors.surface.background 
    }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Clickable Streak Bar */}
        <TouchableOpacity 
          style={styles.streakBar}
          onPress={() => router.push('/(tabs)/status')}
          activeOpacity={0.8}
        >
          <Card style={styles.streakCard} shadow="sm" borderRadius="xl">
            <View style={styles.streakContent}>
              <View style={styles.streakInfo}>
                <Text style={[styles.streakTitle, { color: theme.Colors.text.primary }]}>🔥 Current Streak</Text>
                <Text style={[styles.streakDays, { color: theme.Colors.primary[500] }]}>
                  {routineState.totalStreakDays} {routineState.totalStreakDays === 1 ? 'day' : 'days'}
                </Text>
                <Text style={[styles.streakSubtitle, { color: theme.Colors.text.secondary }]}>
                  {routineState.activeRoutineCount} active routine{routineState.activeRoutineCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.streakAction}>
                <Ionicons name="chevron-forward" size={20} color={Theme.Colors.primary[500]} />
              </View>
            </View>
            <ProgressBar 
              progress={routineState.totalStreakDays / Math.max(routineState.totalStreakDays + 5, 30)} 
              style={styles.progressBar}
              progressColor={Theme.Colors.primary[500]}
              animated={true}
            />
          </Card>
        </TouchableOpacity>

        {/* Achievements Section */}
        <QuickAchievementBanner />

        {/* Routines List */}
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyText, { color: theme.Colors.text.primary }]}>{TEXTS.noRoutines}</Text>
            <Text style={[styles.emptySubtext, { color: theme.Colors.text.secondary }]}>{TEXTS.noRoutinesSubtext}</Text>
          </View>
        ) : (
          <View style={styles.routineListContainer}>
            {routines.map((routine, index) => {
              const isCompleted = isRoutineCompletedToday(routine);
              
              return (
                <TouchableOpacity 
                  key={routine.id}
                  activeOpacity={0.7}
                  onPress={() => handleRoutineCardPress(routine)}
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
                    <Text style={[styles.routineName, { color: theme.Colors.text.primary }]}>{routine.name}</Text>
                    {routine.description && (
                      <Text style={[styles.routineDescription, { color: theme.Colors.text.secondary }]}>{routine.description}</Text>
                    )}
                    <Text style={[styles.routineStreak, { color: theme.Colors.primary[500] }]}>
                      🔥 {TEXTS.streakDays(routine.streak)}
                    </Text>
                  </View>
                  {/* Delete button removed from tracker - only available in routines management */}
                </View>

                <View style={styles.routineFooter}>
                  <Text style={[styles.lastCompletedText, { color: theme.Colors.text.secondary }]}>
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
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          setEditingRoutine(null);
          setFormData(INITIAL_FORM_DATA);
          setIsFormVisible(true);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.fabInner}>
          <Ionicons name="add" size={24} color="white" />
        </View>
      </TouchableOpacity>
      
      {/* Add/Edit Routine Modal */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFormVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.Colors.surface.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.Colors.surface.border }]}>
            <TouchableOpacity onPress={() => setIsFormVisible(false)}>
              <Text style={[styles.modalCancelText, { color: theme.Colors.primary[500] }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.Colors.text.primary }]}>
              {editingRoutine ? 'Edit Routine' : 'Add New Routine'}
            </Text>
            <TouchableOpacity onPress={handleSaveRoutine}>
              <Text style={[styles.modalSaveText, { color: theme.Colors.primary[500] }]}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.Colors.text.primary }]}>Name *</Text>
              <TextInput
                style={[styles.formInput, { 
                  borderColor: theme.Colors.gray[300], 
                  backgroundColor: theme.Colors.surface.card,
                  color: theme.Colors.text.primary 
                }]}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter routine name"
                placeholderTextColor={theme.Colors.text.secondary}
                maxLength={50}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.Colors.text.primary }]}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea, { 
                  borderColor: theme.Colors.gray[300], 
                  backgroundColor: theme.Colors.surface.card,
                  color: theme.Colors.text.primary 
                }]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Enter description (optional)"
                placeholderTextColor={theme.Colors.text.secondary}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.Colors.text.primary }]}>Color</Text>
              <View style={styles.colorGrid}>
                {ROUTINE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, color})}
                  />
                ))}
              </View>
            </View>
            
            {/* Initial Streak - only show when adding new routine */}
            {!editingRoutine && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.Colors.text.primary }]}>Initial Streak (optional)</Text>
                <TextInput
                  style={[styles.formInput, { 
                    borderColor: theme.Colors.gray[300], 
                    backgroundColor: theme.Colors.surface.card,
                    color: theme.Colors.text.primary 
                  }]}
                  value={formData.initialStreak.toString()}
                  onChangeText={(text) => {
                    const numValue = parseInt(text) || 0;
                    setFormData({...formData, initialStreak: Math.max(0, numValue)});
                  }}
                  placeholder="0"
                  placeholderTextColor={theme.Colors.text.secondary}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={[styles.formHint, { color: theme.Colors.text.secondary }]}>
                  Start with an existing streak (e.g. if you've been doing this routine manually)
                </Text>
              </View>
            )}
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.Colors.text.primary }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {ROUTINE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      formData.icon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, icon})}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingTop: Theme.Spacing.sm,
  },
  header: {
    margin: Theme.Spacing.lg,
    marginBottom: Theme.Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  analyticsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.Colors.primary[50],
    marginLeft: 12,
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
    padding: Theme.Spacing.sm, // Add padding so buttons don't stick to edges
  },
  completedCard: {
    backgroundColor: Theme.Colors.success[50],
    opacity: 0.8,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.Spacing.sm,
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
    color: Theme.Colors.text.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  routineStreak: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.Colors.primary[500],
  },
  routineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Theme.Spacing.sm,
  },
  lastCompletedText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    marginRight: Theme.Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Theme.Spacing.sm,
    minWidth: 160, // Ensure consistent button area width
  },
  actionButton: {
    width: 75, // Fixed width for consistent sizing
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
  routineListContainer: {
    flex: 1,
    paddingBottom: Theme.Spacing.lg,
  },
  // New streak bar styles
  streakBar: {
    marginHorizontal: Theme.Spacing.lg,
    marginTop: Theme.Spacing.md,
    marginBottom: Theme.Spacing.lg,
  },
  streakCard: {
    // Card inherits styling
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.semibold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.xs,
  },
  streakDays: {
    fontSize: Theme.Typography.fontSize['2xl'],
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.primary[500],
    marginBottom: Theme.Spacing.xs,
  },
  streakSubtitle: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  streakAction: {
    padding: Theme.Spacing.sm,
    borderRadius: Theme.BorderRadius.full,
    backgroundColor: Theme.Colors.primary[50],
  },
  // FAB styles
  fab: {
    position: 'absolute',
    bottom: 20, // Equal to right margin
    right: 20,
    zIndex: 1000,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  iconOptionSelected: {
    borderColor: Theme.Colors.primary[500],
    backgroundColor: Theme.Colors.primary[50],
  },
  iconText: {
    fontSize: 24,
  },
});
