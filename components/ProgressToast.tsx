import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Flame, Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ProgressToastProps {
  visible: boolean;
  type: 'achievement' | 'level_up' | 'streak' | 'goal';
  title: string;
  message: string;
  onHide: () => void;
  duration?: number;
}

export const ProgressToast: React.FC<ProgressToastProps> = ({
  visible,
  type,
  title,
  message,
  onHide,
  duration = 4000,
}) => {
  const { theme } = useTheme();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });

      const timer = setTimeout(() => {
        translateY.value = withSpring(-200, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 }, () => {
          runOnJS(onHide)();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy size={24} color={theme.colors.warning} />;
      case 'level_up':
        return <Star size={24} color={theme.colors.accent} />;
      case 'streak':
        return <Flame size={24} color={theme.colors.error} />;
      case 'goal':
        return <Target size={24} color={theme.colors.primary} />;
      default:
        return <Trophy size={24} color={theme.colors.primary} />;
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'achievement':
        return ['#FFD93D', '#FF8C00'];
      case 'level_up':
        return ['#00FF88', '#00D4FF'];
      case 'streak':
        return ['#FF6B6B', '#FF8E53'];
      case 'goal':
        return ['#A78BFA', '#00D4FF'];
      default:
        return theme.colors.progressRing;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={[`${getGradientColors()[0]}20`, `${getGradientColors()[1]}10`]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
              </Text>
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {message}
              </Text>
            </View>
          </View>
          <LinearGradient
            colors={getGradientColors()}
            style={styles.progressBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 3,
    marginTop: 12,
    borderRadius: 1.5,
  },
});