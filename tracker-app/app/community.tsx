import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Theme } from '@/constants/Theme';
import { CommunityManager, CommunityUser, CommunityStats, UserComparison } from '@/utils/communityManager';

export default function CommunityPage() {
  const [userProfile, setUserProfile] = useState<CommunityUser | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [userComparisons, setUserComparisons] = useState<UserComparison[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [motivationMessage, setMotivationMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      const [profile, stats, comparisons, rank, motivation] = await Promise.all([
        CommunityManager.getUserProfile(),
        CommunityManager.getMockCommunityStats(),
        CommunityManager.getUserComparison(),
        CommunityManager.getUserRank(),
        CommunityManager.getCommunityMotivation(),
      ]);

      setUserProfile(profile);
      setCommunityStats(stats);
      setUserComparisons(comparisons);
      setUserRank(rank);
      setMotivationMessage(motivation);
    } catch (error) {
      console.error('Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    Alert.prompt(
      'Join Community',
      'Choose a username to join the community:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: async (username?: string) => {
            if (username && username.trim()) {
              try {
                await CommunityManager.createUserProfile(username.trim(), true);
                loadCommunityData();
              } catch (error) {
                Alert.alert('Error', 'Failed to create profile');
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleTogglePublicProfile = async () => {
    try {
      const newStatus = await CommunityManager.togglePublicProfile();
      setUserProfile(prev => prev ? { ...prev, publicProfile: newStatus } : null);
      
      if (newStatus) {
        loadCommunityData(); // Refresh to show in leaderboard
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile settings');
    }
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return Theme.Colors.warning[500]; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    if (rank <= 10) return Theme.Colors.primary[500];
    return Theme.Colors.gray[500];
  };

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🌟';
    return '👤';
  };

  const formatTimeSince = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeIcon}>👥</Text>
          <Text style={styles.welcomeTitle}>Join the Community!</Text>
          <Text style={styles.welcomeDescription}>
            Connect with others, compare your progress, and stay motivated together.
          </Text>
          
          <TouchableOpacity style={styles.joinButton} onPress={handleCreateProfile}>
            <Text style={styles.joinButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>

        {communityStats && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Community Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{communityStats.totalUsers}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{communityStats.averageStreak}</Text>
                <Text style={styles.statLabel}>Avg Streak</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <Text style={styles.profileIcon}>👤</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.username}</Text>
            <Text style={styles.profileJoined}>
              Joined {new Date(userProfile.joinedDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.profileRank}>
            <Text style={[styles.rankEmoji, { color: getRankColor(userRank) }]}>
              {getRankEmoji(userRank)}
            </Text>
            <Text style={[styles.rankText, { color: getRankColor(userRank) }]}>
              #{userRank}
            </Text>
          </View>
        </View>

        <View style={styles.profileSettings}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Public Profile</Text>
            <Switch
              value={userProfile.publicProfile}
              onValueChange={handleTogglePublicProfile}
              trackColor={{ false: Theme.Colors.gray[300], true: Theme.Colors.primary[300] }}
              thumbColor={userProfile.publicProfile ? Theme.Colors.primary[500] : Theme.Colors.gray[500]}
            />
          </View>
          <Text style={styles.settingDescription}>
            {userProfile.publicProfile 
              ? 'Your progress is visible to the community'
              : 'Only you can see your progress'
            }
          </Text>
        </View>
      </View>

      {/* Motivation Message */}
      <View style={styles.motivationSection}>
        <Text style={styles.motivationText}>{motivationMessage}</Text>
      </View>

      {/* User Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{userProfile.totalStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{userProfile.achievementsUnlocked}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{userProfile.totalCompletions}</Text>
            <Text style={styles.statLabel}>Completions</Text>
          </View>
        </View>
      </View>

      {/* Community Leaderboard */}
      {communityStats && (
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
          {communityStats.topPerformers.map((user, index) => (
            <View key={user.id} style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={[styles.rankEmoji, { color: getRankColor(index + 1) }]}>
                  {getRankEmoji(index + 1)}
                </Text>
                <Text style={[styles.rankNumber, { color: getRankColor(index + 1) }]}>
                  {index + 1}
                </Text>
              </View>
              
              <View style={styles.leaderboardInfo}>
                <Text style={[
                  styles.leaderboardName, 
                  user.id === userProfile.id && styles.currentUser
                ]}>
                  {user.username} {user.id === userProfile.id && '(You)'}
                </Text>
                <Text style={styles.leaderboardStats}>
                  {user.totalStreak} days • {user.achievementsUnlocked} achievements
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* User Comparisons */}
      {userComparisons.length > 0 && (
        <View style={styles.comparisonsSection}>
          <Text style={styles.sectionTitle}>📊 Compare With Others</Text>
          {userComparisons.slice(0, 3).map((comparison) => (
            <View key={comparison.user.id} style={styles.comparisonItem}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonName}>{comparison.user.username}</Text>
                <Text style={styles.comparisonRank}>#{comparison.comparison.rank}</Text>
              </View>
              
              <View style={styles.comparisonStats}>
                <View style={styles.comparisonStat}>
                  <Text style={styles.comparisonLabel}>Streak</Text>
                  <Text style={[
                    styles.comparisonDiff,
                    { color: comparison.comparison.streakDifference >= 0 ? Theme.Colors.success[500] : Theme.Colors.error[500] }
                  ]}>
                    {comparison.comparison.streakDifference >= 0 ? '+' : ''}{comparison.comparison.streakDifference}
                  </Text>
                </View>
                
                <View style={styles.comparisonStat}>
                  <Text style={styles.comparisonLabel}>Achievements</Text>
                  <Text style={[
                    styles.comparisonDiff,
                    { color: comparison.comparison.achievementDifference >= 0 ? Theme.Colors.success[500] : Theme.Colors.error[500] }
                  ]}>
                    {comparison.comparison.achievementDifference >= 0 ? '+' : ''}{comparison.comparison.achievementDifference}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activity */}
      {communityStats && (
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>📢 Recent Activity</Text>
          {communityStats.recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <Text style={styles.activityUser}>{activity.username}</Text>
                <Text style={styles.activityText}>
                  {activity.type === 'achievement_unlocked' && 
                    `unlocked "${activity.data.achievementTitle}" 🏆`
                  }
                  {activity.type === 'streak_milestone' && 
                    `reached ${activity.data.streakDays} day streak! 🔥`
                  }
                  {activity.type === 'routine_completed' && 
                    `completed "${activity.data.routineName}" ✅`
                  }
                </Text>
              </View>
              <Text style={styles.activityTime}>
                {formatTimeSince(activity.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.gray[50],
  },
  contentContainer: {
    paddingBottom: Theme.Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.Colors.gray[50],
  },
  loadingText: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
  },
  welcomeSection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.xl,
    borderRadius: Theme.BorderRadius.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: Theme.Spacing.md,
  },
  welcomeTitle: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.sm,
  },
  welcomeDescription: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Theme.Spacing.lg,
  },
  joinButton: {
    backgroundColor: Theme.Colors.primary[500],
    paddingVertical: Theme.Spacing.md,
    paddingHorizontal: Theme.Spacing.xl,
    borderRadius: Theme.BorderRadius.lg,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
  },
  previewSection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    marginTop: 0,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
    marginBottom: Theme.Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: Theme.Colors.gray[50],
    padding: Theme.Spacing.md,
    borderRadius: Theme.BorderRadius.md,
    minWidth: 80,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Theme.Spacing.xs,
  },
  statValue: {
    fontSize: Theme.Typography.fontSize.xl,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },
  statLabel: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.Spacing.lg,
  },
  profileIcon: {
    fontSize: 40,
    marginRight: Theme.Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
    color: Theme.Colors.text.primary,
  },
  profileJoined: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  profileRank: {
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankText: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  rankNumber: {
    fontSize: Theme.Typography.fontSize.xs,
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  profileSettings: {
    borderTopWidth: 1,
    borderTopColor: Theme.Colors.gray[200],
    paddingTop: Theme.Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.xs,
  },
  settingLabel: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.text.primary,
  },
  settingDescription: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  motivationSection: {
    backgroundColor: Theme.Colors.primary[50],
    margin: Theme.Spacing.lg,
    marginTop: 0,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.Colors.primary[500],
  },
  motivationText: {
    fontSize: Theme.Typography.fontSize.base,
    color: Theme.Colors.primary[700],
    fontWeight: Theme.Typography.fontWeight.medium,
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    marginTop: 0,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leaderboardSection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    marginTop: 0,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.gray[100],
  },
  leaderboardRank: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Theme.Spacing.md,
    minWidth: 50,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.text.primary,
  },
  currentUser: {
    color: Theme.Colors.primary[600],
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  leaderboardStats: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  comparisonsSection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    marginTop: 0,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  comparisonItem: {
    backgroundColor: Theme.Colors.gray[50],
    padding: Theme.Spacing.md,
    borderRadius: Theme.BorderRadius.md,
    marginBottom: Theme.Spacing.md,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.sm,
  },
  comparisonName: {
    fontSize: Theme.Typography.fontSize.base,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.text.primary,
  },
  comparisonRank: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonStat: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: Theme.Typography.fontSize.xs,
    color: Theme.Colors.text.secondary,
    marginBottom: 2,
  },
  comparisonDiff: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  activitySection: {
    backgroundColor: '#ffffff',
    margin: Theme.Spacing.lg,
    marginTop: 0,
    padding: Theme.Spacing.lg,
    borderRadius: Theme.BorderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Theme.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.gray[100],
  },
  activityContent: {
    flex: 1,
    marginRight: Theme.Spacing.sm,
  },
  activityUser: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.medium,
    color: Theme.Colors.text.primary,
  },
  activityText: {
    fontSize: Theme.Typography.fontSize.sm,
    color: Theme.Colors.text.secondary,
  },
  activityTime: {
    fontSize: Theme.Typography.fontSize.xs,
    color: Theme.Colors.text.tertiary,
  },
});