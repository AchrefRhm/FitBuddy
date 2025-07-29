import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { TrendingUp, Zap, Target, Award, Calendar, Clock, Flame, Activity, ChartBar as BarChart3, ChartPie as PieChart, Users, Star } from 'lucide-react-native';
import { storageService } from '@/utils/storage';

const { width, height } = Dimensions.get('window');

interface AnalyticsData {
  totalWorkouts: number;
  totalCalories: number;
  currentStreak: number;
  totalMinutes: number;
  level: number;
  experience: number;
  weeklyData: Array<{
    day: string;
    workouts: number;
    calories: number;
    minutes: number;
  }>;
  recentAchievements: Array<{
    title: string;
    description: string;
    icon: string;
    rarity: string;
  }>;
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const chartAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    loadAnalyticsData();
    
    // Start entrance animations
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withTiming(0, { duration: 800 });
    chartAnim.value = withDelay(400, withTiming(1, { duration: 1000 }));
    
    // Pulse animation for live data
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const stats = await storageService.getUserStats();
      const weeklyData = await storageService.getWeeklyProgress();
      const achievements = await storageService.getRecentAchievements(3);
      
      setData({
        totalWorkouts: stats.totalWorkouts,
        totalCalories: stats.totalCalories,
        currentStreak: stats.currentStreak,
        totalMinutes: stats.totalMinutes,
        level: stats.level,
        experience: stats.experience,
        weeklyData,
        recentAchievements: achievements,
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setIsLoading(false);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const chartStyle = useAnimatedStyle(() => ({
    opacity: chartAnim.value,
    transform: [{ scale: interpolate(chartAnim.value, [0, 1], [0.8, 1]) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  if (isLoading || !data) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.background}>
          <View style={styles.loadingContainer}>
            <Animated.View style={pulseStyle}>
              <BarChart3 size={64} color="#3B82F6" strokeWidth={1.5} />
            </Animated.View>
            <Text style={styles.loadingText}>Loading Analytics...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const maxWorkouts = Math.max(...data.weeklyData.map(d => d.workouts), 1);
  const maxCalories = Math.max(...data.weeklyData.map(d => d.calories), 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.background}>
        <Animated.View style={[styles.content, containerStyle]}>
          {/* Header */}
          <BlurView intensity={20} style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Analytics</Text>
                <Text style={styles.headerSubtitle}>Real-time performance insights</Text>
              </View>
              <Animated.View style={pulseStyle}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </Animated.View>
            </View>
          </BlurView>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Level & Experience */}
            <Animated.View style={[styles.levelCard, chartStyle]}>
              <LinearGradient
                colors={['rgba(59,130,246,0.1)', 'rgba(16,185,129,0.1)']}
                style={styles.levelCardGradient}
              >
                <View style={styles.levelHeader}>
                  <Star size={24} color="#F59E0B" />
                  <Text style={styles.levelTitle}>Level {data.level}</Text>
                </View>
                
                <View style={styles.experienceBar}>
                  <View style={styles.experienceTrack}>
                    <Animated.View 
                      style={[
                        styles.experienceProgress,
                        {
                          width: `${((data.experience % 1000) / 1000) * 100}%`,
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.experienceText}>
                    {data.experience % 1000}/1000 XP
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Key Metrics */}
            <Animated.View style={[styles.metricsGrid, chartStyle]}>
              <MetricCard
                icon={<Target size={24} color="#3B82F6" />}
                title="Workouts"
                value={data.totalWorkouts.toString()}
                subtitle="Total completed"
                gradient={['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.05)']}
              />
              
              <MetricCard
                icon={<Flame size={24} color="#EF4444" />}
                title="Calories"
                value={data.totalCalories.toLocaleString()}
                subtitle="Total burned"
                gradient={['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.05)']}
              />
              
              <MetricCard
                icon={<Zap size={24} color="#10B981" />}
                title="Streak"
                value={data.currentStreak.toString()}
                subtitle="Days active"
                gradient={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
              />
              
              <MetricCard
                icon={<Clock size={24} color="#F59E0B" />}
                title="Minutes"
                value={data.totalMinutes.toString()}
                subtitle="Total active"
                gradient={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']}
              />
            </Animated.View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {(['week', 'month', 'year'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive,
                    ]}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weekly Chart */}
            <Animated.View style={[styles.chartCard, chartStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.chartCardGradient}
              >
                <View style={styles.chartHeader}>
                  <BarChart3 size={20} color="#3B82F6" />
                  <Text style={styles.chartTitle}>Weekly Activity</Text>
                </View>
                
                <View style={styles.chart}>
                  {data.weeklyData.map((day, index) => (
                    <View key={day.day} style={styles.chartColumn}>
                      <View style={styles.chartBars}>
                        <Animated.View
                          style={[
                            styles.chartBar,
                            styles.workoutBar,
                            {
                              height: (day.workouts / maxWorkouts) * 60,
                            },
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.chartBar,
                            styles.calorieBar,
                            {
                              height: (day.calories / maxCalories) * 60,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{day.day}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.legendText}>Workouts</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>Calories</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Recent Achievements */}
            {data.recentAchievements.length > 0 && (
              <Animated.View style={[styles.achievementsCard, chartStyle]}>
                <LinearGradient
                  colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.05)']}
                  style={styles.achievementsCardGradient}
                >
                  <View style={styles.achievementsHeader}>
                    <Award size={20} color="#F59E0B" />
                    <Text style={styles.achievementsTitle}>Recent Achievements</Text>
                  </View>
                  
                  {data.recentAchievements.map((achievement, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.achievementItem,
                        {
                          opacity: chartAnim,
                          transform: [
                            {
                              translateX: interpolate(
                                chartAnim.value,
                                [0, 1],
                                [50, 0]
                              ),
                            },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.achievementIcon}>
                        <Award size={16} color="#F59E0B" />
                      </View>
                      <View style={styles.achievementContent}>
                        <Text style={styles.achievementTitle}>{achievement.title}</Text>
                        <Text style={styles.achievementDescription}>
                          {achievement.description}
                        </Text>
                      </View>
                      <View style={[
                        styles.rarityBadge,
                        { backgroundColor: getRarityColor(achievement.rarity) }
                      ]}>
                        <Text style={styles.rarityText}>
                          {achievement.rarity.toUpperCase()}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </LinearGradient>
              </Animated.View>
            )}

            {/* Real-time Stats */}
            <Animated.View style={[styles.realtimeCard, chartStyle]}>
              <LinearGradient
                colors={['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.05)']}
                style={styles.realtimeCardGradient}
              >
                <View style={styles.realtimeHeader}>
                  <Activity size={20} color="#10B981" />
                  <Text style={styles.realtimeTitle}>Live Performance</Text>
                  <Animated.View style={pulseStyle}>
                    <View style={styles.livePulse} />
                  </Animated.View>
                </View>
                
                <View style={styles.realtimeMetrics}>
                  <View style={styles.realtimeMetric}>
                    <Text style={styles.realtimeValue}>98%</Text>
                    <Text style={styles.realtimeLabel}>Form Score</Text>
                  </View>
                  <View style={styles.realtimeMetric}>
                    <Text style={styles.realtimeValue}>142</Text>
                    <Text style={styles.realtimeLabel}>Heart Rate</Text>
                  </View>
                  <View style={styles.realtimeMetric}>
                    <Text style={styles.realtimeValue}>85%</Text>
                    <Text style={styles.realtimeLabel}>Symmetry</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function MetricCard({ icon, title, value, subtitle, gradient }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string[];
}) {
  return (
    <View style={styles.metricCard}>
      <LinearGradient colors={gradient} style={styles.metricCardGradient}>
        <View style={styles.metricIcon}>{icon}</View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '#F59E0B';
    case 'epic': return '#8B5CF6';
    case 'rare': return '#3B82F6';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 28,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  levelCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  levelCardGradient: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  levelTitle: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: '800',
  },
  experienceBar: {
    gap: 8,
  },
  experienceTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  experienceProgress: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  experienceText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricCardGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    marginBottom: 4,
  },
  metricValue: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: '900',
  },
  metricTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  metricSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chartCardGradient: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chartTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 16,
  },
  chartColumn: {
    alignItems: 'center',
    gap: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  workoutBar: {
    backgroundColor: '#3B82F6',
  },
  calorieBar: {
    backgroundColor: '#EF4444',
  },
  chartLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  achievementsCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  achievementsCardGradient: {
    padding: 20,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  achievementsTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  achievementDescription: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  realtimeCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  realtimeCardGradient: {
    padding: 20,
  },
  realtimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  realtimeTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  livePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  realtimeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  realtimeMetric: {
    alignItems: 'center',
    gap: 4,
  },
  realtimeValue: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: '900',
  },
  realtimeLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});