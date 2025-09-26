import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  loadRoutines, 
  createRoutine, 
  updateRoutine, 
  deleteRoutine,
  validateRoutineCreation,
  validateStreakInput 
} from '@/utils/settingsStorage';
import { 
  Routine, 
  CreateRoutineRequest, 
  ROUTINE_COLORS, 
  ROUTINE_ICONS,
  RoutineColor,
  RoutineIcon 
} from '@/types/routine';

const TEXTS = {
  title: 'Manage Routines',
  addRoutine: 'Add New Routine',
  editRoutine: 'Edit Routine',
  routineName: 'Routine Name',
  routineDescription: 'Description (optional)',
  chooseColor: 'Choose Color',
  chooseIcon: 'Choose Icon',
  initialStreak: 'Initial Streak (optional)',
  initialStreakPlaceholder: 'Enter starting streak days',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmDelete: 'Confirm Delete',
  deleteMessage: (name: string) => `Are you sure you want to delete "${name}"? This cannot be undone.`,
  noRoutines: 'No routines yet',
  noRoutinesSubtext: 'Add your first routine to start tracking!',
  activeRoutines: (count: number) => `${count} Active Routine${count !== 1 ? 's' : ''}`,
  created: 'Created',
  streak: (days: number) => `${days} day${days !== 1 ? 's' : ''}`,
  lastConfirmed: 'Last confirmed',
  never: 'Never',
  today: 'Today',
  yesterday: 'Yesterday',
  daysAgo: (days: number) => `${days} days ago`,
};

interface RoutineFormData {
  name: string;
  description: string;
  color: RoutineColor;
  icon: RoutineIcon;
  initialStreak: string; // As string for input validation
}

const INITIAL_FORM_DATA: RoutineFormData = {
  name: '',
  description: '',
  color: ROUTINE_COLORS[0],
  icon: ROUTINE_ICONS[0],
  initialStreak: '',
};

export default function RoutineManagementScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [formData, setFormData] = useState<RoutineFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoutineData();
  }, []);

  const loadRoutineData = async () => {
    try {
      const loadedRoutines = await loadRoutines();
      setRoutines(loadedRoutines);
    } catch (error) {
      console.error('Error loading routines:', error);
      Alert.alert('Error', 'Failed to load routines');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingRoutine(null);
    setFormData(INITIAL_FORM_DATA);
    setIsFormVisible(true);
  };

  const openEditForm = (routine: Routine) => {
    setEditingRoutine(routine);
    setFormData({
      name: routine.name,
      description: routine.description || '',
      color: routine.color as RoutineColor,
      icon: routine.icon as RoutineIcon,
      initialStreak: routine.streak.toString(),
    });
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingRoutine(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSave = async () => {
    try {
      // Validate initial streak input
      let initialStreakValue = 0;
      if (formData.initialStreak.trim()) {
        const streakValidation = validateStreakInput(formData.initialStreak);
        if (!streakValidation.isValid) {
          Alert.alert('Validation Error', streakValidation.error);
          return;
        }
        initialStreakValue = streakValidation.value || 0;
      }

      const request: CreateRoutineRequest = {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
      };

      const validation = validateRoutineCreation(request);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.error);
        return;
      }

      if (editingRoutine) {
        // Update existing routine
        await updateRoutine({
          id: editingRoutine.id,
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          icon: formData.icon,
        });
        
        // Update streak if changed (only when editing)
        if (initialStreakValue !== editingRoutine.streak) {
          const routines = await loadRoutines();
          const routineIndex = routines.findIndex(r => r.id === editingRoutine.id);
          if (routineIndex !== -1) {
            routines[routineIndex].streak = initialStreakValue;
            // Reset lastConfirmed if streak is manually changed
            if (initialStreakValue === 0) {
              routines[routineIndex].lastConfirmed = '';
            }
            // Save updated routines - we need to import saveRoutines
            const { saveRoutines } = await import('@/utils/settingsStorage');
            await saveRoutines(routines);
          }
        }
      } else {
        // Create new routine with initial streak
        const newRoutine = await createRoutine(request);
        if (initialStreakValue > 0) {
          const routines = await loadRoutines();
          const routineIndex = routines.findIndex(r => r.id === newRoutine.id);
          if (routineIndex !== -1) {
            routines[routineIndex].streak = initialStreakValue;
            const { saveRoutines } = await import('@/utils/settingsStorage');
            await saveRoutines(routines);
          }
        }
      }

      await loadRoutineData();
      closeForm();
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    }
  };

  const handleDelete = (routine: Routine) => {
    console.log('handleDelete called for routine:', routine.name);
    
    // Use proper React Native Alert with confirmation
    Alert.alert(
      TEXTS.confirmDelete,
      TEXTS.deleteMessage(routine.name),
      [
        {
          text: TEXTS.cancel,
          style: 'cancel',
          onPress: () => console.log('Delete cancelled by user')
        },
        {
          text: TEXTS.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting routine:', routine.id);
              await deleteRoutine(routine.id);
              console.log('Routine deleted successfully, reloading data...');
              await loadRoutineData();
              console.log('Data reloaded after deletion');
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const formatLastConfirmed = (lastConfirmed: string): string => {
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading routines...</Text>
      </SafeAreaView>
    );
  }

  if (isFormVisible) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.Colors.surface.background }]}>
        <ScrollView 
          style={[styles.formContainer, { backgroundColor: theme.Colors.surface.background }]}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom) // Minimal padding to prevent button overlap
          }}
        >
          <Text style={[styles.formTitle, { color: theme.Colors.text.primary }]}>
            {editingRoutine ? TEXTS.editRoutine : TEXTS.addRoutine}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.Colors.text.primary }]}>{TEXTS.routineName}</Text>
            <TextInput
              style={[styles.textInput, { 
                borderColor: theme.Colors.gray[300], 
                backgroundColor: theme.Colors.surface.card,
                color: theme.Colors.text.primary 
              }]}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g., Morning Exercise"
              placeholderTextColor={theme.Colors.text.secondary}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.Colors.text.primary }]}>{TEXTS.routineDescription}</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput, { 
                borderColor: theme.Colors.gray[300], 
                backgroundColor: theme.Colors.surface.card,
                color: theme.Colors.text.primary 
              }]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Brief description of your routine"
              placeholderTextColor={theme.Colors.text.secondary}
              maxLength={200}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.Colors.text.primary }]}>{TEXTS.initialStreak}</Text>
            <TextInput
              style={[styles.textInput, { 
                borderColor: theme.Colors.gray[300], 
                backgroundColor: theme.Colors.surface.card,
                color: theme.Colors.text.primary 
              }]}
              value={formData.initialStreak}
              onChangeText={(text) => setFormData(prev => ({ ...prev, initialStreak: text }))}
              placeholder={TEXTS.initialStreakPlaceholder}
              placeholderTextColor={theme.Colors.text.secondary}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.Colors.text.primary }]}>{TEXTS.chooseColor}</Text>
            <View style={styles.colorPicker}>
              {ROUTINE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    formData.color === color && styles.selectedColor,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.Colors.text.primary }]}>{TEXTS.chooseIcon}</Text>
            <View style={styles.iconPicker}>
              {ROUTINE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    formData.icon === icon && styles.selectedIcon,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, icon }))}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeForm}>
              <Text style={styles.cancelButtonText}>{TEXTS.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{TEXTS.save}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{TEXTS.title}</Text>
        <Text style={styles.subtitle}>{TEXTS.activeRoutines(routines.filter(r => r.isActive).length)}</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
        <Text style={styles.addButtonText}>+ {TEXTS.addRoutine}</Text>
      </TouchableOpacity>

      {routines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.Colors.text.primary }]}>{TEXTS.noRoutines}</Text>
          <Text style={[styles.emptySubtext, { color: theme.Colors.text.secondary }]}>{TEXTS.noRoutinesSubtext}</Text>
        </View>
      ) : (
        <ScrollView style={styles.routineList}>
          {routines.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              style={[styles.routineCard, { 
                borderLeftColor: routine.color,
                backgroundColor: theme.Colors.surface.card
              }]}
              onPress={() => openEditForm(routine)}
            >
              <View style={styles.routineHeader}>
                <View style={[styles.routineIconContainer, { 
                  backgroundColor: theme.Colors.surface.overlay 
                }]}>
                  <Text style={styles.routineIcon}>{routine.icon}</Text>
                </View>
                <View style={styles.routineInfo}>
                  <Text style={[styles.routineName, { color: theme.Colors.text.primary }]}>{routine.name}</Text>
                  {routine.description && (
                    <Text style={[styles.routineDescription, { color: theme.Colors.text.secondary }]}>{routine.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(routine)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.routineStats}>
                <Text style={styles.streakText}>{TEXTS.streak(routine.streak)}</Text>
                <Text style={styles.lastConfirmedText}>
                  {TEXTS.lastConfirmed}: {formatLastConfirmed(routine.lastConfirmed)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    // color will be applied inline
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    // color will be applied inline
    textAlign: 'center',
  },
  routineList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  routineCard: {
    // backgroundColor will be applied inline with theme.Colors.surface.card
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor will be applied inline
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routineIcon: {
    fontSize: 20,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
    // color will be applied inline
  },
  routineDescription: {
    fontSize: 14,
    // color will be applied inline
    marginTop: 2,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  routineStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  lastConfirmedText: {
    fontSize: 12,
    color: '#999',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIcon: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  iconText: {
    fontSize: 24,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
