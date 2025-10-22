import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/Theme';
import { AdvancedAnalytics, AnalyticsData } from '../utils/advancedAnalytics';

const { width } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  onBack: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'insights' | 'predictions'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdvancedAnalytics.generateAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Fehler beim Laden der Analytics:', error);
      Alert.alert('Fehler', 'Analytics konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    return `${Math.round(value * 100)}%`;
  }, []);

  const formatNumber = useCallback((value: number): string => {
    return Math.round(value).toString();
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'same' | 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'up':
      case 'improving':
        return { name: 'trending-up' as const, color: Theme.Colors.success[500][500] };
      case 'down':
      case 'declining':
        return { name: 'trending-down' as const, color: Theme.Colors.error[500][500] };
      default:
        return { name: 'remove' as const, color: Theme.Colors.text.secondary };
    }
  };

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    const { timeMetrics, performanceMetrics } = analyticsData;

    return (
      <ScrollView style={styles.tabContent}>
        {/* Zeit-Metriken */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Zeit & Aktivität</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{timeMetrics.totalActiveDays}</Text>
              <Text style={styles.metricLabel}>Aktive Tage</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{timeMetrics.currentStreak}</Text>
              <Text style={styles.metricLabel}>Aktuelle Streak</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{timeMetrics.longestStreak}</Text>
              <Text style={styles.metricLabel}>Längste Streak</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatPercentage(timeMetrics.averageCompletionRate)}</Text>
              <Text style={styles.metricLabel}>Ø Abschlussrate</Text>
            </View>
          </View>

          {/* Wöchentliche Trends */}
          <View style={styles.trendCard}>
            <Text style={styles.trendTitle}>Wöchentliche Aktivität</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendText}>Diese Woche: {timeMetrics.weeklyActivity.thisWeek}</Text>
              <View style={styles.trendIndicator}>
                <Ionicons 
                  name={getTrendIcon(timeMetrics.weeklyActivity.trend).name}
                  size={16}
                  color={getTrendIcon(timeMetrics.weeklyActivity.trend).color}
                />
              </View>
            </View>
            <Text style={styles.trendSubtext}>Letzte Woche: {timeMetrics.weeklyActivity.lastWeek}</Text>
          </View>

          {/* Beste Tage */}
          <View style={styles.trendCard}>
            <Text style={styles.trendTitle}>Wochentag-Analyse</Text>
            <Text style={styles.trendText}>🔥 Aktivster Tag: {timeMetrics.mostActiveDay}</Text>
            <Text style={styles.trendText}>😴 Schwächster Tag: {timeMetrics.leastActiveDay}</Text>
          </View>
        </View>

        {/* Performance-Metriken */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Performance</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatPercentage(performanceMetrics.overallCompletionRate)}</Text>
              <Text style={styles.metricLabel}>Gesamt-Rate</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(performanceMetrics.consistencyScore)}</Text>
              <Text style={styles.metricLabel}>Konsistenz-Score</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatNumber(performanceMetrics.averageRoutinesPerDay)}</Text>
              <Text style={styles.metricLabel}>Ø Routines/Tag</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{performanceMetrics.peakPerformanceHour}:00</Text>
              <Text style={styles.metricLabel}>Peak-Zeit</Text>
            </View>
          </View>

          {/* Verbesserungstrend */}
          <View style={styles.trendCard}>
            <Text style={styles.trendTitle}>Verbesserungstrend</Text>
            <View style={styles.trendRow}>
              <Text style={styles.trendText}>{performanceMetrics.improvementTrend}</Text>
              <View style={styles.trendIndicator}>
                <Ionicons 
                  name={getTrendIcon(performanceMetrics.improvementTrend).name}
                  size={16}
                  color={getTrendIcon(performanceMetrics.improvementTrend).color}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPerformanceTab = () => {
    if (!analyticsData) return null;

    const { routineInsights, comparisons } = analyticsData;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Routine-Performance</Text>
          
          {routineInsights.map((routine, index) => (
            <View key={routine.routineId} style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <Text style={styles.routineName}>{routine.routineName}</Text>
                <View style={styles.trendIndicator}>
                  <Ionicons 
                    name={getTrendIcon(routine.trend).name}
                    size={16}
                    color={getTrendIcon(routine.trend).color}
                  />
                </View>
              </View>
              
              <View style={styles.routineMetrics}>
                <View style={styles.routineMetric}>
                  <Text style={styles.routineMetricValue}>{formatPercentage(routine.completionRate)}</Text>
                  <Text style={styles.routineMetricLabel}>Abschlussrate</Text>
                </View>
                
                <View style={styles.routineMetric}>
                  <Text style={styles.routineMetricValue}>{routine.currentStreak}</Text>
                  <Text style={styles.routineMetricLabel}>Aktuelle Streak</Text>
                </View>
                
                <View style={styles.routineMetric}>
                  <Text style={styles.routineMetricValue}>{routine.longestStreak}</Text>
                  <Text style={styles.routineMetricLabel}>Längste Streak</Text>
                </View>
                
                <View style={styles.routineMetric}>
                  <Text style={styles.routineMetricValue}>{formatNumber(routine.consistency)}</Text>
                  <Text style={styles.routineMetricLabel}>Konsistenz</Text>
                </View>
              </View>
              
              <Text style={styles.routineBestTime}>Beste Zeit: {routine.bestTimeOfDay}</Text>
            </View>
          ))}
        </View>

        {/* Periodenvergleiche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Periodenvergleiche</Text>
          
          {comparisons.periodComparisons.map((comparison, index) => (
            <View key={index} style={styles.comparisonCard}>
              <Text style={styles.comparisonMetric}>{comparison.metric}</Text>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonText}>
                  Aktuell: {formatPercentage(comparison.currentPeriod)}
                </Text>
                <Text style={styles.comparisonText}>
                  Vorher: {formatPercentage(comparison.previousPeriod)}
                </Text>
              </View>
              <View style={styles.comparisonChange}>
                <Text style={[
                  styles.comparisonChangeText,
                  { color: comparison.changeType === 'improvement' ? Theme.Colors.success[500] : 
                           comparison.changeType === 'decline' ? Theme.Colors.error[500] : 
                           Theme.Colors.text.secondary }
                ]}>
                  {comparison.change > 0 ? '+' : ''}{formatPercentage(Math.abs(comparison.change))} {comparison.changeType}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderInsightsTab = () => {
    if (!analyticsData) return null;

    const { trends } = analyticsData;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Trend-Analyse</Text>
          
          {/* Wöchentliche Trends */}
          <View style={styles.trendAnalysisCard}>
            <Text style={styles.trendAnalysisTitle}>Wöchentliche Entwicklung</Text>
            <Text style={styles.trendAnalysisText}>
              {trends.weeklyTrend.length} Wochen mit Daten verfügbar
            </Text>
            {trends.weeklyTrend.slice(-4).map((trend, index) => (
              <View key={index} style={styles.trendDataRow}>
                <Text style={styles.trendDate}>{trend.date}</Text>
                <Text style={styles.trendValue}>{formatPercentage(trend.value)}</Text>
              </View>
            ))}
          </View>

          {/* Monatliche Trends */}
          <View style={styles.trendAnalysisCard}>
            <Text style={styles.trendAnalysisTitle}>Monatliche Entwicklung</Text>
            <Text style={styles.trendAnalysisText}>
              {trends.monthlyTrend.length} Monate mit Daten verfügbar
            </Text>
            {trends.monthlyTrend.slice(-3).map((trend, index) => (
              <View key={index} style={styles.trendDataRow}>
                <Text style={styles.trendDate}>{trend.date}</Text>
                <Text style={styles.trendValue}>{formatPercentage(trend.value)}</Text>
              </View>
            ))}
          </View>

          {/* Completion Rate Trend */}
          <View style={styles.trendAnalysisCard}>
            <Text style={styles.trendAnalysisTitle}>Tägliche Abschlussraten</Text>
            <Text style={styles.trendAnalysisText}>
              Letzte 7 Tage im Detail
            </Text>
            {trends.completionRateTrend.slice(-7).map((trend, index) => (
              <View key={index} style={styles.trendDataRow}>
                <Text style={styles.trendDate}>{trend.date}</Text>
                <Text style={styles.trendValue}>{formatPercentage(trend.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPredictionsTab = () => {
    if (!analyticsData) return null;

    const { predictions } = analyticsData;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 Vorhersagen & Empfehlungen</Text>
          
          {/* Nächster Meilenstein */}
          <View style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>🎯 Nächster Meilenstein</Text>
            <Text style={styles.predictionText}>
              {predictions.nextMilestone.type}: {predictions.nextMilestone.value}
            </Text>
            <Text style={styles.predictionDetail}>
              Geschätzte Tage: {predictions.nextMilestone.estimatedDays}
            </Text>
            <Text style={styles.predictionDetail}>
              Vertrauen: {predictions.nextMilestone.confidence}%
            </Text>
          </View>

          {/* Risiko-Analyse */}
          <View style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>⚠️ Risiko-Analyse</Text>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>Streak-Risiko:</Text>
              <Text style={[
                styles.riskValue,
                { color: predictions.riskAnalysis.streakRisk === 'high' ? Theme.Colors.error[500] :
                         predictions.riskAnalysis.streakRisk === 'medium' ? Theme.Colors.warning[500] :
                         Theme.Colors.success[500] }
              ]}>
                {predictions.riskAnalysis.streakRisk}
              </Text>
            </View>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>Konsistenz-Risiko:</Text>
              <Text style={[
                styles.riskValue,
                { color: predictions.riskAnalysis.consistencyRisk === 'high' ? Theme.Colors.error[500] :
                         predictions.riskAnalysis.consistencyRisk === 'medium' ? Theme.Colors.warning[500] :
                         Theme.Colors.success[500] }
              ]}>
                {predictions.riskAnalysis.consistencyRisk}
              </Text>
            </View>
          </View>

          {/* Empfehlungen */}
          <View style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>💡 Empfehlungen</Text>
            {predictions.riskAnalysis.suggestions.map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>

          {/* Ziel-Empfehlungen */}
          <View style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>🎯 Ziel-Empfehlungen</Text>
            {predictions.goalRecommendations.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <Text style={styles.goalSuggestion}>{goal.suggested}</Text>
                <Text style={styles.goalReason}>{goal.reason}</Text>
                <Text style={[
                  styles.goalDifficulty,
                  { color: goal.difficulty === 'easy' ? Theme.Colors.success[500] :
                           goal.difficulty === 'medium' ? Theme.Colors.warning[500] :
                           Theme.Colors.error[500] }
                ]}>
                  Schwierigkeit: {goal.difficulty}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.Colors.primary[500]} />
        <Text style={styles.loadingText}>Analytics werden generiert...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <TouchableOpacity onPress={loadAnalytics} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Theme.Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Übersicht
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'performance' && styles.activeTab]}
          onPress={() => setSelectedTab('performance')}
        >
          <Text style={[styles.tabText, selectedTab === 'performance' && styles.activeTabText]}>
            Performance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'insights' && styles.activeTab]}
          onPress={() => setSelectedTab('insights')}
        >
          <Text style={[styles.tabText, selectedTab === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'predictions' && styles.activeTab]}
          onPress={() => setSelectedTab('predictions')}
        >
          <Text style={[styles.tabText, selectedTab === 'predictions' && styles.activeTabText]}>
            Prognosen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'performance' && renderPerformanceTab()}
      {selectedTab === 'insights' && renderInsightsTab()}
      {selectedTab === 'predictions' && renderPredictionsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.surface.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.Colors.surface.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Theme.Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.surface.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
  },
  refreshButton: {
    padding: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: Theme.Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.surface.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    color: Theme.Colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Theme.Colors.primary[500],
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.surface.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricCard: {
    width: (width - 56) / 2,
    backgroundColor: Theme.Colors.surface.card,
    padding: 16,
    margin: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.Colors.primary[500],
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
  trendCard: {
    backgroundColor: Theme.Colors.surface.card,
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendText: {
    fontSize: 14,
    color: Theme.Colors.text.primary,
  },
  trendSubtext: {
    fontSize: 12,
    color: Theme.Colors.text.secondary,
    marginTop: 4,
  },
  trendIndicator: {
    marginLeft: 8,
  },
  routineCard: {
    backgroundColor: Theme.Colors.surface.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
  },
  routineMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  routineMetric: {
    alignItems: 'center',
  },
  routineMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.primary[500],
  },
  routineMetricLabel: {
    fontSize: 10,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
  routineBestTime: {
    fontSize: 12,
    color: Theme.Colors.text.secondary,
    textAlign: 'center',
  },
  comparisonCard: {
    backgroundColor: Theme.Colors.surface.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  comparisonMetric: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  comparisonText: {
    fontSize: 14,
    color: Theme.Colors.text.primary,
  },
  comparisonChange: {
    alignItems: 'center',
    marginTop: 4,
  },
  comparisonChangeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trendAnalysisCard: {
    backgroundColor: Theme.Colors.surface.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trendAnalysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
    marginBottom: 8,
  },
  trendAnalysisText: {
    fontSize: 14,
    color: Theme.Colors.text.secondary,
    marginBottom: 12,
  },
  trendDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  trendDate: {
    fontSize: 14,
    color: Theme.Colors.text.primary,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.Colors.primary[500],
  },
  predictionCard: {
    backgroundColor: Theme.Colors.surface.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
    marginBottom: 12,
  },
  predictionText: {
    fontSize: 14,
    color: Theme.Colors.text.primary,
    marginBottom: 4,
  },
  predictionDetail: {
    fontSize: 12,
    color: Theme.Colors.text.secondary,
    marginBottom: 2,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskLabel: {
    fontSize: 14,
    color: Theme.Colors.text.primary,
  },
  riskValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  suggestionText: {
    fontSize: 14,
    color: Theme.Colors.text.primary,
    marginBottom: 4,
  },
  goalCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.surface.border,
  },
  goalSuggestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.Colors.text.primary,
    marginBottom: 4,
  },
  goalReason: {
    fontSize: 12,
    color: Theme.Colors.text.secondary,
    marginBottom: 4,
  },
  goalDifficulty: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
