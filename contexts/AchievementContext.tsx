import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [notificationQueue, setNotificationQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    refreshAchievements();
    // Load last checked timestamp from storage
    loadLastChecked();
  }, []);

  const loadLastChecked = async () => {
    try {
      const lastCheckedStr = await AsyncStorage.getItem('achievement_last_checked');
      if (lastCheckedStr) {
        setLastChecked(lastCheckedStr);
      } else {
        // First time - set to a very old date so we catch all existing achievements
        const oldDate = new Date('2020-01-01').toISOString();
        setLastChecked(oldDate);
        await AsyncStorage.setItem('achievement_last_checked', oldDate);
      }
    } catch (error) {
      console.error('Error loading last checked:', error);
    }
  };

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
        
        // Add all new unlocks to the queue
        if (newUnlocks.length > 0) {
          setNotificationQueue(prev => [...prev, ...newUnlocks]);
        }
      }
      
      setAchievements(updatedAchievements);
      
      // Update last checked timestamp and save to storage
      const now = new Date().toISOString();
      setLastChecked(now);
      await AsyncStorage.setItem('achievement_last_checked', now);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  // Process notification queue - show one at a time
  useEffect(() => {
    if (notificationQueue.length > 0 && !notificationVisible) {
      const nextAchievement = notificationQueue[0];
      showAchievementNotification(nextAchievement);
      setNotificationQueue(prev => prev.slice(1)); // Remove from queue
    }
  }, [notificationQueue, notificationVisible]);

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