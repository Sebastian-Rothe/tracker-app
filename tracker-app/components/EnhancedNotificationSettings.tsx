import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { scheduleRoutineNotifications, cancelAllNotifications } from '@/utils/notificationManager';
import { loadSettings, saveSettings } from '@/utils/settingsStorage';

export const EnhancedNotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      setLoading(false);
      updateScheduledCount();
    })();
  }, []);

  const updateScheduledCount = async () => {
    try {
      const { getScheduledNotifications } = await import('@/utils/notificationManager');
      const notifications = await getScheduledNotifications();
      setScheduledCount(notifications.length);
    } catch {
      setScheduledCount(null);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (settings.notificationEnabled) {
      await scheduleRoutineNotifications();
      updateScheduledCount();
    } else {
      await cancelAllNotifications();
      setScheduledCount(0);
    }
  };

  if (loading || !settings) {
    return <ActivityIndicator size="large" style={{ margin: 32 }} />;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>⚡ Enhanced Notifications</Text>
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={styles.switchLabel}>🔔 Multiple Daily Reminders</Text>
          <Text style={styles.switchDescription}>Get 4 smart reminders daily (7AM, 2PM, 6PM, 8PM)</Text>
        </View>
        <Switch
          value={settings.multipleReminders ?? true}
          onValueChange={value => handleToggle('multipleReminders', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.multipleReminders ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <Text style={styles.switchLabel}>🎯 Smart Notifications Only</Text>
          <Text style={styles.switchDescription}>Skip notifications when all routines are completed</Text>
        </View>
        <Switch
          value={settings.onlyIfIncomplete ?? true}
          onValueChange={value => handleToggle('onlyIfIncomplete', value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.onlyIfIncomplete ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Scheduled Notifications:</Text>
        <Text style={styles.statusValue}>{scheduledCount !== null ? scheduledCount : '-'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
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
    color: '#222',
  },
  switchDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 15,
    color: '#444',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
});

export default EnhancedNotificationSettings;
