import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { scheduleRoutineNotifications } from '@/utils/notificationManager';
import { saveSettings } from '@/utils/settingsStorage';

interface EnhancedNotificationSettingsProps {
  settings: any;
  setSettings: (settings: any) => void;
}

export const EnhancedNotificationSettings: React.FC<EnhancedNotificationSettingsProps> = ({ 
  settings, 
  setSettings 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: theme.Colors.surface.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.Colors.text.primary }]}>
        ⚡ Enhanced Notifications
      </Text>
      
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={[styles.switchLabel, { color: theme.Colors.text.primary }]}>
            🔔 Multiple Daily Reminders
          </Text>
          <Text style={[styles.switchDescription, { color: theme.Colors.text.secondary }]}>
            Get 4 smart reminders daily (7AM, 2PM, 6PM, 8PM) instead of single time
          </Text>
        </View>
        <Switch
          value={settings.multipleReminders ?? true}
          onValueChange={async (value: boolean) => {
            const newSettings = { 
              ...settings, 
              multipleReminders: value,
              // Ensure we have a default single time when switching to single mode
              notificationTime: settings.notificationTime || '07:00'
            };
            setSettings(newSettings);
            await saveSettings(newSettings);
            if (settings.notificationEnabled) {
              await scheduleRoutineNotifications();
            }
          }}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.multipleReminders ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={[styles.switchLabel, { color: theme.Colors.text.primary }]}>
            🎯 Smart Notifications Only
          </Text>
          <Text style={[styles.switchDescription, { color: theme.Colors.text.secondary }]}>
            Skip notifications when all routines are completed
          </Text>
        </View>
        <Switch
          value={settings.onlyIfIncomplete ?? true}
          onValueChange={async (value: boolean) => {
            const newSettings = { ...settings, onlyIfIncomplete: value };
            setSettings(newSettings);
            await saveSettings(newSettings);
          }}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.onlyIfIncomplete ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default EnhancedNotificationSettings;