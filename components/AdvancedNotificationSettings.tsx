import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleRoutineNotifications, cancelAllNotifications } from '@/utils/notificationManager';
import { loadSettings, saveSettings, SettingsData } from '@/utils/settingsStorage';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const AdvancedNotificationSettings: React.FC = () => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  useEffect(() => {
    loadInitialSettings();
  }, []);

  const loadInitialSettings = async () => {
    try {
      const loaded = await loadSettings();
      
      // Ensure reminderTimes is properly set
      if (!loaded.reminderTimes || loaded.reminderTimes.length === 0) {
        loaded.reminderTimes = ['07:00', '14:00', '18:00', '20:00'];
        loaded.customTimes = false;
        await saveSettings(loaded); // Save the corrected settings
      }
      
      setSettings(loaded);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof SettingsData, value: boolean) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    
    // Special handling for main notification toggle
    if (key === 'notificationEnabled' && !value) {
      await cancelAllNotifications();
    }
    
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    if (newSettings.notificationEnabled) {
      await scheduleRoutineNotifications();
    }
  };

  const addCustomTime = () => {
    if (!settings || !settings.reminderTimes || settings.reminderTimes.length >= 8) return;
    
    // Set default time for new reminder (current time + 1 hour)
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setSelectedTime(now);
    setEditingTimeIndex(null); // null means adding new time
    setShowTimePicker(true);
  };

  const removeCustomTime = async (index: number) => {
    if (!settings || !settings.reminderTimes) return;
    
    const newTimes = settings.reminderTimes.filter((_, i) => i !== index);
    const newSettings = { ...settings, reminderTimes: newTimes };
    
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    if (settings.notificationEnabled) {
      await scheduleRoutineNotifications();
    }
  };

  const handleTimePress = (index: number) => {
    if (!settings?.reminderTimes) return;
    
    const timeString = settings.reminderTimes[index];
    const [hours, minutes] = timeString.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0, 0);
    
    setSelectedTime(timeDate);
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (time && settings) {
      const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      // Check for duplicate times
      const existingTimes = settings.reminderTimes || [];
      const isDuplicate = editingTimeIndex !== null 
        ? existingTimes.some((t, index) => t === timeString && index !== editingTimeIndex)
        : existingTimes.includes(timeString);
      
      if (isDuplicate) {
        Alert.alert(
          'Duplicate Time',
          `${timeString} is already set as a reminder time. Please choose a different time.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (editingTimeIndex !== null) {
        // Editing existing time
        const newTimes = [...settings.reminderTimes!];
        newTimes[editingTimeIndex] = timeString;
        updateTimesAndSave(newTimes.sort());
      } else {
        // Adding new time
        const newTimes = [...(settings.reminderTimes || []), timeString].sort();
        updateTimesAndSave(newTimes);
      }
    }
    
    if (Platform.OS === 'ios') {
      // On iOS, don't close immediately - user needs to tap Done
      setSelectedTime(time || selectedTime);
    }
  };
  
  const updateTimesAndSave = async (newTimes: string[]) => {
    if (!settings) return;
    
    const newSettings = { ...settings, reminderTimes: newTimes, customTimes: true };
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    if (settings.notificationEnabled) {
      await scheduleRoutineNotifications();
    }
  };
  
  const confirmIOSTimeChange = () => {
    setShowTimePicker(false);
    // Time change already handled in handleTimeChange
  };
  
  const cancelTimeChange = () => {
    setShowTimePicker(false);
    setEditingTimeIndex(null);
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Notification Settings',
      'This will reset all notification settings to default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings = {
              ...settings!,
              reminderTimes: ['07:00', '14:00', '18:00', '20:00'],
              escalatingReminders: true,
              maxEscalationLevel: 8,
              customTimes: false,
              streakProtection: true,
              smartTiming: true,
            };
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
            
            if (defaultSettings.notificationEnabled) {
              await scheduleRoutineNotifications();
            }
          }
        }
      ]
    );
  };

  if (loading || !settings) {
    return (
      <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
        <ActivityIndicator size="large" color={theme.Colors.primary[500]} />
        <Text style={[styles.loadingText, { color: theme.Colors.text.secondary }]}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color={theme.Colors.primary[500]} />
        <Text style={[styles.title, { color: theme.Colors.text.primary }]}>Notifications</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.Colors.text.secondary }]}>Customize when and how you get reminded</Text>

      {/* Main Enable/Disable */}
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={[styles.switchLabel, { color: theme.Colors.text.primary }]}>📱 Enable Notifications</Text>
          <Text style={[styles.switchDescription, { color: theme.Colors.text.secondary }]}>Master switch for all notifications</Text>
        </View>
        <Switch
          value={settings.notificationEnabled}
          onValueChange={value => handleToggle('notificationEnabled', value)}
          trackColor={{ false: theme.Colors.gray[400], true: theme.Colors.primary[300] }}
          thumbColor={settings.notificationEnabled ? theme.Colors.primary[500] : theme.Colors.gray[300]}
        />
      </View>

      {settings.notificationEnabled && (
        <>
          {/* Smart Features */}
          <View style={styles.smartFeaturesContainer}>
            <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>🧠 Smart Features</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchLabel, { color: theme.Colors.text.primary }]}>✅ Skip When Complete</Text>
                <Text style={[styles.switchDescription, { color: theme.Colors.text.secondary }]}>No notifications when all routines are done</Text>
              </View>
              <Switch
                value={settings.onlyIfIncomplete ?? true}
                onValueChange={value => handleToggle('onlyIfIncomplete', value)}
                trackColor={{ false: theme.Colors.gray[400], true: '#4ade80' }}
                thumbColor={settings.onlyIfIncomplete ? '#22c55e' : theme.Colors.gray[300]}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchLabel, { color: theme.Colors.text.primary }]}>🔥 Streak Protection</Text>
                <Text style={[styles.switchDescription, { color: theme.Colors.text.secondary }]}>Extra warnings for streaks at risk</Text>
              </View>
              <Switch
                value={settings.streakProtection ?? true}
                onValueChange={value => handleToggle('streakProtection', value)}
                trackColor={{ false: theme.Colors.gray[400], true: '#f59e0b' }}
                thumbColor={settings.streakProtection ? '#f97316' : theme.Colors.gray[300]}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchLabel, { color: theme.Colors.text.primary }]}>📈 Escalating Reminders</Text>
                <Text style={[styles.switchDescription, { color: theme.Colors.text.secondary }]}>More frequent reminders as day progresses</Text>
              </View>
              <Switch
                value={settings.escalatingReminders ?? true}
                onValueChange={value => handleToggle('escalatingReminders', value)}
                trackColor={{ false: theme.Colors.gray[400], true: '#f97316' }}
                thumbColor={settings.escalatingReminders ? '#ea580c' : theme.Colors.gray[300]}
              />
            </View>
          </View>

          {/* Timing Settings */}
          <View style={styles.timingContainer}>
            <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>⏰ Reminder Times</Text>
            
            {/* Timing Info Box */}
            <View style={[styles.infoBox, { backgroundColor: theme.Colors.primary[50], borderColor: theme.Colors.primary[200] }]}>
              <View style={styles.infoContent}>
                <Ionicons name="information-circle" size={16} color={theme.Colors.primary[600]} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.Colors.primary[700] }]}>
                  Notifications may arrive ±15 minutes from set time for better battery optimization
                </Text>
              </View>
            </View>
            
            {settings.reminderTimes?.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <TouchableOpacity 
                  style={[styles.timeButton, { backgroundColor: theme.Colors.primary[500] }]}
                  onPress={() => handleTimePress(index)}
                >
                  <Text style={[styles.timeText, { color: theme.Colors.text.inverse }]}>{time}</Text>
                </TouchableOpacity>
                
                {settings.reminderTimes!.length > 1 && (
                  <TouchableOpacity 
                    style={[styles.removeButton, { backgroundColor: theme.Colors.error[500] }]}
                    onPress={() => removeCustomTime(index)}
                  >
                    <Text style={[styles.removeButtonText, { color: theme.Colors.text.inverse }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {(settings.reminderTimes?.length || 0) < 8 && (
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.Colors.success[500] }]} 
                onPress={addCustomTime}
              >
                <Text style={[styles.addButtonText, { color: theme.Colors.text.inverse }]}>+ Add Time</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: theme.Colors.gray[100] }]} 
            onPress={resetToDefaults}
          >
            <Text style={[styles.resetButtonText, { color: theme.Colors.text.secondary }]}>↻ Reset to Defaults</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.timePickerModal}>
            <View style={[styles.timePickerContainer, { backgroundColor: theme.Colors.surface.card }]}>
              <Text style={[styles.timePickerTitle, { color: theme.Colors.text.primary }]}>
                {editingTimeIndex !== null ? 'Edit Reminder Time' : 'Add Reminder Time'}
              </Text>
              
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
              
              {Platform.OS === 'ios' && (
                <View style={styles.timePickerButtons}>
                  <TouchableOpacity 
                    style={[styles.timePickerButton, { backgroundColor: theme.Colors.gray[200] }]}
                    onPress={cancelTimeChange}
                  >
                    <Text style={[styles.timePickerButtonText, { color: theme.Colors.text.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.timePickerButton, { backgroundColor: theme.Colors.primary[500] }]}
                    onPress={confirmIOSTimeChange}
                  >
                    <Text style={[styles.timePickerButtonText, { color: theme.Colors.text.inverse }]}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  smartFeaturesContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  timingContainer: {
    marginTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 80,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 16,
  },
  resetButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Time Picker Styles
  timePickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timePickerContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    minWidth: 300,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  timePicker: {
    width: 200,
    height: 120,
  },
  timePickerButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  timePickerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Info Box Styles
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default AdvancedNotificationSettings;