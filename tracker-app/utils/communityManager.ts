import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from './achievementManager';

export interface CommunityUser {
  id: string;
  username: string;
  totalStreak: number;
  achievementsUnlocked: number;
  totalCompletions: number;
  joinedDate: string;
  avatar?: string;
  publicProfile: boolean;
}

export interface CommunityStats {
  totalUsers: number;
  averageStreak: number;
  topPerformers: CommunityUser[];
  recentActivity: CommunityActivity[];
}

export interface CommunityActivity {
  id: string;
  userId: string;
  username: string;
  type: 'achievement_unlocked' | 'streak_milestone' | 'routine_completed';
  data: {
    achievementId?: string;
    achievementTitle?: string;
    streakDays?: number;
    routineName?: string;
  };
  timestamp: string;
}

export interface UserComparison {
  user: CommunityUser;
  comparison: {
    streakDifference: number; // positive if user is ahead
    achievementDifference: number;
    completionDifference: number;
    rank?: number;
  };
}

const STORAGE_KEYS = {
  USER_PROFILE: 'community_user_profile',
  COMMUNITY_CACHE: 'community_cache',
  ACTIVITY_FEED: 'community_activity_feed',
  LEADERBOARD: 'community_leaderboard',
};

export class CommunityManager {
  
  /**
   * Create or update user profile
   */
  static async createUserProfile(username: string, publicProfile: boolean = false): Promise<CommunityUser> {
    try {
      const existingProfile = await this.getUserProfile();
      
      const userProfile: CommunityUser = {
        id: existingProfile?.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        totalStreak: existingProfile?.totalStreak || 0,
        achievementsUnlocked: existingProfile?.achievementsUnlocked || 0,
        totalCompletions: existingProfile?.totalCompletions || 0,
        joinedDate: existingProfile?.joinedDate || new Date().toISOString(),
        publicProfile,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get current user profile
   */
  static async getUserProfile(): Promise<CommunityUser | null> {
    try {
      const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user statistics
   */
  static async updateUserStats(stats: {
    totalStreak?: number;
    achievementsUnlocked?: number;
    totalCompletions?: number;
  }): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return;

      const updatedProfile: CommunityUser = {
        ...profile,
        ...stats,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  /**
   * Generate mock community data (simulates real community features)
   */
  static async getMockCommunityStats(): Promise<CommunityStats> {
    const currentUser = await this.getUserProfile();
    
    // Generate mock users based on current user's performance
    const mockUsers: CommunityUser[] = [
      {
        id: 'user_1',
        username: 'StreakMaster',
        totalStreak: Math.max(currentUser?.totalStreak || 0, 45) + 15,
        achievementsUnlocked: Math.max(currentUser?.achievementsUnlocked || 0, 8) + 2,
        totalCompletions: Math.max(currentUser?.totalCompletions || 0, 150) + 50,
        joinedDate: '2025-08-01T00:00:00.000Z',
        publicProfile: true,
      },
      {
        id: 'user_2', 
        username: 'ConsistencyQueen',
        totalStreak: Math.max(currentUser?.totalStreak || 0, 38) + 8,
        achievementsUnlocked: Math.max(currentUser?.achievementsUnlocked || 0, 9) + 1,
        totalCompletions: Math.max(currentUser?.totalCompletions || 0, 120) + 30,
        joinedDate: '2025-08-15T00:00:00.000Z',
        publicProfile: true,
      },
      {
        id: 'user_3',
        username: 'RoutineRocker',
        totalStreak: Math.max(currentUser?.totalStreak || 0, 25) + 5,
        achievementsUnlocked: Math.max(currentUser?.achievementsUnlocked || 0, 6) + 1,
        totalCompletions: Math.max(currentUser?.totalCompletions || 0, 95) + 20,
        joinedDate: '2025-09-01T00:00:00.000Z',
        publicProfile: true,
      },
    ];

    // Add current user if available
    if (currentUser && currentUser.publicProfile) {
      mockUsers.push(currentUser);
    }

    // Sort by total streak
    const topPerformers = mockUsers.sort((a, b) => b.totalStreak - a.totalStreak).slice(0, 5);
    
    const averageStreak = mockUsers.reduce((sum, user) => sum + user.totalStreak, 0) / mockUsers.length;

    const recentActivity: CommunityActivity[] = [
      {
        id: 'activity_1',
        userId: 'user_1',
        username: 'StreakMaster',
        type: 'achievement_unlocked',
        data: {
          achievementId: 'hundred_club',
          achievementTitle: 'Hundred Club',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: 'activity_2',
        userId: 'user_2',
        username: 'ConsistencyQueen',
        type: 'streak_milestone',
        data: {
          streakDays: 40,
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      },
      {
        id: 'activity_3',
        userId: 'user_3',
        username: 'RoutineRocker',
        type: 'routine_completed',
        data: {
          routineName: 'Morning Workout',
        },
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      },
    ];

    return {
      totalUsers: 1247, // Mock total
      averageStreak: Math.round(averageStreak),
      topPerformers,
      recentActivity,
    };
  }

  /**
   * Compare current user with community
   */
  static async getUserComparison(): Promise<UserComparison[]> {
    const currentUser = await this.getUserProfile();
    const communityStats = await this.getMockCommunityStats();
    
    if (!currentUser) return [];

    return communityStats.topPerformers
      .filter(user => user.id !== currentUser.id)
      .map((user, index) => ({
        user,
        comparison: {
          streakDifference: currentUser.totalStreak - user.totalStreak,
          achievementDifference: currentUser.achievementsUnlocked - user.achievementsUnlocked,
          completionDifference: currentUser.totalCompletions - user.totalCompletions,
          rank: index + 1,
        },
      }));
  }

  /**
   * Get user's rank in community
   */
  static async getUserRank(): Promise<number> {
    const currentUser = await this.getUserProfile();
    const communityStats = await this.getMockCommunityStats();
    
    if (!currentUser) return 0;

    const sortedUsers = communityStats.topPerformers.sort((a, b) => b.totalStreak - a.totalStreak);
    const userIndex = sortedUsers.findIndex(user => user.id === currentUser.id);
    
    return userIndex >= 0 ? userIndex + 1 : sortedUsers.length + 1;
  }

  /**
   * Share achievement with community
   */
  static async shareAchievementToCommunity(achievement: Achievement): Promise<void> {
    const currentUser = await this.getUserProfile();
    if (!currentUser || !currentUser.publicProfile) return;

    const activity: CommunityActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      username: currentUser.username,
      type: 'achievement_unlocked',
      data: {
        achievementId: achievement.id,
        achievementTitle: achievement.title,
      },
      timestamp: new Date().toISOString(),
    };

    // In a real app, this would send to a server
    console.log('Shared achievement to community:', activity);
  }

  /**
   * Get leaderboard for specific category
   */
  static async getLeaderboard(category: 'streak' | 'achievements' | 'completions' = 'streak'): Promise<CommunityUser[]> {
    const communityStats = await this.getMockCommunityStats();
    
    return communityStats.topPerformers.sort((a, b) => {
      switch (category) {
        case 'achievements':
          return b.achievementsUnlocked - a.achievementsUnlocked;
        case 'completions':
          return b.totalCompletions - a.totalCompletions;
        default:
          return b.totalStreak - a.totalStreak;
      }
    });
  }

  /**
   * Toggle user's public profile status
   */
  static async togglePublicProfile(): Promise<boolean> {
    const profile = await this.getUserProfile();
    if (!profile) return false;

    const updatedProfile = {
      ...profile,
      publicProfile: !profile.publicProfile,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    return updatedProfile.publicProfile;
  }

  /**
   * Get motivational community message
   */
  static async getCommunityMotivation(): Promise<string> {
    const currentUser = await this.getUserProfile();
    const rank = await this.getUserRank();
    const communityStats = await this.getMockCommunityStats();
    
    if (!currentUser) {
      return "Join the community to see how you compare with others! 🌟";
    }

    const messages = [
      `You're ranked #${rank} in the community! 🏆`,
      `${communityStats.totalUsers} people are building habits together! 👥`,
      `Your ${currentUser.totalStreak}-day streak is inspiring others! 🔥`,
      `${currentUser.achievementsUnlocked} achievements unlocked - keep going! 🎯`,
    ];

    if (rank <= 3) {
      messages.unshift(`Amazing! You're in the top 3! 🥇🥈🥉`);
    } else if (rank <= 10) {
      messages.unshift(`Great job! You're in the top 10! 🌟`);
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }
}