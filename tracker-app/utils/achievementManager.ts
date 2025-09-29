import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadRoutines, loadRoutineState } from './settingsStorage';
import { getMonthlyStats, loadHistory } from './historyManager';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'consistency' | 'milestone' | 'special';
  requirement: {
    type: 'streak_days' | 'total_completions' | 'perfect_days' | 'active_routines' | 'consecutive_weeks';
    value: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  unlockedAt?: string; // ISO timestamp
  isUnlocked: boolean;
  progress: number; // 0-1
  reward?: {
    type: 'badge' | 'title' | 'theme';
    value: string;
  };
}

export interface UserProgress {
  totalCompletions: number;
  longestStreak: number;
  currentStreak: number;
  perfectDays: number; // Days with 100% completion rate
  activeRoutines: number;
  consecutiveWeeks: number;
  totalActiveHours: number;
  consistency: number; // 0-1
}

const STORAGE_KEYS = {
  ACHIEVEMENTS: 'achievements',
  USER_PROGRESS: 'user_progress',
} as const;

// Define all available achievements
export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Streak Achievements
  {
    id: 'first_step',
    title: 'First Steps',
    description: 'Complete your first routine',
    icon: '🚀',
    category: 'milestone',
    requirement: {
      type: 'total_completions',
      value: 1,
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚔️',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 7,
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'consistency_champion',
    title: 'Consistency Champion',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 30,
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'legendary_streak',
    title: 'Legendary Streak',
    description: 'Achieve a 100-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: {
      type: 'streak_days',
      value: 100,
    },
    isUnlocked: false,
    progress: 0,
  },
  
  // Consistency Achievements
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete all routines for 7 consecutive days',
    icon: '⭐',
    category: 'consistency',
    requirement: {
      type: 'perfect_days',
      value: 7,
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'perfect_month',
    title: 'Perfect Month',
    description: 'Complete all routines for 30 consecutive days',
    icon: '🌟',
    category: 'consistency',
    requirement: {
      type: 'perfect_days',
      value: 30,
    },
    isUnlocked: false,
    progress: 0,
  },
  
  // Milestone Achievements
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Complete 100 total routines',
    icon: '💯',
    category: 'milestone',
    requirement: {
      type: 'total_completions',
      value: 100,
    },
    isUnlocked: false,
    progress: 0,
  },
  {
    id: 'routine_master',
    title: 'Routine Master',
    description: 'Manage 5 active routines simultaneously',
    icon: '🎯',
    category: 'milestone',
    requirement: {
      type: 'active_routines',
      value: 5,
    },
    isUnlocked: false,
    progress: 0,
  },
  
  // Special Achievements
  // {
  //   id: 'early_bird',
  //   title: 'Early Bird',
  //   description: 'Complete routines before 8 AM for 7 days',
  //   icon: '🌅',
  //   category: 'special',
  //   requirement: {
  //     type: 'streak_days', // Would need special time-based logic
  //     value: 7,
  //     timeframe: 'daily',
  //   },
  //   isUnlocked: false,
  //   progress: 0,
  // },
  // {
  //   id: 'weekend_warrior',
  //   title: 'Weekend Warrior',
  //   description: 'Complete routines on 4 consecutive weekends',
  //   icon: '🏋️',
  //   category: 'special',
  //   requirement: {
  //     type: 'consecutive_weeks',
  //     value: 4,
  //   },
  //   isUnlocked: false,
  //   progress: 0,
  // },
];

/**
 * Load user achievements from storage
 */
export const loadAchievements = async (): Promise<Achievement[]> => {
  try {
    const achievementsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (achievementsJson) {
      const saved = JSON.parse(achievementsJson) as Achievement[];
      
      // Merge with definitions to ensure we have all achievements
      const merged = ACHIEVEMENT_DEFINITIONS.map(def => {
        const saved_achievement = saved.find(s => s.id === def.id);
        return saved_achievement || def;
      });
      
      return merged;
    }
    
    return [...ACHIEVEMENT_DEFINITIONS];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [...ACHIEVEMENT_DEFINITIONS];
  }
};

/**
 * Save achievements to storage
 */
export const saveAchievements = async (achievements: Achievement[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

/**
 * Calculate current user progress
 */
export const calculateUserProgress = async (): Promise<UserProgress> => {
  try {
    const [routines, routineState, monthlyStats, history] = await Promise.all([
      loadRoutines(),
      loadRoutineState(),
      getMonthlyStats(),
      loadHistory(),
    ]);
    
    const activeRoutines = routines.filter(r => r.isActive);
    const totalCompletions = history.filter(h => h.completed).length;
    
    // Calculate longest streak from all routines
    const longestStreak = Math.max(...activeRoutines.map(r => r.streak), 0);
    
    // Calculate current streak (longest current streak among active routines)
    const currentStreak = Math.max(...activeRoutines.map(r => r.streak), 0);
    
    // Calculate perfect days (days where all active routines were completed)
    const perfectDays = calculatePerfectDays(history, activeRoutines);
    
    // Calculate consecutive weeks
    const consecutiveWeeks = calculateConsecutiveWeeks(history);
    
    // Calculate consistency from monthly stats
    const latestStats = monthlyStats.length > 0 ? monthlyStats[0] : null;
    const consistency = latestStats?.averageCompletionRate || 0;
    
    return {
      totalCompletions,
      longestStreak,
      currentStreak,
      perfectDays,
      activeRoutines: activeRoutines.length,
      consecutiveWeeks,
      totalActiveHours: totalCompletions * 0.5, // Assume 30min per routine
      consistency,
    };
  } catch (error) {
    console.error('Error calculating user progress:', error);
    return {
      totalCompletions: 0,
      longestStreak: 0,
      currentStreak: 0,
      perfectDays: 0,
      activeRoutines: 0,
      consecutiveWeeks: 0,
      totalActiveHours: 0,
      consistency: 0,
    };
  }
};

/**
 * Calculate perfect days (days where all routines were completed)
 */
const calculatePerfectDays = (history: any[], activeRoutines: any[]): number => {
  if (activeRoutines.length === 0) return 0;
  
  // Group history by date
  const byDate = new Map<string, any[]>();
  history.forEach(entry => {
    if (!byDate.has(entry.date)) {
      byDate.set(entry.date, []);
    }
    byDate.get(entry.date)!.push(entry);
  });
  
  let perfectDays = 0;
  
  byDate.forEach((dayEntries, date) => {
    const completedRoutines = dayEntries.filter(e => e.completed).length;
    const totalRoutines = activeRoutines.length;
    
    if (completedRoutines === totalRoutines && totalRoutines > 0) {
      perfectDays++;
    }
  });
  
  return perfectDays;
};

/**
 * Calculate consecutive weeks with activity
 */
const calculateConsecutiveWeeks = (history: any[]): number => {
  // This is a simplified calculation - in production, you'd want more sophisticated logic
  const uniqueWeeks = new Set();
  
  history.forEach(entry => {
    if (entry.completed) {
      const date = new Date(entry.date);
      const year = date.getFullYear();
      const week = Math.ceil(date.getDate() / 7);
      const month = date.getMonth();
      uniqueWeeks.add(`${year}-${month}-${week}`);
    }
  });
  
  return Math.min(uniqueWeeks.size, 52); // Cap at 52 weeks
};

/**
 * Update achievement progress and unlock new achievements
 */
export const updateAchievements = async (): Promise<Achievement[]> => {
  try {
    const [currentAchievements, userProgress] = await Promise.all([
      loadAchievements(),
      calculateUserProgress(),
    ]);
    
    const updatedAchievements = currentAchievements.map(achievement => {
      const updated = { ...achievement };
      
      // Calculate progress based on requirement type
      let currentValue = 0;
      let targetValue = achievement.requirement.value;
      
      switch (achievement.requirement.type) {
        case 'streak_days':
          currentValue = userProgress.currentStreak;
          break;
        case 'total_completions':
          currentValue = userProgress.totalCompletions;
          break;
        case 'perfect_days':
          currentValue = userProgress.perfectDays;
          break;
        case 'active_routines':
          currentValue = userProgress.activeRoutines;
          break;
        case 'consecutive_weeks':
          currentValue = userProgress.consecutiveWeeks;
          break;
      }
      
      // Update progress
      updated.progress = Math.min(currentValue / targetValue, 1);
      
      // Check if achievement should be unlocked
      if (!updated.isUnlocked && currentValue >= targetValue) {
        updated.isUnlocked = true;
        updated.unlockedAt = new Date().toISOString();
      }
      
      return updated;
    });
    
    // Save updated achievements
    await saveAchievements(updatedAchievements);
    
    return updatedAchievements;
  } catch (error) {
    console.error('Error updating achievements:', error);
    return await loadAchievements(); // Return current state on error
  }
};

/**
 * Get recently unlocked achievements (last 7 days)
 */
export const getRecentlyUnlocked = async (): Promise<Achievement[]> => {
  try {
    const achievements = await loadAchievements();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return achievements.filter(a => 
      a.isUnlocked && 
      a.unlockedAt && 
      new Date(a.unlockedAt) > sevenDaysAgo
    );
  } catch (error) {
    console.error('Error getting recently unlocked achievements:', error);
    return [];
  }
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = async (category: Achievement['category']): Promise<Achievement[]> => {
  try {
    const achievements = await loadAchievements();
    return achievements.filter(a => a.category === category);
  } catch (error) {
    console.error('Error getting achievements by category:', error);
    return [];
  }
};

/**
 * Get achievement statistics
 */
export const getAchievementStats = async (): Promise<{
  total: number;
  unlocked: number;
  progress: number;
  categories: Record<string, { total: number; unlocked: number }>;
}> => {
  try {
    const achievements = await loadAchievements();
    const unlocked = achievements.filter(a => a.isUnlocked);
    
    // Calculate by category
    const categories: Record<string, { total: number; unlocked: number }> = {};
    achievements.forEach(a => {
      if (!categories[a.category]) {
        categories[a.category] = { total: 0, unlocked: 0 };
      }
      categories[a.category].total++;
      if (a.isUnlocked) {
        categories[a.category].unlocked++;
      }
    });
    
    return {
      total: achievements.length,
      unlocked: unlocked.length,
      progress: unlocked.length / achievements.length,
      categories,
    };
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    return {
      total: 0,
      unlocked: 0,
      progress: 0,
      categories: {},
    };
  }
};