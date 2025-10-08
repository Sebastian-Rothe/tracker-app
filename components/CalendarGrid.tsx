import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { DayData } from '@/utils/historyManager';

interface CalendarGridProps {
  monthData: DayData[];
  onDayPress?: (dayData: DayData) => void;
  currentMonth: string; // YYYY-MM format
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
  monthData, 
  onDayPress, 
  currentMonth 
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const dayWidth = (screenWidth - (Theme.Spacing.lg * 2) - (6 * 4)) / 7; // 7 days, 6 gaps
  
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
    <View style={[styles.container, { backgroundColor: theme.Colors.surface.card }]}>
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
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.BorderRadius.lg,
    padding: Theme.Spacing.md,
    marginBottom: Theme.Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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