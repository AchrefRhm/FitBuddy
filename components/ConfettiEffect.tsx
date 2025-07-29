import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  colors?: string[];
  particleCount?: number;
  duration?: number;
}

export default function ConfettiEffect({
  trigger,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
  particleCount = 50,
  duration = 3000,
}: ConfettiEffectProps) {
  const particles = useRef<Particle[]>([]);
  const animationValue = useSharedValue(0);

  const createParticles = () => {
    particles.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: Math.random() * 3 + 2,
    }));
  };

  useEffect(() => {
    if (trigger) {
      createParticles();
      animationValue.value = 0;
      animationValue.value = withTiming(1, { duration });
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animationValue.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    };
  });

  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.particleContainer, animatedStyle]}>
        {particles.current.map((particle) => (
          <ParticleComponent
            key={particle.id}
            particle={particle}
            animationValue={animationValue}
          />
        ))}
      </Animated.View>
    </View>
  );
}

interface ParticleComponentProps {
  particle: Particle;
  animationValue: Animated.SharedValue<number>;
}

function ParticleComponent({ particle, animationValue }: ParticleComponentProps) {
  const particleStyle = useAnimatedStyle(() => {
    const progress = animationValue.value;
    const translateX = particle.x + particle.velocityX * progress * 100;
    const translateY = particle.y + particle.velocityY * progress * height * 1.2;
    const rotation = particle.rotation + progress * 720;
    const scale = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotation}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size,
        },
        particleStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particleContainer: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});