import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { TrendingUp, Calendar, Flame, Clock, Target, Award, Activity, ChartBar as BarChart3, Zap, Trophy } from 'lucide-react-native';
import { storageService, UserStats } from '@/services/storage';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const [stats, weekly, history] = await Promise.all([
        storageService.getUserStats(),
        storageService.getWeeklyProgress(),
        storageService.getWorkoutHistory()
      ]);
      
      setUserStats(stats);
      setWeeklyProgress(weekly);
      setWorkoutHistory(history.slice(0, 10)); // Last 10 workouts
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  if (!userStats) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0F0F23', '#1E1E3F', '#2D2D5F']}
          style={styles.loadingGradient}
        >
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </LinearGradient>
      </View>
    );
  }

  const maxWeeklyWorkouts = Math.max(...weeklyProgress.map(d => d.workouts), 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#0F0F23', '#1E1E3F', '#2D2D5F']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📊 Your Progress</Text>
            <Text style={styles.headerSubtitle}>
              Level {userStats.level} • {userStats.experience % 1000}/1000 XP
            </Text>
          </View>
        </LinearGradient>

        {/* Key Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <LinearGradient
              colors={['#FF6B6B20', '#FF6B6B10']}
              style={styles.metricCard}
            >
              <Flame size={32} color="#FF6B6B" />
              <Text style={styles.metricNumber}>{userStats.totalCalories}</Text>
              <Text style={styles.metricLabel}>Total Calories</Text>
              <Text style={styles.metricSubtext}>Burned</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#00D4FF20', '#00D4FF10']}
              style={styles.metricCard}
            >
              <Activity size={32} color="#00D4FF" />
              <Text style={styles.metricNumber}>{userStats.totalWorkouts}</Text>
              <Text style={styles.metricLabel}>Total Workouts</Text>
              <Text style={styles.metricSubtext}>Completed</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#00FF8820', '#00FF8810']}
              style={styles.metricCard}
            >
              <Target size={32} color="#00FF88" />
              <Text style={styles.metricNumber}>{userStats.currentStreak}</Text>
              <Text style={styles.metricLabel}>Current Streak</Text>
              <Text style={styles.metricSubtext}>Days</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#A78BFA20', '#A78BFA10']}
              style={styles.metricCard}
            >
              <Clock size={32} color="#A78BFA" />
              <Text style={styles.metricNumber}>{userStats.totalMinutes}</Text>
              <Text style={styles.metricLabel}>Total Minutes</Text>
              <Text style={styles.metricSubtext}>Exercised</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Weekly Progress Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>📈 Weekly Progress</Text>
          <LinearGradient
            colors={['#1E1E3F', '#2D2D5F']}
            style={styles.chartContainer}
          >
            <BlurView intensity={20} style={styles.chartContent}>
              <View style={styles.chartHeader}>
                <BarChart3 size={24} color="#00D4FF" />
                <Text style={styles.chartTitle}>Workouts This Week</Text>
              </View>
              
              <View style={styles.chart}>
                {weeklyProgress.map((day, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <LinearGradient
                        colors={['#00D4FF', '#A78BFA']}
                        style={[
                          styles.bar,
                          { 
                            height: Math.max((day.workouts / maxWeeklyWorkouts) * 100, 4),
                            opacity: day.workouts > 0 ? 1 : 0.3
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{day.day}</Text>
                    <Text style={styles.barValue}>{day.workouts}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.chartStats}>
                <View style={styles.chartStat}>
                  <Flame size={16} color="#FF6B6B" />
                  <Text style={styles.chartStatText}>
                    {weeklyProgress.reduce((sum, day) => sum + day.calories, 0)} cal
                  </Text>
                </View>
                <View style={styles.chartStat}>
                  <Clock size={16} color="#A78BFA" />
                  <Text style={styles.chartStatText}>
                    {weeklyProgress.reduce((sum, day) => sum + day.minutes, 0)} min
                  </Text>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </View>

        {/* Personal Bests */}
        <View style={styles.personalBestsSection}>
          <Text style={styles.sectionTitle}>🏆 Personal Bests</Text>
          <View style={styles.personalBestsList}>
            <LinearGradient
              colors={['#FFD93D20', '#FFD93D10']}
              style={styles.personalBestCard}
            >
              <Trophy size={24} color="#FFD93D" />
              <View style={styles.personalBestInfo}>
                <Text style={styles.personalBestTitle}>Best Streak</Text>
                <Text style={styles.personalBestValue}>{userStats.bestStreak} days</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#00FF8820', '#00FF8810']}
              style={styles.personalBestCard}
            >
              <Zap size={24} color="#00FF88" />
              <View style={styles.personalBestInfo}>
                <Text style={styles.personalBestTitle}>Weekly Best</Text>
                <Text style={styles.personalBestValue}>{userStats.weeklyWorkouts} workouts</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#A78BFA20', '#A78BFA10']}
              style={styles.personalBestCard}
            >
              <Award size={24} color="#A78BFA" />
              <View style={styles.personalBestInfo}>
                <Text style={styles.personalBestTitle}>Achievements</Text>
                <Text style={styles.personalBestValue}>{userStats.achievements} unlocked</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>🕐 Recent Workouts</Text>
          <View style={styles.historyList}>
            {workoutHistory.map((workout, index) => (
              <LinearGradient
                key={workout.id}
                colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                style={styles.historyItem}
              >
                <View style={styles.historyIcon}>
                  <Activity size={20} color="#00D4FF" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{workout.title}</Text>
                  <Text style={styles.historyDetails}>
                    {workout.duration} • {workout.calories} cal • {workout.difficulty}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(workout.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>✓</Text>
                </View>
              </LinearGradient>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
  },
  metricsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  metricSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  chartSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  chartContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  chartContent: {
    padding: 24,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartStatText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  personalBestsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  personalBestsList: {
    gap: 12,
  },
  personalBestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  personalBestInfo: {
    flex: 1,
  },
  personalBestTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  personalBestValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  historySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  historyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyBadgeText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 100,
  },
});