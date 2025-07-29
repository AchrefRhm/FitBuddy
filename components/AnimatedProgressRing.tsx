import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string[];
  label: string;
  value: string;
  icon: React.ReactNode;
  delay?: number;
}

export default function AnimatedProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  label,
  value,
  icon,
  delay = 0,
}: AnimatedProgressRingProps) {
  const animatedProgress = useSharedValue(0);
  const scaleAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Delayed entrance animation
    setTimeout(() => {
      scaleAnimation.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      
      animatedProgress.value = withTiming(progress, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);

    // Continuous glow effect
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      false
    );

    // Pulse effect for high progress
    if (progress > 0.8) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [progress, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = scaleAnimation.value;
    const pulse = progress > 0.8 ? pulseAnimation.value : 1;
    return {
      transform: [{ scale: scale * pulse }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.4, 1]);
    return { opacity };
  });

  const strokeDashoffset = useAnimatedStyle(() => {
    const offset = circumference - (animatedProgress.value * circumference);
    return {
      strokeDashoffset: offset,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        {/* Glow Effect */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={[`${color[0]}40`, `${color[1]}40`, 'transparent']}
            style={[styles.glow, { width: size + 20, height: size + 20 }]}
          />
        </Animated.View>

        {/* SVG Progress Ring */}
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color[0]} />
              <Stop offset="100%" stopColor={color[1]} />
            </SvgLinearGradient>
          </Defs>
          
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Animated.View style={[styles.iconContainer, glowStyle]}>
            {icon}
          </Animated.View>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    borderRadius: 1000,
    opacity: 0.6,
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
});