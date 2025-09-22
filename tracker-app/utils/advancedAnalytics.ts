import { getMonthlyStats, loadHistory, HistoryEntry } from './historyManager';
import { loadRoutines } from './settingsStorage';
import { Routine } from '../types/routine';

export interface AnalyticsData {
  timeMetrics: {
    totalActiveDays: number;
    currentStreak: number;
    longestStreak: number;
    weeklyActivity: {
      thisWeek: number;
      lastWeek: number;
      trend: 'up' | 'down' | 'same';
    };
    monthlyActivity: {
      thisMonth: number;
      lastMonth: number;
      trend: 'up' | 'down' | 'same';
    };
    averageCompletionRate: number;
    mostActiveDay: string;
    leastActiveDay: string;
  };
  performanceMetrics: {
    overallCompletionRate: number;
    consistencyScore: number; // 0-100
    improvementTrend: 'improving' | 'declining' | 'stable';
    bestPerformanceWeek: string;
    worstPerformanceWeek: string;
    averageRoutinesPerDay: number;
    peakPerformanceHour: number;
  };
  routineInsights: {
    routineId: string;
    routineName: string;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    bestTimeOfDay: string;
    trend: 'up' | 'down' | 'stable';
    consistency: number; // 0-100
  }[];
  trends: {
    weeklyTrend: TrendPoint[];
    monthlyTrend: TrendPoint[];
    completionRateTrend: TrendPoint[];
    streakHistory: StreakEvent[];
  };
  predictions: {
    nextMilestone: {
      type: 'streak' | 'completion' | 'consistency';
      value: number;
      estimatedDays: number;
      confidence: number; // 0-100
    };
    riskAnalysis: {
      streakRisk: 'low' | 'medium' | 'high';
      consistencyRisk: 'low' | 'medium' | 'high';
      suggestions: string[];
    };
    goalRecommendations: {
      suggested: string;
      reason: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
  };
  comparisons: {
    periodComparisons: ComparisonMetric[];
    seasonalPatterns: SeasonalPattern[];
    personalBests: PersonalBest[];
  };
}

export interface TrendPoint {
  date: string;
  value: number;
  change?: number;
}

export interface StreakEvent {
  startDate: string;
  endDate: string;
  length: number;
  routineIds: string[];
}

export interface ComparisonMetric {
  metric: string;
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changeType: 'improvement' | 'decline' | 'stable';
}

export interface SeasonalPattern {
  season: string;
  averageCompletionRate: number;
  bestMonth: string;
  worstMonth: string;
}

export interface PersonalBest {
  category: string;
  value: number;
  date: string;
  description: string;
}

export class AdvancedAnalytics {
  /**
   * Generiert umfassende Analytics-Daten
   */
  static async generateAnalytics(): Promise<AnalyticsData> {
    try {
      const [history, routines] = await Promise.all([
        loadHistory(),
        loadRoutines()
      ]);

      const timeMetrics = this.calculateTimeMetrics(history);
      const performanceMetrics = this.calculatePerformanceMetrics(history);
      const routineInsights = this.calculateRoutineInsights(history, routines);
      const trends = this.calculateTrends(history);
      const predictions = this.calculatePredictions(history, routines);
      const comparisons = this.calculateComparisons(history);

      return {
        timeMetrics,
        performanceMetrics,
        routineInsights,
        trends,
        predictions,
        comparisons
      };
    } catch (error) {
      console.error('Fehler beim Generieren der Analytics:', error);
      throw error;
    }
  }

  /**
   * Berechnet Zeit-basierte Metriken
   */
  private static calculateTimeMetrics(history: HistoryEntry[]): AnalyticsData['timeMetrics'] {
    if (history.length === 0) {
      return {
        totalActiveDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyActivity: { thisWeek: 0, lastWeek: 0, trend: 'same' },
        monthlyActivity: { thisMonth: 0, lastMonth: 0, trend: 'same' },
        averageCompletionRate: 0,
        mostActiveDay: 'Monday',
        leastActiveDay: 'Sunday'
      };
    }

    const now = new Date();
    
    // Gruppiere Einträge nach Datum
    const dateGroups = new Map<string, HistoryEntry[]>();
    history.forEach(entry => {
      if (!dateGroups.has(entry.date)) {
        dateGroups.set(entry.date, []);
      }
      dateGroups.get(entry.date)!.push(entry);
    });

    // Berechne tägliche Completion Rates
    const dailyStats = Array.from(dateGroups.entries()).map(([date, entries]) => {
      const completed = entries.filter(e => e.completed).length;
      const total = entries.length;
      return {
        date,
        completed,
        total,
        completionRate: total > 0 ? completed / total : 0,
        hasActivity: completed > 0
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Aktive Tage (mindestens eine Routine abgeschlossen)
    const activeDays = dailyStats.filter(day => day.hasActivity);
    const totalActiveDays = activeDays.length;

    // Streaks berechnen
    const { currentStreak, longestStreak } = this.calculateStreaks(dailyStats);

    // Wöchentliche Aktivität
    const weeklyActivity = this.calculateWeeklyActivity(dailyStats, now);
    
    // Monatliche Aktivität
    const monthlyActivity = this.calculateMonthlyActivity(dailyStats, now);

    // Durchschnittliche Completion Rate
    const totalCompletions = dailyStats.reduce((sum, day) => sum + day.completed, 0);
    const totalRoutines = dailyStats.reduce((sum, day) => sum + day.total, 0);
    const averageCompletionRate = totalRoutines > 0 ? totalCompletions / totalRoutines : 0;

    // Aktivste/schwächste Wochentage
    const dayOfWeekStats = this.calculateDayOfWeekStats(dailyStats);
    const mostActiveDay = dayOfWeekStats.length > 0 ? 
      dayOfWeekStats.reduce((a, b) => a.completionRate > b.completionRate ? a : b).day : 'Monday';
    const leastActiveDay = dayOfWeekStats.length > 0 ? 
      dayOfWeekStats.reduce((a, b) => a.completionRate < b.completionRate ? a : b).day : 'Sunday';

    return {
      totalActiveDays,
      currentStreak,
      longestStreak,
      weeklyActivity,
      monthlyActivity,
      averageCompletionRate,
      mostActiveDay,
      leastActiveDay
    };
  }

  /**
   * Berechnet Performance-Metriken
   */
  private static calculatePerformanceMetrics(history: HistoryEntry[]): AnalyticsData['performanceMetrics'] {
    if (history.length === 0) {
      return {
        overallCompletionRate: 0,
        consistencyScore: 0,
        improvementTrend: 'stable',
        bestPerformanceWeek: '',
        worstPerformanceWeek: '',
        averageRoutinesPerDay: 0,
        peakPerformanceHour: 12
      };
    }

    // Gesamt-Completion Rate
    const completedCount = history.filter(h => h.completed).length;
    const overallCompletionRate = completedCount / history.length;

    // Consistency Score (basierend auf regelmäßiger Aktivität)
    const consistencyScore = this.calculateConsistencyScore(history);

    // Improvement Trend (Vergleich letzte 2 Wochen)
    const improvementTrend = this.calculateTrend(history);

    // Wöchentliche Performance
    const weeklyPerformance = this.calculateWeeklyPerformance(history);
    const bestPerformanceWeek = weeklyPerformance.best;
    const worstPerformanceWeek = weeklyPerformance.worst;

    // Durchschnittliche Routines pro Tag
    const uniqueDates = [...new Set(history.map(h => h.date))];
    const averageRoutinesPerDay = uniqueDates.length > 0 ? history.length / uniqueDates.length : 0;

    // Peak Performance Hour
    const peakPerformanceHour = this.calculatePeakHour(history);

    return {
      overallCompletionRate,
      consistencyScore,
      improvementTrend,
      bestPerformanceWeek,
      worstPerformanceWeek,
      averageRoutinesPerDay,
      peakPerformanceHour
    };
  }

  /**
   * Berechnet Routine-spezifische Insights
   */
  private static calculateRoutineInsights(
    history: HistoryEntry[], 
    routines: Routine[]
  ): AnalyticsData['routineInsights'] {
    return routines.map(routine => {
      const routineHistory = history.filter(h => h.routineId === routine.id);
      
      if (routineHistory.length === 0) {
        return {
          routineId: routine.id,
          routineName: routine.name,
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          bestTimeOfDay: 'Morning',
          trend: 'stable' as const,
          consistency: 0
        };
      }

      const completionRate = routineHistory.filter(h => h.completed).length / routineHistory.length;
      const currentStreak = this.calculateRoutineStreak(routineHistory);
      const longestStreak = this.calculateRoutineLongestStreak(routineHistory);
      const bestTimeOfDay = this.calculateBestTimeOfDay(routineHistory);
      const trend = this.calculateRoutineTrend(routineHistory);
      const consistency = this.calculateRoutineConsistency(routineHistory);

      return {
        routineId: routine.id,
        routineName: routine.name,
        completionRate,
        currentStreak,
        longestStreak,
        bestTimeOfDay,
        trend,
        consistency
      };
    });
  }

  /**
   * Berechnet Trend-Daten
   */
  private static calculateTrends(history: HistoryEntry[]): AnalyticsData['trends'] {
    const weeklyTrend = this.calculateWeeklyTrend(history);
    const monthlyTrend = this.calculateMonthlyTrend(history);
    const completionRateTrend = this.calculateCompletionRateTrend(history);
    const streakHistory = this.calculateStreakHistory(history);

    return {
      weeklyTrend,
      monthlyTrend,
      completionRateTrend,
      streakHistory
    };
  }

  /**
   * Berechnet Vorhersagen und Empfehlungen
   */
  private static calculatePredictions(
    history: HistoryEntry[], 
    routines: Routine[]
  ): AnalyticsData['predictions'] {
    // Nächster Meilenstein
    const nextMilestone = this.calculateNextMilestone(history);
    
    // Risiko-Analyse
    const riskAnalysis = this.calculateRiskAnalysis(history, routines);
    
    // Ziel-Empfehlungen
    const goalRecommendations = this.calculateGoalRecommendations(history, routines);

    return {
      nextMilestone,
      riskAnalysis,
      goalRecommendations
    };
  }

  /**
   * Berechnet Vergleichsmetriken
   */
  private static calculateComparisons(history: HistoryEntry[]): AnalyticsData['comparisons'] {
    const periodComparisons = this.compareRecentPeriods(history);
    const seasonalPatterns = this.calculateSeasonalPatterns(history);
    const personalBests = this.calculatePersonalBests(history);

    return {
      periodComparisons,
      seasonalPatterns,
      personalBests
    };
  }

  // Hilfsmethoden
  private static calculateStreaks(dailyStats: any[]): { currentStreak: number; longestStreak: number } {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Rückwärts durch die sortierten Tage gehen für current streak
    for (let i = dailyStats.length - 1; i >= 0; i--) {
      if (dailyStats[i].hasActivity) {
        tempStreak++;
      } else {
        break;
      }
    }
    currentStreak = tempStreak;

    // Längste Streak finden
    tempStreak = 0;
    for (const day of dailyStats) {
      if (day.hasActivity) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  }

  private static calculateWeeklyActivity(dailyStats: any[], now: Date) {
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

    const thisWeek = dailyStats.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= thisWeekStart && dayDate <= thisWeekEnd;
    }).filter(day => day.hasActivity).length;

    const lastWeek = dailyStats.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= lastWeekStart && dayDate < thisWeekStart;
    }).filter(day => day.hasActivity).length;

    let trend: 'up' | 'down' | 'same' = 'same';
    if (thisWeek > lastWeek) trend = 'up';
    if (thisWeek < lastWeek) trend = 'down';

    return { thisWeek, lastWeek, trend };
  }

  private static calculateMonthlyActivity(dailyStats: any[], now: Date) {
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = dailyStats.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= thisMonthStart;
    }).filter(day => day.hasActivity).length;

    const lastMonth = dailyStats.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= lastMonthStart && dayDate <= lastMonthEnd;
    }).filter(day => day.hasActivity).length;

    let trend: 'up' | 'down' | 'same' = 'same';
    if (thisMonth > lastMonth) trend = 'up';
    if (thisMonth < lastMonth) trend = 'down';

    return { thisMonth, lastMonth, trend };
  }

  private static calculateConsistencyScore(history: HistoryEntry[]): number {
    if (history.length === 0) return 0;

    const dailyGroups = new Map<string, HistoryEntry[]>();
    history.forEach(entry => {
      if (!dailyGroups.has(entry.date)) {
        dailyGroups.set(entry.date, []);
      }
      dailyGroups.get(entry.date)!.push(entry);
    });

    const dailyCompletionRates = Array.from(dailyGroups.values()).map(entries => {
      const completed = entries.filter(e => e.completed).length;
      return completed / entries.length;
    });

    if (dailyCompletionRates.length === 0) return 0;

    // Standardabweichung der täglichen Completion Rates
    const mean = dailyCompletionRates.reduce((a, b) => a + b, 0) / dailyCompletionRates.length;
    const variance = dailyCompletionRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / dailyCompletionRates.length;
    const stdDev = Math.sqrt(variance);

    // Je niedriger die Standardabweichung, desto konsistenter (0-100 Score)
    return Math.max(0, Math.min(100, (1 - stdDev) * 100));
  }

  private static calculateTrend(history: HistoryEntry[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 14) return 'stable';

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentWeek = history.filter(h => new Date(h.date) >= oneWeekAgo);
    const previousWeek = history.filter(h => {
      const date = new Date(h.date);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    if (recentWeek.length === 0 || previousWeek.length === 0) return 'stable';

    const recentRate = recentWeek.filter(h => h.completed).length / recentWeek.length;
    const previousRate = previousWeek.filter(h => h.completed).length / previousWeek.length;

    const difference = recentRate - previousRate;
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private static calculateDayOfWeekStats(dailyStats: any[]) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return dayNames.map((day, index) => {
      const dayData = dailyStats.filter(stat => new Date(stat.date).getDay() === index);
      const completionRate = dayData.length > 0 
        ? dayData.reduce((sum, d) => sum + d.completionRate, 0) / dayData.length 
        : 0;
      
      return { day, completionRate };
    });
  }

  private static calculateWeeklyPerformance(history: HistoryEntry[]) {
    // Gruppiere nach Wochen und berechne Performance
    const weekGroups = new Map<string, HistoryEntry[]>();
    
    history.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, []);
      }
      weekGroups.get(weekKey)!.push(entry);
    });

    let bestWeek = '';
    let worstWeek = '';
    let bestRate = -1;
    let worstRate = 2;

    for (const [week, entries] of weekGroups) {
      const rate = entries.length > 0 ? entries.filter(e => e.completed).length / entries.length : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestWeek = week;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstWeek = week;
      }
    }

    return { best: bestWeek, worst: worstWeek };
  }

  private static calculatePeakHour(history: HistoryEntry[]): number {
    // Da wir keine Stunden-Daten haben, verwenden wir einen Default
    return 8; // 8 AM als typische Zeit
  }

  private static calculateRoutineStreak(routineHistory: HistoryEntry[]): number {
    // Vereinfachte Streak-Berechnung für eine Routine
    let streak = 0;
    const sortedHistory = routineHistory.sort((a, b) => b.date.localeCompare(a.date));
    
    for (const entry of sortedHistory) {
      if (entry.completed) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private static calculateRoutineLongestStreak(routineHistory: HistoryEntry[]): number {
    const sortedHistory = routineHistory.sort((a, b) => a.date.localeCompare(b.date));
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (const entry of sortedHistory) {
      if (entry.completed) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  private static calculateBestTimeOfDay(routineHistory: HistoryEntry[]): string {
    return 'Morning'; // Placeholder
  }

  private static calculateRoutineTrend(routineHistory: HistoryEntry[]): 'up' | 'down' | 'stable' {
    if (routineHistory.length < 10) return 'stable';
    
    const recent = routineHistory.slice(-5);
    const previous = routineHistory.slice(-10, -5);
    
    if (recent.length === 0 || previous.length === 0) return 'stable';
    
    const recentRate = recent.filter(e => e.completed).length / recent.length;
    const previousRate = previous.filter(e => e.completed).length / previous.length;
    
    if (recentRate > previousRate + 0.1) return 'up';
    if (recentRate < previousRate - 0.1) return 'down';
    return 'stable';
  }

  private static calculateRoutineConsistency(routineHistory: HistoryEntry[]): number {
    if (routineHistory.length === 0) return 0;
    return (routineHistory.filter(e => e.completed).length / routineHistory.length) * 100;
  }

  private static calculateWeeklyTrend(history: HistoryEntry[]): TrendPoint[] {
    const weekGroups = new Map<string, HistoryEntry[]>();
    
    history.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, []);
      }
      weekGroups.get(weekKey)!.push(entry);
    });

    return Array.from(weekGroups.entries())
      .map(([week, entries]) => ({
        date: week,
        value: entries.length > 0 ? entries.filter(e => e.completed).length / entries.length : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static calculateMonthlyTrend(history: HistoryEntry[]): TrendPoint[] {
    const monthGroups = new Map<string, HistoryEntry[]>();
    
    history.forEach(entry => {
      const monthKey = entry.date.slice(0, 7); // YYYY-MM
      
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      monthGroups.get(monthKey)!.push(entry);
    });

    return Array.from(monthGroups.entries())
      .map(([month, entries]) => ({
        date: month,
        value: entries.length > 0 ? entries.filter(e => e.completed).length / entries.length : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static calculateCompletionRateTrend(history: HistoryEntry[]): TrendPoint[] {
    // Tägliche Completion Rate Trends
    const dailyGroups = new Map<string, HistoryEntry[]>();
    
    history.forEach(entry => {
      if (!dailyGroups.has(entry.date)) {
        dailyGroups.set(entry.date, []);
      }
      dailyGroups.get(entry.date)!.push(entry);
    });

    return Array.from(dailyGroups.entries())
      .map(([date, entries]) => ({
        date,
        value: entries.length > 0 ? entries.filter(e => e.completed).length / entries.length : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static calculateStreakHistory(history: HistoryEntry[]): StreakEvent[] {
    // Vereinfachte Streak-Historie
    return [];
  }

  private static calculateNextMilestone(history: HistoryEntry[]) {
    const currentStreak = history.filter(h => h.completed).length;
    const nextStreakMilestone = Math.ceil((currentStreak + 1) / 10) * 10;
    
    return {
      type: 'streak' as const,
      value: nextStreakMilestone,
      estimatedDays: Math.max(1, nextStreakMilestone - currentStreak),
      confidence: 85
    };
  }

  private static calculateRiskAnalysis(history: HistoryEntry[], routines: any[]) {
    const recentActivity = history.filter(h => {
      const entryDate = new Date(h.date);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return entryDate >= threeDaysAgo;
    });

    const streakRisk = recentActivity.length === 0 ? 'high' : 
                     recentActivity.filter(h => h.completed).length < 2 ? 'medium' : 'low';

    const suggestions = [];
    if (streakRisk === 'high') {
      suggestions.push('Consider doing at least one routine today to maintain momentum');
    }
    if (streakRisk === 'medium') {
      suggestions.push('Try to be more consistent with your daily routines');
    }

    return {
      streakRisk: streakRisk as 'low' | 'medium' | 'high',
      consistencyRisk: 'low' as const,
      suggestions
    };
  }

  private static calculateGoalRecommendations(history: HistoryEntry[], routines: Routine[]) {
    return [
      {
        suggested: 'Increase daily completion rate to 80%',
        reason: 'Your current rate shows room for improvement',
        difficulty: 'medium' as const
      }
    ];
  }

  private static compareRecentPeriods(history: HistoryEntry[]): ComparisonMetric[] {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeek = history.filter(h => new Date(h.date) >= lastWeek);
    const previousWeek = history.filter(h => {
      const date = new Date(h.date);
      return date >= twoWeeksAgo && date < lastWeek;
    });

    const thisWeekRate = thisWeek.length > 0 ? thisWeek.filter(h => h.completed).length / thisWeek.length : 0;
    const previousWeekRate = previousWeek.length > 0 ? previousWeek.filter(h => h.completed).length / previousWeek.length : 0;

    return [
      {
        metric: 'Weekly Completion Rate',
        currentPeriod: thisWeekRate,
        previousPeriod: previousWeekRate,
        change: thisWeekRate - previousWeekRate,
        changeType: thisWeekRate > previousWeekRate ? 'improvement' : 
                   thisWeekRate < previousWeekRate ? 'decline' : 'stable'
      }
    ];
  }

  private static calculateSeasonalPatterns(history: HistoryEntry[]): SeasonalPattern[] {
    return []; // Placeholder
  }

  private static calculatePersonalBests(history: HistoryEntry[]): PersonalBest[] {
    return []; // Placeholder
  }
}