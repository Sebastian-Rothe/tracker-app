/**
 * Frequency Selector Component
 * 
 * Allows users to configure routine frequency:
 * - Daily (every day)
 * - Interval (every X days)
 * - Weekly (specific weekdays)
 * - Monthly (specific days of month)
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FrequencyConfig, FrequencyType } from '@/types/routine';
import { useTheme } from '@/contexts/ThemeContext';
import { getFrequencyDescription } from '@/utils/routineFrequencyHelper';

interface FrequencySelectorProps {
  frequency: FrequencyConfig;
  onChange: (frequency: FrequencyConfig) => void;
}

export default function FrequencySelector({ frequency, onChange }: FrequencySelectorProps) {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<FrequencyType>(frequency.type);

  // Theme colors from the Theme constants
  const primaryColor = theme.Colors.primary[500];
  const surfaceColor = theme.Colors.surface.card;
  const textColor = theme.Colors.text.primary;
  const textSecondary = theme.Colors.text.secondary;
  const borderColor = theme.Colors.surface.border;

  console.log('🔧 FrequencySelector rendered with frequency:', frequency);

  const handleTypeChange = (type: FrequencyType) => {
    setSelectedType(type);
    
    // Set default values for each type
    switch (type) {
      case 'daily':
        onChange({ type: 'daily' });
        break;
      case 'interval':
        onChange({ type: 'interval', intervalDays: 2 });
        break;
      case 'weekly':
        onChange({ type: 'weekly', weekdays: [1] }); // Default: Monday
        break;
      case 'monthly':
        onChange({ type: 'monthly', monthDays: [1] }); // Default: 1st of month
        break;
    }
  };

  const handleIntervalChange = (days: number) => {
    onChange({ type: 'interval', intervalDays: days });
  };

  const handleWeekdayToggle = (day: number) => {
    const currentWeekdays = frequency.weekdays || [];
    const newWeekdays = currentWeekdays.includes(day)
      ? currentWeekdays.filter(d => d !== day)
      : [...currentWeekdays, day].sort((a, b) => a - b);
    
    // Ensure at least one day is selected
    if (newWeekdays.length > 0) {
      onChange({ type: 'weekly', weekdays: newWeekdays });
    }
  };

  const handleMonthDayToggle = (day: number) => {
    const currentMonthDays = frequency.monthDays || [];
    const newMonthDays = currentMonthDays.includes(day)
      ? currentMonthDays.filter(d => d !== day)
      : [...currentMonthDays, day].sort((a, b) => a - b);
    
    // Ensure at least one day is selected
    if (newMonthDays.length > 0) {
      onChange({ type: 'monthly', monthDays: newMonthDays });
    }
  };

  const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const intervalOptions = [1, 2, 3, 4, 5, 7, 14];

  return (
    <View style={styles.container}>
      {/* Frequency Type Selection */}
      <Text style={[styles.label, { color: textColor }]}>Häufigkeit</Text>
      
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            { 
              backgroundColor: selectedType === 'daily' ? primaryColor : surfaceColor,
              borderColor: borderColor
            }
          ]}
          onPress={() => handleTypeChange('daily')}
        >
          <Text style={[
            styles.typeButtonText,
            { color: selectedType === 'daily' ? '#FFFFFF' : textColor }
          ]}>
            Täglich
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            { 
              backgroundColor: selectedType === 'interval' ? primaryColor : surfaceColor,
              borderColor: borderColor
            }
          ]}
          onPress={() => handleTypeChange('interval')}
        >
          <Text style={[
            styles.typeButtonText,
            { color: selectedType === 'interval' ? '#FFFFFF' : textColor }
          ]}>
            Intervall
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            { 
              backgroundColor: selectedType === 'weekly' ? primaryColor : surfaceColor,
              borderColor: borderColor
            }
          ]}
          onPress={() => handleTypeChange('weekly')}
        >
          <Text style={[
            styles.typeButtonText,
            { color: selectedType === 'weekly' ? '#FFFFFF' : textColor }
          ]}>
            Wöchentlich
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            { 
              backgroundColor: selectedType === 'monthly' ? primaryColor : surfaceColor,
              borderColor: borderColor
            }
          ]}
          onPress={() => handleTypeChange('monthly')}
        >
          <Text style={[
            styles.typeButtonText,
            { color: selectedType === 'monthly' ? '#FFFFFF' : textColor }
          ]}>
            Monatlich
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interval Options */}
      {selectedType === 'interval' && (
        <View style={styles.optionsContainer}>
          <Text style={[styles.subLabel, { color: textSecondary }]}>
            Alle wie viele Tage?
          </Text>
          <View style={styles.intervalButtons}>
            {intervalOptions.map(days => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: frequency.intervalDays === days ? primaryColor : surfaceColor,
                    borderColor: borderColor
                  }
                ]}
                onPress={() => handleIntervalChange(days)}
              >
                <Text style={[
                  styles.optionButtonText,
                  { color: frequency.intervalDays === days ? '#FFFFFF' : textColor }
                ]}>
                  {days === 1 ? 'Täglich' : `${days} Tage`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Weekly Options */}
      {selectedType === 'weekly' && (
        <View style={styles.optionsContainer}>
          <Text style={[styles.subLabel, { color: textSecondary }]}>
            Wochentage auswählen
          </Text>
          <View style={styles.weekdayButtons}>
            {weekdayNames.map((name, index) => {
              const isSelected = frequency.weekdays?.includes(index) || false;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekdayButton,
                    {
                      backgroundColor: isSelected ? primaryColor : surfaceColor,
                      borderColor: borderColor
                    }
                  ]}
                  onPress={() => handleWeekdayToggle(index)}
                >
                  <Text style={[
                    styles.weekdayButtonText,
                    { color: isSelected ? '#FFFFFF' : textColor }
                  ]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Monthly Options */}
      {selectedType === 'monthly' && (
        <View style={styles.optionsContainer}>
          <Text style={[styles.subLabel, { color: textSecondary }]}>
            Tage des Monats auswählen
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.monthDayButtons}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const isSelected = frequency.monthDays?.includes(day) || false;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthDayButton,
                      {
                        backgroundColor: isSelected ? primaryColor : surfaceColor,
                        borderColor: borderColor
                      }
                    ]}
                    onPress={() => handleMonthDayToggle(day)}
                  >
                    <Text style={[
                      styles.monthDayButtonText,
                      { color: isSelected ? '#FFFFFF' : textColor }
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Frequency Description */}
      <View style={[styles.descriptionContainer, { backgroundColor: surfaceColor, borderColor: borderColor }]}>
        <Text style={[styles.descriptionLabel, { color: textSecondary }]}>
          Auswahl:
        </Text>
        <Text style={[styles.descriptionText, { color: textColor }]}>
          {getFrequencyDescription(frequency)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  weekdayButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthDayButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  monthDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
