import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { TrendingUp, Award, Calendar, Zap, Trophy, Star, Clock, Target } from 'lucide-react-native';

interface PersonalizedStatsCardProps {
  userStats: any;
}

export default function PersonalizedStatsCard({ userStats }: PersonalizedStatsCardProps) {
  const scaleAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const counterAnimation = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scaleAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });

    // Glow effect
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1,
      false
    );

    // Counter animation
    counterAnimation.value = withTiming(1, { duration: 2000 });
  }, []);

  const getPersonalizedMessage = () => {
    if (!userStats) return "Welcome to your fitness journey!";

    const { totalWorkouts, currentStreak, level, totalCalories } = userStats;

    if (currentStreak >= 30) {
      return `🔥 Legendary ${currentStreak}-day streak! You're unstoppable!`;
    } else if (currentStreak >= 14) {
      return `💪 Amazing ${currentStreak}-day streak! You're on fire!`;
    } else if (currentStreak >= 7) {
      return `⭐ Great ${currentStreak}-day streak! Keep it up!`;
    } else if (totalWorkouts >= 50) {
      return `🏆 ${totalWorkouts} workouts completed! You're a champion!`;
    } else if (level >= 5) {
      return `🚀 Level ${level} achieved! You're leveling up fast!`;
    } else if (totalCalories >= 1000) {
      return `🔥 ${totalCalories.toLocaleString()} calories burned! Incredible!`;
    } else if (totalWorkouts >= 10) {
      return `💎 ${totalWorkouts} workouts done! Building momentum!`;
    } else if (totalWorkouts >= 1) {
      return `🌟 Great start! ${totalWorkouts} workout${totalWorkouts > 1 ? 's' : ''} completed!`;
    }

    return "🎯 Ready to start your fitness journey?";
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Every workout is a step closer to your goals! 💪",
      "Your consistency is building something amazing! ⭐",
      "Progress, not perfection - you're doing great! 🚀",
      "Your future self will thank you for today's effort! 🙏",
      "Small steps daily lead to big changes yearly! 📈",
      "You're stronger than your excuses! 💎",
      "Champions train, legends never stop! 🏆",
      "Your only competition is who you were yesterday! 🔥",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale = scaleAnimation.value;
    return { transform: [{ scale }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.3, 0.8]);
    return { opacity };
  });

  const counterStyle = useAnimatedStyle(() => {
    const progress = counterAnimation.value;
    return { opacity: progress };
  });

  const stats = [
    {
      label: 'Level',
      value: userStats?.level || 1,
      icon: <Star size={20} color="#FFD700" />,
      color: '#FFD700',
      suffix: '',
    },
    {
      label: 'Streak',
      value: userStats?.currentStreak || 0,
      icon: <Zap size={20} color="#EF4444" />,
      color: '#EF4444',
      suffix: 'd',
    },
    {
      label: 'Workouts',
      value: userStats?.totalWorkouts || 0,
      icon: <Trophy size={20} color="#10B981" />,
      color: '#10B981',
      suffix: '',
    },
    {
      label: 'Calories',
      value: userStats?.totalCalories || 0,
      icon: <TrendingUp size={20} color="#3B82F6" />,
      color: '#3B82F6',
      suffix: '',
    },
  ];

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={25} style={styles.blur}>
        <LinearGradient
          colors={[
            'rgba(59, 130, 246, 0.15)',
            'rgba(147, 51, 234, 0.15)',
            'rgba(236, 72, 153, 0.15)',
            'rgba(255, 255, 255, 0.05)'
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Animated Glow */}
          <Animated.View style={[styles.glowEffect, glowStyle]}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.3)', 'transparent']}
              style={styles.glow}
            />
          </Animated.View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Award size={28} color="#3B82F6" />
            </View>
            <Text style={styles.headerTitle}>Your Progress</Text>
          </View>

          {/* Personalized Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.personalizedMessage}>
              {getPersonalizedMessage()}
            </Text>
            <Text style={styles.motivationalQuote}>
              {getMotivationalQuote()}
            </Text>
          </View>

          {/* Stats Grid */}
          <Animated.View style={[styles.statsGrid, counterStyle]}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  {stat.icon}
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value.toLocaleString()}{stat.suffix}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Experience Bar */}
          <View style={styles.experienceContainer}>
            <View style={styles.experienceHeader}>
              <Text style={styles.experienceLabel}>Experience</Text>
              <Text style={styles.experienceText}>
                {userStats?.experience || 0} XP
              </Text>
            </View>
            <View style={styles.experienceBar}>
              <Animated.View
                style={[
                  styles.experienceProgress,
                  {
                    width: `${((userStats?.experience || 0) % 1000) / 10}%`,
                  },
                  counterStyle,
                ]}
              />
            </View>
            <Text style={styles.nextLevelText}>
              {1000 - ((userStats?.experience || 0) % 1000)} XP to Level {(userStats?.level || 1) + 1}
            </Text>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blur: {
    flex: 1,
  },
  gradient: {
    padding: 24,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  glow: {
    flex: 1,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  messageContainer: {
    marginBottom: 24,
  },
  personalizedMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    lineHeight: 24,
  },
  motivationalQuote: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  experienceContainer: {
    marginTop: 8,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  experienceText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  experienceBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  experienceProgress: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});