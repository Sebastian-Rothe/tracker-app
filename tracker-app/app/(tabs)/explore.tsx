import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  
  // Enhanced bottom padding calculation for Android
  const getBottomPadding = () => {
    if (Platform.OS === 'ios') {
      return Math.max(insets.bottom + 20, 120);
    }
    
    // Android: Account for different navigation modes
    const hasPhysicalNavBar = insets.bottom === 0;
    const hasGestureNav = insets.bottom > 0;
    const tabBarHeight = 70;
    
    if (hasPhysicalNavBar) {
      return tabBarHeight + 40;
    } else if (hasGestureNav) {
      return Math.max(insets.bottom + tabBarHeight + 10, 140);
    } else {
      return 120;
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getBottomPadding() }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Entdecken</Text>
          <Text style={styles.subtitle}>Neue Routinen und Inspiration finden</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>🚧 In Entwicklung</Text>
          <Text style={styles.description}>
            Hier werden bald verfügbar sein:{'\n\n'}
            • Vorgefertigte Routine-Vorlagen{'\n'}
            • Community-Routinen{'\n'}
            • Motivierende Inhalte{'\n'}
            • Tipps und Tricks{'\n'}
            • Erfolgsgeschichten
          </Text>
        </View>
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
    fontSize: Theme.Typography.fontSize.lg,
    color: Theme.Colors.text.secondary,
    lineHeight: 24,
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
