import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { DayData, getDailyData } from '@/utils/historyManager';
import { Routine } from '@/types/routine';
import { Card } from '@/components/ui';

interface CalendarGridProps {
  onDayPress?: (dayData: DayData) => void;
  activeRoutines: Routine[];
  onMonthChange?: (month: string) => void;
}

interface CalendarDayProps {
  dayData: DayData;
  onPress?: (dayData: DayData) => void;
  isToday: boolean;
  isCurrentMonth: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  dayData, 
  onPress, 
  isToday, 
  isCurrentMonth 
}) => {
  const { theme } = useTheme();
  const day = new Date(dayData.date).getDate();
  
  const getBackgroundColor = () => {
    if (!isCurrentMonth) return theme.Colors.surface.overlay;
    if (isToday) return theme.Colors.primary[500];
    
    // Clear completion status differentiation
    if (dayData.completionRate === 1) return theme.Colors.success[500]; // 100% - Green
    if (dayData.completionRate >= 0.7) return theme.Colors.warning[500]; // 70%+ - Orange  
    if (dayData.completionRate >= 0.3) return theme.Colors.warning[300]; // 30%+ - Light Orange
    if (dayData.completionRate > 0) return theme.Colors.warning[200]; // >0% - Very Light Orange
    
    return theme.Colors.surface.card; // None completed - Default
  };
  
  const getTextColor = () => {
    if (!isCurrentMonth) return theme.Colors.text.tertiary;
    if (isToday || dayData.completionRate === 1) return '#ffffff';
    return theme.Colors.text.primary;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.dayContainer,
        { backgroundColor: getBackgroundColor() }
      ]}
      onPress={() => onPress?.(dayData)}
      disabled={!isCurrentMonth}
    >
      <Text style={[styles.dayNumber, { color: getTextColor() }]}>
        {day}
      </Text>
      {dayData.completedRoutines > 0 && (
        <View style={styles.completionDot}>
          <Text style={styles.completionText}>
            {dayData.completedRoutines}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  onDayPress,
  activeRoutines,
  onMonthChange
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const dayWidth = (screenWidth - (Theme.Spacing.lg * 2) - (6 * 4)) / 7;
  
  // Calendar manages its own month state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load data when month or routines change
  useEffect(() => {
    if (activeRoutines && activeRoutines.length >= 0) {
      loadMonthData();
    }
  }, [currentMonth, activeRoutines]);
  
  const loadMonthData = async () => {
    if (!activeRoutines || !Array.isArray(activeRoutines)) {
      console.log('CalendarGrid: activeRoutines not ready');
      return;
    }
    
    setIsLoading(true);
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const startDate = `${currentMonth}-01`;
      const endDate = `${currentMonth}-${new Date(year, month, 0).getDate()}`;
      
      const dailyData = await getDailyData(startDate, endDate, activeRoutines);
      setMonthData(dailyData || []);
      
      // Notify parent of month change
      onMonthChange?.(currentMonth);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setMonthData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;
    
    if (direction === 'prev') {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }
    
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };
  
  const formatMonthTitle = (monthStr: string) => {
    const [year, monthNum] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const today = new Date().toISOString().slice(0, 10);
  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
  
  // Generate calendar grid (6 weeks)
  const firstDayOfMonth = new Date(currentYear, currentMonthNum - 1, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonthNum, 0);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  
  // Generate days including previous/next month for full grid
  const calendarDays: DayData[] = [];
  
  // Previous month days
  const prevMonth = new Date(currentYear, currentMonthNum - 2, 0);
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const day = prevMonth.getDate() - i;
    const date = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      date,
      completedRoutines: 0,
      totalRoutines: 0,
      completionRate: 0,
      entries: [],
    });
  }
  
  // Current month days
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingData = monthData.find(d => d.date === date);
    calendarDays.push(existingData || {
      date,
      completedRoutines: 0,
      totalRoutines: 0,
      completionRate: 0,
      entries: [],
    });
  }
  
  // Next month days to fill grid (42 days = 6 weeks)
  const remainingDays = 42 - calendarDays.length;
  const nextMonth = new Date(currentYear, currentMonthNum, 1);
  for (let day = 1; day <= remainingDays; day++) {
    const date = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      date,
      completedRoutines: 0,
      totalRoutines: 0,
      completionRate: 0,
      entries: [],
    });
  }
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <Card style={styles.container} shadow="sm">
      {/* Month Navigation Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateMonth('prev')}
          disabled={isLoading}
        >
          <Text style={[styles.navButtonText, { color: theme.Colors.text.primary }]}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.monthTitleContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.Colors.primary[500]} />
          ) : (
            <Text style={[styles.monthTitle, { color: theme.Colors.text.primary }]}>
              {formatMonthTitle(currentMonth)}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigateMonth('next')}
          disabled={isLoading}
        >
          <Text style={[styles.navButtonText, { color: theme.Colors.text.primary }]}>›</Text>
        </TouchableOpacity>
      </View>
      
      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {weekdays.map((weekday) => (
          <View key={weekday} style={[styles.weekdayContainer, { width: dayWidth }]}>
            <Text style={[styles.weekdayText, { color: theme.Colors.text.secondary }]}>{weekday}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 6 }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const dayData = calendarDays[weekIndex * 7 + dayIndex];
              const isCurrentMonth = dayData.date.startsWith(currentMonth);
              const isToday = dayData.date === today;
              
              return (
                <View key={dayIndex} style={{ width: dayWidth }}>
                  <CalendarDay
                    dayData={dayData}
                    onPress={onDayPress}
                    isToday={isToday}
                    isCurrentMonth={isCurrentMonth}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Theme.Spacing.lg,
    padding: Theme.Spacing.md,
    marginBottom: Theme.Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.Spacing.md,
    paddingHorizontal: Theme.Spacing.sm,
  },
  navButton: {
    padding: Theme.Spacing.sm,
    paddingHorizontal: Theme.Spacing.md,
  },
  navButtonText: {
    fontSize: 32,
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    minHeight: 30,
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: Theme.Typography.fontSize.lg,
    fontWeight: Theme.Typography.fontWeight.bold,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.Spacing.sm,
  },
  weekdayContainer: {
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.semibold,
  },
  calendarGrid: {
    marginBottom: Theme.Spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayContainer: {
    aspectRatio: 1,
    borderRadius: Theme.BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 40,
  },
  dayNumber: {
    fontSize: Theme.Typography.fontSize.sm,
    fontWeight: Theme.Typography.fontWeight.medium,
  },
  completionDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Theme.Colors.primary[600],
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Theme.Spacing.sm,
    borderTopWidth: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: Theme.Typography.fontSize.xs,
  },
});