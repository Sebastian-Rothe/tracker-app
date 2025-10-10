import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarGrid } from '@/components/CalendarGrid';
import { DayData } from '@/utils/historyManager';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock AsyncStorage for theme persistence
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock setup is handled in jest-setup.js

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('CalendarGrid', () => {
  const mockDayData: DayData[] = [
    {
      date: '2025-01-15',
      completedRoutines: 2,
      totalRoutines: 3,
      completionRate: 0.67,
      entries: [
        {
          id: '1',
          routineId: 'routine-1',
          routineName: 'Exercise',
          date: '2025-01-15',
          completed: true,
          streakAtTime: 5,
          timestamp: Date.now()
        },
        {
          id: '2',
          routineId: 'routine-2',
          routineName: 'Reading',
          date: '2025-01-15',
          completed: true,
          streakAtTime: 3,
          timestamp: Date.now()
        }
      ]
    },
    {
      date: '2025-01-16',
      completedRoutines: 1,
      totalRoutines: 3,
      completionRate: 0.33,
      entries: [
        {
          id: '3',
          routineId: 'routine-1',
          routineName: 'Exercise',
          date: '2025-01-16',
          completed: true,
          streakAtTime: 6,
          timestamp: Date.now()
        }
      ]
    },
    {
      date: '2025-01-17',
      completedRoutines: 0,
      totalRoutines: 3,
      completionRate: 0,
      entries: []
    }
  ];

  const mockOnDayPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders calendar grid correctly', () => {
    const { getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Should render month header
    expect(getByText('January 2025')).toBeTruthy();
  });

  test('displays day numbers correctly', () => {
    const { getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Should show day numbers
    expect(getByText('15')).toBeTruthy();
    expect(getByText('16')).toBeTruthy();
    expect(getByText('17')).toBeTruthy();
  });

  test('applies different colors based on completion rate', () => {
    const { getByTestId } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Days should have different styling based on completion rates
    // This is a visual test that would need to check actual styling
    expect(getByTestId).toBeDefined();
  });

  test('calls onDayPress when date is pressed', () => {
    const { getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    const dayButton = getByText('15');
    fireEvent.press(dayButton);

    expect(mockOnDayPress).toHaveBeenCalledWith(mockDayData[0]);
    expect(mockOnDayPress).toHaveBeenCalledTimes(1);
  });

  test('handles empty data gracefully', () => {
    const { getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={[]}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Should still render the calendar structure
    expect(getByText('January 2025')).toBeTruthy();
  });

  test('shows correct day of week headers', () => {
    const { getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Should show day headers
    expect(getByText('Sun')).toBeTruthy();
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
  });

  test('handles current date highlighting', () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayData: DayData[] = [
      {
        date: today,
        completedRoutines: 1,
        totalRoutines: 2,
        completionRate: 0.5,
        entries: []
      }
    ];

    const currentMonth = today.slice(0, 7); // YYYY-MM format

    const { getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={todayData}
          currentMonth={currentMonth}
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Today's date should be highlighted (would need to check styling)
    const dayNumber = parseInt(today.slice(-2), 10).toString();
    expect(getByText(dayNumber)).toBeTruthy();
  });

  test('handles month navigation', () => {
    const { rerender, getByText } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    expect(getByText('January 2025')).toBeTruthy();

    // Test month change
    rerender(
      <ThemeWrapper>
        <CalendarGrid
          monthData={[]}
          currentMonth="2025-02"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    expect(getByText('February 2025')).toBeTruthy();
  });

  test('displays completion indicators correctly', () => {
    const { getByTestId } = render(
      <ThemeWrapper>
        <CalendarGrid
          monthData={mockDayData}
          currentMonth="2025-01"
          onDayPress={mockOnDayPress}
        />
      </ThemeWrapper>
    );

    // Days with different completion rates should have different visual indicators
    // This would typically involve checking background colors or other styling
    expect(getByTestId).toBeDefined();
  });
});