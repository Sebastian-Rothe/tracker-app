import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { Theme } from '@/constants/Theme';

export default function AnalyticsTab() {
  const handleBack = () => {
    // Navigation wird später hinzugefügt
    console.log('Back button pressed');
  };

  return (
    <View style={styles.container}>
      <AnalyticsDashboard onBack={handleBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.surface.background,
  },
});