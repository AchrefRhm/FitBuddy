import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Calendar, 
  Zap, 
  Trophy, 
  Star, 
  Activity, 
  Heart, 
  Clock, 
  ChartBar as BarChart3, 
  ChartPie as PieChart, 
  ChartLine as LineChart, 
  Brain, 
  Shield, 
  Eye, 
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

// Import our new components
import AnimatedProgressRing from '@/components/AnimatedProgressRing';
import ConfettiEffect from '@/components/ConfettiEffect';
import AITipsCard from '@/components/AITipsCard';
import GoalSettingCTA from '@/components/GoalSettingCTA';
import PersonalizedStatsCard from '@/components/PersonalizedStatsCard';
import { storageService } from '@/utils/storage';

const { width, height } = Dimensions.get('window');

interface ProgressStat {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  date: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface WorkoutHistory {
  date: string;
  type: string;
  duration: number;
  calories: number;
  formScore: number;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'workouts' | 'calories' | 'streak' | 'minutes';
  deadline: string;
  reward: string;
}

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'analytics'>('overview');
  const [userStats, setUserStats] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [progressQuotes] = useState([
    "🔥 You're crushing your goals! Keep the momentum going!",
    "💪 Every rep counts, every step matters!",
    "⭐ Consistency is your superpower!",
    "🚀 You're building the best version of yourself!",
    "🏆 Champions are made in moments like these!",
    "💎 Pressure makes diamonds - you're sparkling!",
    "🌟 Your dedication is truly inspiring!",
    "⚡ Energy flows where attention goes!",
    "🎯 Focus on progress, not perfection!",
    "🔥 Turn your setbacks into comebacks!",
  ]);

  // Animation values
  const pulseAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const floatAnimation = useSharedValue(0);
  const chartAnimation = useSharedValue(0);
  const sparkleAnimation = useSharedValue(0);

  useEffect(() => {
    loadUserData();
    initializeAnimations();
  }, []);

  const loadUserData = async () => {
    try {
      const stats = await storageService.getUserStats();
      setUserStats(stats);
      
      // Load goals (mock data for now)
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Complete 20 Workouts',
          target: 20,
          current: stats.totalWorkouts,
          type: 'workouts',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          reward: '1000 XP + Champion Badge',
        },
        {
          id: '2',
          title: 'Burn 2000 Calories',
          target: 2000,
          current: stats.totalCalories,
          type: 'calories',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          reward: '500 XP + Fire Badge',
        },
      ];
      setGoals(mockGoals);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const initializeAnimations = () => {
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    glowAnimation.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    floatAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    chartAnimation.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) });

    sparkleAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: 'Achievement Unlocked! 🎉',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  const handleGoalCreated = (goal: Goal) => {
    setGoals(prev => [...prev, goal]);
    triggerHapticFeedback();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleTabPress = (tab: string) => {
    triggerHapticFeedback();
    setSelectedTab(tab as any);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    triggerHapticFeedback();
    Toast.show({
      type: 'info',
      text1: soundEnabled ? 'Sound Disabled' : 'Sound Enabled',
      text2: soundEnabled ? '🔇 Sound effects turned off' : '🔊 Sound effects turned on',
      position: 'top',
    });
  };

  // Animation styles
  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.05]);
    return { transform: [{ scale }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.6, 1]);
    return { opacity };
  });

  const floatStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnimation.value, [0, 1], [0, -8]);
    return { transform: [{ translateY }] };
  });

  const chartStyle = useAnimatedStyle(() => {
    const scale = interpolate(chartAnimation.value, [0, 1], [0.8, 1]);
    const opacity = interpolate(chartAnimation.value, [0, 1], [0, 1]);
    return { transform: [{ scale }], opacity };
  });

  const sparkleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(sparkleAnimation.value, [0, 1], [0.3, 1]);
    const scale = interpolate(sparkleAnimation.value, [0, 1], [0.8, 1.2]);
    return { opacity, transform: [{ scale }] };
  });

  const progressStats: ProgressStat[] = [
    {
      label: 'Form Accuracy',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: <Eye size={24} color="#00FF88" />,
      color: '#00FF88',
    },
    {
      label: 'Workout Streak',
      value: `${userStats?.currentStreak || 0} days`,
      change: '+3 days',
      changeType: 'positive',
      icon: <Zap size={24} color="#FF6B6B" />,
      color: '#FF6B6B',
    },
    {
      label: 'AI Corrections',
      value: '156',
      change: '-23',
      changeType: 'positive',
      icon: <Brain size={24} color="#3B82F6" />,
      color: '#3B82F6',
    },
    {
      label: 'Injury Risk',
      value: 'Low',
      change: '-15%',
      changeType: 'positive',
      icon: <Shield size={24} color="#10B981" />,
      color: '#10B981',
    },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Perfect Form Master',
      description: 'Maintained 95%+ form accuracy for 7 consecutive days',
      icon: <Star size={32} color="#FFD700" />,
      color: '#FFD700',
      date: '2 hours ago',
      rarity: 'legendary',
    },
    {
      id: '2',
      title: 'AI Apprentice',
      description: 'Completed 50 AI-guided workouts',
      icon: <Brain size={32} color="#8B5CF6" />,
      color: '#8B5CF6',
      date: '1 day ago',
      rarity: 'epic',
    },
    {
      id: '3',
      title: 'Consistency Champion',
      description: '10-day workout streak achieved',
      icon: <Zap size={32} color="#EF4444" />,
      color: '#EF4444',
      date: '3 days ago',
      rarity: 'rare',
    },
  ];

  const workoutHistory: WorkoutHistory[] = [
    { date: 'Today', type: 'Upper Body', duration: 45, calories: 320, formScore: 96 },
    { date: 'Yesterday', type: 'HIIT', duration: 30, calories: 280, formScore: 92 },
    { date: '2 days ago', type: 'Lower Body', duration: 50, calories: 350, formScore: 94 },
    { date: '3 days ago', type: 'Cardio', duration: 35, calories: 290, formScore: 89 },
    { date: '4 days ago', type: 'Full Body', duration: 60, calories: 420, formScore: 97 },
  ];

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#8B5CF6';
      case 'rare': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getRarityGlow = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'rgba(255, 215, 0, 0.3)';
      case 'epic': return 'rgba(139, 92, 246, 0.3)';
      case 'rare': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  };

  const renderOverview = () => (
    <>
      {/* Personalized Stats Summary */}
      <PersonalizedStatsCard userStats={userStats} />

      {/* AI Tips Card */}
      <AITipsCard userStats={userStats} onRefresh={() => triggerHapticFeedback()} />

      {/* Goal Setting CTA */}
      <GoalSettingCTA onGoalSet={handleGoalCreated} currentGoals={goals} />

      {/* Progress Rings */}
      <View style={styles.progressRingsContainer}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.progressRingsGrid}>
          <AnimatedProgressRing
            progress={0.75}
            size={120}
            strokeWidth={8}
            color={['#00FF88', '#00CC6A']}
            label="Calories"
            value="320/400"
            icon={<Zap size={24} color="#00FF88" />}
            delay={0}
          />
          <AnimatedProgressRing
            progress={0.6}
            size={120}
            strokeWidth={8}
            color={['#3B82F6', '#2563EB']}
            label="Workouts"
            value="3/5"
            icon={<Trophy size={24} color="#3B82F6" />}
            delay={200}
          />
          <AnimatedProgressRing
            progress={0.9}
            size={120}
            strokeWidth={8}
            color={['#EF4444', '#DC2626']}
            label="Streak"
            value={`${userStats?.currentStreak || 0}d`}
            icon={<Target size={24} color="#EF4444" />}
            delay={400}
          />
        </View>
      </View>

      {/* Progress Stats Grid */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>AI Performance Metrics</Text>
        <View style={styles.statsGrid}>
          {progressStats.map((stat, index) => (
            <Animated.View
              key={index}
              style={[styles.statCard, pulseStyle]}
            >
              <BlurView intensity={15} style={styles.statBlur}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.statGradient}
                >
                  <View style={styles.statHeader}>
                    <Animated.View style={[styles.statIcon, glowStyle]}>
                      {stat.icon}
                    </Animated.View>
                    <Text style={[
                      styles.statChange,
                      {
                        color: stat.changeType === 'positive' ? '#10B981' :
                               stat.changeType === 'negative' ? '#EF4444' : '#6B7280'
                      }
                    ]}>
                      {stat.change}
                    </Text>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <Animated.View style={[styles.chartContainer, chartStyle]}>
        <BlurView intensity={20} style={styles.chartBlur}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
            style={styles.chartGradient}
          >
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleContainer}>
                <BarChart3 size={24} color="#3B82F6" />
                <Text style={styles.chartTitle}>Weekly Form Analysis</Text>
              </View>
              <View style={styles.periodSelector}>
                {(['week', 'month', 'year'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      selectedPeriod === period && styles.periodButtonActive
                    ]}
                    onPress={() => {
                      setSelectedPeriod(period);
                      triggerHapticFeedback();
                    }}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive
                    ]}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Simulated Chart */}
            <View style={styles.chartArea}>
              <View style={styles.chartBars}>
                {[85, 92, 88, 94, 96, 89, 97].map((value, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.chartBar,
                      {
                        height: (value / 100) * 120,
                        backgroundColor: value >= 90 ? '#00FF88' : value >= 80 ? '#F59E0B' : '#EF4444',
                      },
                      chartStyle,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.chartLabels}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <Text key={index} style={styles.chartLabel}>{day}</Text>
                ))}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Progress Quote */}
      <Animated.View style={[styles.quoteContainer, floatStyle]}>
        <BlurView intensity={15} style={styles.quoteBlur}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
            style={styles.quoteGradient}
          >
            <Animated.View style={[styles.quoteIcon, sparkleStyle]}>
              <Sparkles size={24} color="#10B981" />
            </Animated.View>
            <Text style={styles.quoteText}>
              {progressQuotes[Math.floor(Math.random() * progressQuotes.length)]}
            </Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Recent Workouts */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {workoutHistory.map((workout, index) => (
          <Animated.View
            key={index}
            style={[styles.historyCard, floatStyle]}
          >
            <BlurView intensity={15} style={styles.historyBlur}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.historyGradient}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyType}>{workout.type}</Text>
                    <Text style={styles.historyDate}>{workout.date}</Text>
                  </View>
                  <View style={[
                    styles.formScoreBadge,
                    {
                      backgroundColor: workout.formScore >= 95 ? 'rgba(16, 185, 129, 0.2)' :
                                     workout.formScore >= 90 ? 'rgba(245, 158, 11, 0.2)' :
                                     'rgba(239, 68, 68, 0.2)'
                    }
                  ]}>
                    <Text style={[
                      styles.formScoreText,
                      {
                        color: workout.formScore >= 95 ? '#10B981' :
                               workout.formScore >= 90 ? '#F59E0B' : '#EF4444'
                      }
                    ]}>
                      {workout.formScore}%
                    </Text>
                  </View>
                </View>
                <View style={styles.historyStats}>
                  <View style={styles.historyStat}>
                    <Clock size={16} color="#9CA3AF" />
                    <Text style={styles.historyStatText}>{workout.duration} min</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Zap size={16} color="#9CA3AF" />
                    <Text style={styles.historyStatText}>{workout.calories} cal</Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Eye size={16} color="#9CA3AF" />
                    <Text style={styles.historyStatText}>AI Monitored</Text>
                  </View>
                </View>
              </LinearGradient>

              
            </BlurView>
          </Animated.View>
        ))}
      </View>
    </>
  );

  const renderAchievements = () => (
    <View style={styles.achievementsContainer}>
      <Text style={styles.sectionTitle}>Achievements Unlocked</Text>
      {achievements.map((achievement) => (
        <Animated.View
          key={achievement.id}
          style={[styles.achievementCard, floatStyle]}
        >
          <BlurView intensity={20} style={styles.achievementBlur}>
            <LinearGradient
              colors={[
                getRarityGlow(achievement.rarity),
                'rgba(255, 255, 255, 0.05)'
              ]}
              style={styles.achievementGradient}
            >
              <View style={styles.achievementContent}>
                <Animated.View style={[
                  styles.achievementIcon,
                  { borderColor: getRarityColor(achievement.rarity) },
                  pulseStyle
                ]}>
                  {achievement.icon}
                </Animated.View>
                <View style={styles.achievementText}>
                  <View style={styles.achievementHeader}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <View style={[
                      styles.rarityBadge,
                      { backgroundColor: getRarityColor(achievement.rarity) }
                    ]}>
                      <Text style={styles.rarityText}>
                        {achievement.rarity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  <Text style={styles.achievementDate}>{achievement.date}</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      ))}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <Text style={styles.sectionTitle}>AI Analytics Dashboard</Text>
      
      {/* AI Insights Card */}
      <Animated.View style={[styles.insightsCard, pulseStyle]}>
        <BlurView intensity={20} style={styles.insightsBlur}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 255, 136, 0.05)']}
            style={styles.insightsGradient}
          >
            <View style={styles.insightsHeader}>
              <Sparkles size={24} color="#00FF88" />
              <Text style={styles.insightsTitle}>AI Insights</Text>
            </View>
            <Text style={styles.insightsText}>
              Your form has improved by 12% this week! The AI detected that your squat depth consistency increased significantly. Keep focusing on controlled movements for optimal results.
            </Text>
            <View style={styles.insightsStats}>
              <View style={styles.insightStat}>
                <Text style={styles.insightStatValue}>96%</Text>
                <Text style={styles.insightStatLabel}>Avg Form Score</Text>
              </View>
              <View style={styles.insightStat}>
                <Text style={styles.insightStatValue}>23</Text>
                <Text style={styles.insightStatLabel}>Corrections/Week</Text>
              </View>
              <View style={styles.insightStat}>
                <Text style={styles.insightStatValue}>Low</Text>
                <Text style={styles.insightStatLabel}>Injury Risk</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Performance Trends */}
      <Animated.View style={[styles.trendsCard, chartStyle]}>
        <BlurView intensity={15} style={styles.trendsBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.trendsGradient}
          >
            <View style={styles.trendsHeader}>
              <LineChart size={24} color="#3B82F6" />
              <Text style={styles.trendsTitle}>Performance Trends</Text>
            </View>
            <View style={styles.trendsList}>
              <View style={styles.trendItem}>
                <TrendingUp size={20} color="#10B981" />
                <View style={styles.trendText}>
                  <Text style={styles.trendLabel}>Form Accuracy</Text>
                  <Text style={styles.trendValue}>+12% this week</Text>
                </View>
              </View>
              <View style={styles.trendItem}>
                <Activity size={20} color="#F59E0B" />
                <View style={styles.trendText}>
                  <Text style={styles.trendLabel}>Workout Intensity</Text>
                  <Text style={styles.trendValue}>+8% improvement</Text>
                </View>
              </View>
              <View style={styles.trendItem}>
                <Heart size={20} color="#EF4444" />
                <View style={styles.trendText}>
                  <Text style={styles.trendLabel}>Recovery Rate</Text>
                  <Text style={styles.trendValue}>Optimal range</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Background */}
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Particles */}
      <View style={styles.particleContainer}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: (i * width) / 15,
                top: (i * height) / 15,
              },
              glowStyle,
            ]}
          />
        ))}
      </View>

      {/* Confetti Effect */}
      <ConfettiEffect trigger={showConfetti} />

      {/* Header */}
      <Animated.View style={[styles.header, floatStyle]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Progress Tracking</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Analytics</Text>
          </View>
          <TouchableOpacity style={styles.soundButton} onPress={toggleSound}>
            {soundEnabled ? (
              <Volume2 size={24} color="#3B82F6" />
            ) : (
              <VolumeX size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: <BarChart3 size={20} color="white" /> },
          { key: 'achievements', label: 'Achievements', icon: <Trophy size={20} color="white" /> },
          { key: 'analytics', label: 'Analytics', icon: <Brain size={20} color="white" /> },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.tabButtonActive
            ]}
            onPress={() => handleTabPress(tab.key)}
          >
            <LinearGradient
              colors={selectedTab === tab.key ? ['#3B82F6', '#2563EB'] : ['transparent', 'transparent']}
              style={styles.tabButtonGradient}
            >
              {tab.icon}
              <Text style={[
                styles.tabButtonText,
                selectedTab === tab.key && styles.tabButtonTextActive
              ]}>
                {tab.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'achievements' && renderAchievements()}
        {selectedTab === 'analytics' && renderAnalytics()}
        
        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Toast Messages */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 1.5,
    opacity: 0.7,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  soundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButtonActive: {},
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  progressRingsContainer: {
    marginBottom: 30,
  },
  progressRingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quoteContainer: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  quoteBlur: {
    flex: 1,
  },
  quoteGradient: {
    padding: 20,
    alignItems: 'center',
  },
  quoteIcon: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statBlur: {
    flex: 1,
  },
  statGradient: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {},
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartContainer: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  chartBlur: {
    flex: 1,
  },
  chartGradient: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  chartArea: {
    height: 160,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 10,
  },
  chartBar: {
    width: 30,
    borderRadius: 4,
    minHeight: 20,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  chartLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  historyContainer: {
    marginBottom: 30,
  },
  historyCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyBlur: {
    flex: 1,
  },
  historyGradient: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyInfo: {},
  historyType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  formScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginLeft: 6,
    fontWeight: '500',
  },
  achievementsContainer: {
    marginBottom: 30,
  },
  achievementCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementBlur: {
    flex: 1,
  },
  achievementGradient: {
    padding: 20,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  achievementText: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
    lineHeight: 20,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  analyticsContainer: {
    marginBottom: 30,
  },
  insightsCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  insightsBlur: {
    flex: 1,
  },
  insightsGradient: {
    padding: 24,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF88',
    marginLeft: 12,
  },
  insightsText: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 20,
  },
  insightsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightStat: {
    alignItems: 'center',
  },
  insightStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  insightStatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  trendsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendsBlur: {
    flex: 1,
  },
  trendsGradient: {
    padding: 20,
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  trendsList: {},
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendText: {
    marginLeft: 12,
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 120,
  },
});