import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Brain, Sparkles, RefreshCw, Lightbulb } from 'lucide-react-native';

interface AITip {
  id: string;
  title: string;
  content: string;
  category: 'form' | 'motivation' | 'nutrition' | 'recovery' | 'technique';
  icon: React.ReactNode;
  color: string[];
}

interface AITipsCardProps {
  userStats: any;
  onRefresh?: () => void;
}

export default function AITipsCard({ userStats, onRefresh }: AITipsCardProps) {
  const [currentTip, setCurrentTip] = useState<AITip | null>(null);
  const scaleAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const refreshAnimation = useSharedValue(0);

  const aiTips: AITip[] = [
    {
      id: '1',
      title: 'Perfect Your Form',
      content: 'Focus on controlled movements rather than speed. Quality over quantity leads to better results and prevents injuries.',
      category: 'form',
      icon: <Brain size={24} color="#00FF88" />,
      color: ['#00FF88', '#00CC6A'],
    },
    {
      id: '2',
      title: 'Stay Hydrated',
      content: 'Drink water before, during, and after your workout. Proper hydration improves performance by up to 15%.',
      category: 'nutrition',
      icon: <Sparkles size={24} color="#3B82F6" />,
      color: ['#3B82F6', '#2563EB'],
    },
    {
      id: '3',
      title: 'Progressive Overload',
      content: 'Gradually increase intensity each week. Small consistent improvements lead to massive long-term gains.',
      category: 'technique',
      icon: <Lightbulb size={24} color="#F59E0B" />,
      color: ['#F59E0B', '#D97706'],
    },
    {
      id: '4',
      title: 'Recovery Matters',
      content: 'Your muscles grow during rest, not during workouts. Ensure 7-9 hours of quality sleep for optimal recovery.',
      category: 'recovery',
      icon: <Brain size={24} color="#8B5CF6" />,
      color: ['#8B5CF6', '#7C3AED'],
    },
    {
      id: '5',
      title: 'Mind-Muscle Connection',
      content: 'Focus on feeling the target muscle working. This mental connection can increase muscle activation by 20%.',
      category: 'technique',
      icon: <Sparkles size={24} color="#EF4444" />,
      color: ['#EF4444', '#DC2626'],
    },
    {
      id: '6',
      title: 'Consistency Wins',
      content: `Amazing work on your ${userStats?.currentStreak || 0}-day streak! Consistency is the key to lasting transformation.`,
      category: 'motivation',
      icon: <Lightbulb size={24} color="#10B981" />,
      color: ['#10B981', '#059669'],
    },
  ];

  const getPersonalizedTip = (): AITip => {
    if (!userStats) return aiTips[0];

    // Personalize tips based on user stats
    if (userStats.currentStreak >= 7) {
      return {
        ...aiTips[5],
        content: `Incredible ${userStats.currentStreak}-day streak! You're building unstoppable momentum. Keep this energy flowing!`,
      };
    }

    if (userStats.totalWorkouts < 5) {
      return {
        ...aiTips[0],
        content: 'You\'re just getting started! Focus on learning proper form now to build a strong foundation for your fitness journey.',
      };
    }

    if (userStats.level >= 5) {
      return {
        ...aiTips[2],
        content: `Level ${userStats.level} achieved! Time to challenge yourself with progressive overload. Increase intensity by 5-10% each week.`,
      };
    }

    // Random tip for variety
    return aiTips[Math.floor(Math.random() * aiTips.length)];
  };

  useEffect(() => {
    const tip = getPersonalizedTip();
    setCurrentTip(tip);

    // Entrance animation
    scaleAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });

    // Glow animation
    glowAnimation.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0.6, { duration: 1000 })
    );
  }, [userStats]);

  const handleRefresh = () => {
    refreshAnimation.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    setTimeout(() => {
      const newTip = aiTips[Math.floor(Math.random() * aiTips.length)];
      setCurrentTip(newTip);
      onRefresh?.();
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale = scaleAnimation.value;
    return { transform: [{ scale }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.4, 1]);
    return { opacity };
  });

  const refreshStyle = useAnimatedStyle(() => {
    const rotate = interpolate(refreshAnimation.value, [0, 1], [0, 360]);
    return { transform: [{ rotate: `${rotate}deg` }] };
  });

  if (!currentTip) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={20} style={styles.blur}>
        <LinearGradient
          colors={[
            `${currentTip.color[0]}20`,
            `${currentTip.color[1]}10`,
            'rgba(255, 255, 255, 0.05)'
          ]}
          style={styles.gradient}
        >
          {/* Glow Effect */}
          <Animated.View style={[styles.glowEffect, glowStyle]}>
            <LinearGradient
              colors={[`${currentTip.color[0]}40`, 'transparent']}
              style={styles.glow}
            />
          </Animated.View>

          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: `${currentTip.color[0]}20` }]}>
                {currentTip.icon}
              </View>
              <View style={styles.titleText}>
                <Text style={styles.category}>AI Tip • {currentTip.category.toUpperCase()}</Text>
                <Text style={styles.title}>{currentTip.title}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Animated.View style={refreshStyle}>
                <RefreshCw size={20} color="#9CA3AF" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <Text style={styles.content}>{currentTip.content}</Text>

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.dot, { backgroundColor: currentTip.color[0] }]} />
            <View style={[styles.dot, { backgroundColor: currentTip.color[1] }]} />
            <View style={[styles.dot, { backgroundColor: `${currentTip.color[0]}60` }]} />
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
    padding: 20,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  glow: {
    flex: 1,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleText: {
    flex: 1,
  },
  category: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 16,
  },
  decorativeElements: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
});