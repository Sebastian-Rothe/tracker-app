import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Achievement } from './achievementManager';
import { getMonthlyStats } from './historyManager';

interface ShareableAchievement {
  achievement: Achievement;
  userStats: {
    totalStreakDays: number;
    totalCompletions: number;
    monthlyCompletionRate: number;
  };
  shareText: string;
  imageData?: string;
}

interface ShareStats {
  streakDays: number;
  totalRoutines: number;
  completedToday: number;
  monthlyRate: number;
  achievementsUnlocked: number;
}

export class SocialShareManager {
  
  /**
   * Share a single achievement unlock
   */
  static async shareAchievement(achievement: Achievement, userStats?: ShareStats): Promise<void> {
    try {
      const shareText = this.generateAchievementShareText(achievement, userStats);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText, {
          mimeType: 'text/plain',
          dialogTitle: `Share ${achievement.title}`,
        });
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      throw new Error('Failed to share achievement');
    }
  }

  /**
   * Share overall progress stats
   */
  static async shareProgress(stats: ShareStats): Promise<void> {
    try {
      const shareText = this.generateProgressShareText(stats);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText, {
          mimeType: 'text/plain',
          dialogTitle: 'Share My Progress',
        });
      }
    } catch (error) {
      console.error('Error sharing progress:', error);
      throw new Error('Failed to share progress');
    }
  }

  /**
   * Generate achievement card image and share
   */
  static async shareAchievementCard(achievement: Achievement, userStats?: ShareStats): Promise<void> {
    try {
      // For now, just share text - can be extended to generate images
      const shareText = this.generateAchievementCardText(achievement, userStats);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText, {
          mimeType: 'text/plain',
          dialogTitle: `Share ${achievement.title} Achievement`,
        });
      }
    } catch (error) {
      console.error('Error sharing achievement card:', error);
      throw new Error('Failed to share achievement card');
    }
  }

  /**
   * Share weekly/monthly summary
   */
  static async shareWeeklySummary(stats: ShareStats): Promise<void> {
    try {
      const shareText = this.generateWeeklySummaryText(stats);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Weekly Summary',
        });
      }
    } catch (error) {
      console.error('Error sharing weekly summary:', error);
      throw new Error('Failed to share weekly summary');
    }
  }

  /**
   * Generate motivational share text for achievements
   */
  private static generateAchievementShareText(achievement: Achievement, userStats?: ShareStats): string {
    const baseText = `🏆 Achievement Unlocked!\n\n${achievement.icon} ${achievement.title}\n${achievement.description}`;
    
    if (!userStats) return baseText;

    const motivationalMessages = this.getMotivationalMessages(achievement.category);
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    return `${baseText}\n\n${randomMessage}\n\n📊 My Stats:\n🔥 ${userStats.streakDays} day streak\n📈 ${userStats.achievementsUnlocked} achievements unlocked\n💪 ${userStats.monthlyRate}% completion rate this month\n\n#RoutineTracker #Productivity #Goals`;
  }

  /**
   * Generate progress share text
   */
  private static generateProgressShareText(stats: ShareStats): string {
    const completionPercentage = stats.totalRoutines > 0 ? Math.round((stats.completedToday / stats.totalRoutines) * 100) : 0;
    
    return `💪 My Routine Progress Update!\n\n🔥 Streak: ${stats.streakDays} days\n📋 Today: ${stats.completedToday}/${stats.totalRoutines} completed (${completionPercentage}%)\n🏆 Achievements: ${stats.achievementsUnlocked} unlocked\n📈 Monthly Rate: ${stats.monthlyRate}%\n\nConsistency is key! 🌟\n\n#RoutineTracker #Productivity #Progress #Habits`;
  }

  /**
   * Generate achievement card text (formatted for social media)
   */
  private static generateAchievementCardText(achievement: Achievement, userStats?: ShareStats): string {
    const emoji = this.getCategoryEmoji(achievement.category);
    const categoryName = this.getCategoryDisplayName(achievement.category);
    
    let cardText = `╔═══════════════════════╗\n║  🏆 ACHIEVEMENT UNLOCKED!  ║\n╠═══════════════════════╣\n║                       ║\n║  ${achievement.icon}  ${achievement.title.toUpperCase()}  ║\n║                       ║\n║  ${achievement.description}  ║\n║                       ║`;
    
    if (userStats) {
      cardText += `\n║  📊 STATS:            ║\n║  🔥 ${userStats.streakDays} day streak      ║\n║  🏆 ${userStats.achievementsUnlocked} achievements    ║`;
    }
    
    cardText += `\n║                       ║\n╚═══════════════════════╝\n\n${emoji} ${categoryName} Achievement\n#RoutineTracker #Achievement #${categoryName}`;
    
    return cardText;
  }

  /**
   * Generate weekly summary text
   */
  private static generateWeeklySummaryText(stats: ShareStats): string {
    return `📅 My Weekly Routine Summary\n\n🔥 Current Streak: ${stats.streakDays} days\n📈 Monthly Completion: ${stats.monthlyRate}%\n🏆 Total Achievements: ${stats.achievementsUnlocked}\n💪 Active Routines: ${stats.totalRoutines}\n\nBuilding better habits one day at a time! 🌟\n\n#WeeklyReview #RoutineTracker #Habits #Progress`;
  }

  /**
   * Get motivational messages by category
   */
  private static getMotivationalMessages(category: Achievement['category']): string[] {
    const messages = {
      streak: [
        "Consistency pays off! 🔥",
        "One day at a time, one step closer to greatness! 💪",
        "Your dedication is inspiring! 🌟",
        "Keep that momentum going! 🚀"
      ],
      consistency: [
        "Steady progress is the key to success! 📈",
        "Your consistency is your superpower! ⚡",
        "Small daily improvements lead to stunning results! ✨",
        "You're building something amazing! 🏗️"
      ],
      milestone: [
        "What an incredible milestone! 🎯",
        "Your hard work is paying off! 💎",
        "This is just the beginning! 🌅",
        "You're becoming unstoppable! 🦾"
      ],
      special: [
        "Special achievements for special dedication! ⭐",
        "You're in a league of your own! 👑",
        "Exceptional commitment deserves recognition! 🏅",
        "Your journey is truly inspiring! 🌈"
      ]
    };
    
    return messages[category] || messages.milestone;
  }

  /**
   * Get category emoji
   */
  private static getCategoryEmoji(category: Achievement['category']): string {
    const emojis = {
      streak: '🔥',
      consistency: '📈', 
      milestone: '🎯',
      special: '⭐'
    };
    return emojis[category] || '🏆';
  }

  /**
   * Get category display name
   */
  private static getCategoryDisplayName(category: Achievement['category']): string {
    const names = {
      streak: 'Streak',
      consistency: 'Consistency',
      milestone: 'Milestone', 
      special: 'Special'
    };
    return names[category] || 'Achievement';
  }

  /**
   * Generate shareable URL for achievements (future feature)
   */
  static generateShareableURL(achievement: Achievement): string {
    // Future implementation: generate deep links or web URLs
    return `https://routinetracker.app/achievement/${achievement.id}`;
  }

  /**
   * Check if sharing is available on the platform
   */
  static async isSharingAvailable(): Promise<boolean> {
    try {
      return await Sharing.isAvailableAsync();
    } catch {
      return false;
    }
  }
}