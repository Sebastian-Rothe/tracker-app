import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Theme } from '@/constants/Theme';
import { Achievement } from '@/utils/achievementManager';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onHide,
  duration = 4000
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Slide in from top
      Animated.sequence([
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Wait
        Animated.delay(duration),
        // Slide out
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, achievement]);

  if (!visible || !achievement) {
    return null;
  }

  const getCategoryColor = (category: Achievement['category']): string => {
    switch (category) {
      case 'streak': return Theme.Colors.warning[500];
      case 'consistency': return Theme.Colors.success[500];
      case 'milestone': return Theme.Colors.primary[500];
      case 'special': return Theme.Colors.info[500];
      default: return Theme.Colors.gray[500];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: fadeAnim,
          borderLeftColor: getCategoryColor(achievement.category),
        }
      ]}
    >
      {/* Celebration Effect */}
      <View style={styles.celebrationContainer}>
        <Text style={styles.celebrationText}>🎉</Text>
        <Text style={styles.celebrationText}>✨</Text>
        <Text style={styles.celebrationText}>🏆</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.achievementUnlockedText}>
            Achievement Unlocked!
          </Text>
          <Text style={styles.categoryBadge}>
            {achievement.category.toUpperCase()}
          </Text>
        </View>

        <View style={styles.achievementInfo}>
          <Text style={styles.achievementIcon}>
            {achievement.icon}
          </Text>
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>
              {achievement.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressIndicator}>
        <View 
          style={[
            styles.progressBar,
            { backgroundColor: getCategoryColor(achievement.category) }
          ]} 
        />
      </View>
    </Animated.View>
  );
};

export default AchievementNotification;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Theme.Spacing.md,
    right: Theme.Spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: Theme.BorderRadius.lg,
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  celebrationContainer: {
    position: 'absolute',
    top: -10,
    right: 10,
    flexDirection: 'row',
    gap: 5,
  },
  celebrationText: {
    fontSize: 20,
    opacity: 0.8,
  },
  content: {
    padding: Theme.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.md,
  },
  achievementUnlockedText: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.success[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.Colors.gray[600],
    backgroundColor: Theme.Colors.gray[100],
    paddingHorizontal: Theme.Spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.BorderRadius.sm,
  },
  achievementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 40,
    marginRight: Theme.Spacing.md,
    textAlign: 'center',
    width: 50,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.xs,
  },
  achievementDescription: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
    lineHeight: 18,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Theme.Colors.gray[200],
  },
  progressBar: {
    height: '100%',
    width: '100%',
  },
});