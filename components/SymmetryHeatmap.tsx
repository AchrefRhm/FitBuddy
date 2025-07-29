import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface HeatmapData {
  shoulders: number;
  upperBack: number;
  lowerBack: number;
  hips: number;
  leftThigh: number;
  rightThigh: number;
  leftKnee: number;
  rightKnee: number;
  leftCalf: number;
  rightCalf: number;
}

interface SymmetryHeatmapProps {
  data: HeatmapData;
  isVisible: boolean;
}

export default function SymmetryHeatmap({ data, isVisible }: SymmetryHeatmapProps) {
  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    fadeAnim.value = withTiming(isVisible ? 1 : 0, { duration: 300 });
  }, [isVisible]);

  const getHeatColor = (value: number) => {
    // Convert symmetry score to heat color
    if (value >= 90) return ['#10B981', '#059669']; // Green - excellent
    if (value >= 80) return ['#3B82F6', '#1D4ED8']; // Blue - good
    if (value >= 70) return ['#F59E0B', '#D97706']; // Orange - fair
    return ['#EF4444', '#DC2626']; // Red - needs work
  };

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: interpolate(fadeAnim.value, [0, 1], [0.9, 1]) }],
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
        style={styles.background}
      >
        <Text style={styles.title}>Symmetry Heatmap</Text>
        <Text style={styles.subtitle}>Real-time imbalance visualization</Text>
        
        <View style={styles.bodyContainer}>
          {/* Head */}
          <View style={styles.head} />
          
          {/* Shoulders */}
          <View style={styles.shouldersContainer}>
            <LinearGradient
              colors={getHeatColor(data.shoulders)}
              style={styles.shoulders}
            >
              <Text style={styles.scoreText}>{Math.round(data.shoulders)}%</Text>
            </LinearGradient>
          </View>
          
          {/* Upper Back */}
          <View style={styles.upperBackContainer}>
            <LinearGradient
              colors={getHeatColor(data.upperBack)}
              style={styles.upperBack}
            >
              <Text style={styles.scoreText}>{Math.round(data.upperBack)}%</Text>
            </LinearGradient>
          </View>
          
          {/* Lower Back */}
          <View style={styles.lowerBackContainer}>
            <LinearGradient
              colors={getHeatColor(data.lowerBack)}
              style={styles.lowerBack}
            >
              <Text style={styles.scoreText}>{Math.round(data.lowerBack)}%</Text>
            </LinearGradient>
          </View>
          
          {/* Hips */}
          <View style={styles.hipsContainer}>
            <LinearGradient
              colors={getHeatColor(data.hips)}
              style={styles.hips}
            >
              <Text style={styles.scoreText}>{Math.round(data.hips)}%</Text>
            </LinearGradient>
          </View>
          
          {/* Thighs */}
          <View style={styles.thighsContainer}>
            <LinearGradient
              colors={getHeatColor(data.leftThigh)}
              style={styles.leftThigh}
            >
              <Text style={styles.scoreText}>{Math.round(data.leftThigh)}%</Text>
            </LinearGradient>
            <LinearGradient
              colors={getHeatColor(data.rightThigh)}
              style={styles.rightThigh}
            >
              <Text style={styles.scoreText}>{Math.round(data.rightThigh)}%</Text>
            </LinearGradient>
          </View>
          
          {/* Knees */}
          <View style={styles.kneesContainer}>
            <LinearGradient
              colors={getHeatColor(data.leftKnee)}
              style={styles.leftKnee}
            >
              <Text style={styles.scoreText}>{Math.round(data.leftKnee)}%</Text>
            </LinearGradient>
            <LinearGradient
              colors={getHeatColor(data.rightKnee)}
              style={styles.rightKnee}
            >
              <Text style={styles.scoreText}>{Math.round(data.rightKnee)}%</Text>
            </LinearGradient>
          </View>
          
          {/* Calves */}
          <View style={styles.calvesContainer}>
            <LinearGradient
              colors={getHeatColor(data.leftCalf)}
              style={styles.leftCalf}
            >
              <Text style={styles.scoreText}>{Math.round(data.leftCalf)}%</Text>
            </LinearGradient>
            <LinearGradient
              colors={getHeatColor(data.rightCalf)}
              style={styles.rightCalf}
            >
              <Text style={styles.scoreText}>{Math.round(data.rightCalf)}%</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Symmetry Score</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>90-100% Excellent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>80-89% Good</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>70-79% Fair</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Below 70% Needs Work</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 200,
    right: 20,
    width: 180,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 20,
  },
  background: {
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  bodyContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  head: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  shouldersContainer: {
    marginBottom: 4,
  },
  shoulders: {
    width: 50,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upperBackContainer: {
    marginBottom: 4,
  },
  upperBack: {
    width: 40,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowerBackContainer: {
    marginBottom: 4,
  },
  lowerBack: {
    width: 35,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hipsContainer: {
    marginBottom: 4,
  },
  hips: {
    width: 45,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thighsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  leftThigh: {
    width: 16,
    height: 25,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightThigh: {
    width: 16,
    height: 25,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kneesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  leftKnee: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightKnee: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calvesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  leftCalf: {
    width: 12,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCalf: {
    width: 12,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  legend: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  legendItems: {
    gap: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '500',
  },
});