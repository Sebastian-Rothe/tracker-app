import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Achievement, updateAchievements, getRecentlyUnlocked } from '@/utils/achievementManager';
import AchievementNotification from '@/components/AchievementNotification';

interface AchievementContextType {
  achievements: Achievement[];
  showAchievementNotification: (achievement: Achievement) => void;
  checkAndUpdateAchievements: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notificationAchievement, setNotificationAchievement] = useState<Achievement | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    refreshAchievements();
  }, []);

  const refreshAchievements = async () => {
    try {
      const updatedAchievements = await updateAchievements();
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    }
  };

  const checkAndUpdateAchievements = async () => {
    try {
      const updatedAchievements = await updateAchievements();
      
      // Check for newly unlocked achievements
      if (lastChecked) {
        const recentlyUnlocked = await getRecentlyUnlocked();
        const newUnlocks = recentlyUnlocked.filter(achievement => 
          achievement.unlockedAt && new Date(achievement.unlockedAt) > new Date(lastChecked)
        );
        
        // Show notification for the first new unlock
        if (newUnlocks.length > 0) {
          showAchievementNotification(newUnlocks[0]);
        }
      }
      
      setAchievements(updatedAchievements);
      setLastChecked(new Date().toISOString());
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const showAchievementNotification = (achievement: Achievement) => {
    setNotificationAchievement(achievement);
    setNotificationVisible(true);
  };

  const hideNotification = () => {
    setNotificationVisible(false);
    setTimeout(() => {
      setNotificationAchievement(null);
    }, 300);
  };

  const contextValue: AchievementContextType = {
    achievements,
    showAchievementNotification,
    checkAndUpdateAchievements,
    refreshAchievements,
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      <AchievementNotification
        achievement={notificationAchievement}
        visible={notificationVisible}
        onHide={hideNotification}
        duration={4000}
      />
    </AchievementContext.Provider>
  );
};

export const useAchievements = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

export default AchievementProvider;