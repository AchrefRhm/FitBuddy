import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Camera, Play, Pause, RotateCcw, Target, Zap, Trophy, TrendingUp, Activity, Timer, Flame, Star, Award, BarChart3, Settings, Volume2, VolumeX, Eye, EyeOff, AlertTriangle, CheckCircle, Wifi } from 'lucide-react-native';
import { PoseDetector, PoseData, FormAnalysis } from '@/components/PoseDetector';
import SymmetryHeatmap from '@/components/SymmetryHeatmap';
import { storageService, UserStats, WorkoutHistory } from '@/services/storage';

const { width, height } = Dimensions.get('window');

interface DetectorStats {
  sessionTime: number;
  repsCompleted: number;
  caloriesBurned: number;
  averageScore: number;
  bestScore: number;
  formIssues: number;
  imbalanceDetected: number;
  perfectReps: number;
}

interface RealTimeMetrics {
  heartRate: number;
  intensity: number;
  fatigue: number;
  focus: number;
  symmetryScore: number;
  stabilityIndex: number;
}

interface ImbalanceAlert {
  type: 'warning' | 'critical' | 'good';
  message: string;
  timestamp: number;
  bodyPart: string;
}

export default function DetectorScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [exerciseType, setExerciseType] = useState('squat');
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [sessionStats, setSessionStats] = useState<DetectorStats>({
    sessionTime: 0,
    repsCompleted: 0,
    caloriesBurned: 0,
    averageScore: 0,
    bestScore: 0,
    formIssues: 0,
    imbalanceDetected: 0,
    perfectReps: 0,
  });
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    heartRate: 72,
    intensity: 0,
    fatigue: 0,
    focus: 100,
    symmetryScore: 100,
    stabilityIndex: 95,
  });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [imbalanceAlerts, setImbalanceAlerts] = useState<ImbalanceAlert[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  const detector = useRef(PoseDetector.getInstance()).current;
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionInterval = useRef<NodeJS.Timeout | null>(null);

  // Enhanced Animations with fixed Easing
  const masterPulse = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const repCountScale = useSharedValue(1);
  const cameraScale = useSharedValue(1);
  const feedbackOpacity = useSharedValue(0);
  const metricsRotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const alertPulse = useSharedValue(0);
  const symmetryWave = useSharedValue(0);
  const connectionPulse = useSharedValue(0);
  const perfectRepGlow = useSharedValue(0);

  const exerciseTypes = [
    { id: 'squat', name: 'Squats', icon: '🏋️', color: '#3B82F6', description: 'Lower body balance' },
    { id: 'lunge', name: 'Lunges', icon: '🦵', color: '#10B981', description: 'Unilateral strength' },
    { id: 'pushup', name: 'Push-ups', icon: '💪', color: '#F59E0B', description: 'Upper body alignment' },
    { id: 'plank', name: 'Plank', icon: '🧘', color: '#8B5CF6', description: 'Core stability' },
    { id: 'deadlift', name: 'Deadlift', icon: '⚡', color: '#EF4444', description: 'Full body symmetry' },
  ];

  useEffect(() => {
    loadUserStats();
    initializeAdvancedAnimations();
    
    return () => {
      if (analysisInterval.current) clearInterval(analysisInterval.current);
      if (sessionInterval.current) clearInterval(sessionInterval.current);
    };
  }, []);

  const loadUserStats = async () => {
    const stats = await storageService.getUserStats();
    setUserStats(stats);
  };

  const initializeAdvancedAnimations = () => {
    // Master pulse for synchronized elements
    masterPulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Continuous metrics rotation
    metricsRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow effect for perfect form
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Symmetry wave animation
    symmetryWave.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Connection status pulse
    connectionPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }),
        withTiming(0.7, { duration: 1000, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Perfect rep celebration glow
    perfectRepGlow.value = 0;
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS !== 'web') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }
  };

  const addImbalanceAlert = (type: ImbalanceAlert['type'], message: string, bodyPart: string) => {
    const alert: ImbalanceAlert = {
      type,
      message,
      timestamp: Date.now(),
      bodyPart,
    };
    
    setImbalanceAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts
    
    if (type === 'critical') {
      triggerHapticFeedback('heavy');
      alertPulse.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
    } else if (type === 'warning') {
      triggerHapticFeedback('medium');
    }
  };

  const startAnalysis = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    setIsAnalyzing(true);
    setSessionStartTime(Date.now());
    setImbalanceAlerts([]);
    detector.startAnalysis();
    triggerHapticFeedback('medium');

    // Connection animation
    setIsConnected(true);
    connectionPulse.value = withTiming(1, { duration: 500 });

    // Start session timer
    sessionInterval.current = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        sessionTime: prev.sessionTime + 1,
      }));
    }, 1000);

    // Start advanced pose analysis
    analysisInterval.current = setInterval(() => {
      const data = detector.analyzeFrame(exerciseType);
      setPoseData(data);
      updateRealTimeMetrics(data);
      analyzeImbalances(data);
      
      // Animate feedback
      feedbackOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.8, { duration: 800 })
      );

      // Score animation with enhanced effects
      if (data.score > sessionStats.bestScore) {
        scoreScale.value = withSequence(
          withTiming(1.4, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) })
        );
        triggerHapticFeedback('heavy');
        
        // Perfect rep celebration
        if (data.score >= 95) {
          perfectRepGlow.value = withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 700 })
          );
        }
      }

      // Update session stats with enhanced tracking
      setSessionStats(prev => {
        const newAverage = prev.averageScore === 0 
          ? data.score 
          : (prev.averageScore * 0.9) + (data.score * 0.1); // Weighted average
        
        const newStats = {
          ...prev,
          averageScore: newAverage,
          bestScore: Math.max(prev.bestScore, data.score),
          caloriesBurned: prev.caloriesBurned + (0.08 + (data.score / 1000)), // Score-based calorie calculation
        };

        if (data.formAnalysis.commonMistakes.length > 0) {
          newStats.formIssues += 1;
        }

        if (data.score >= 95) {
          newStats.perfectReps += 1;
        }

        return newStats;
      });

      // Enhanced rep detection with form validation
      const prevKeypoints = poseData?.keypoints || [];
      if (detector.detectRep(exerciseType, prevKeypoints, data.keypoints)) {
        setSessionStats(prev => ({ ...prev, repsCompleted: prev.repsCompleted + 1 }));
        repCountScale.value = withSequence(
          withTiming(1.6, { duration: 150, easing: Easing.out(Easing.back(2)) }),
          withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) })
        );
        triggerHapticFeedback('heavy');
        
        // Add positive feedback for good reps
        if (data.score >= 85) {
          addImbalanceAlert('good', 'Perfect rep! Great form!', 'overall');
        }
      }
    }, 80); // Faster analysis for smoother experience

    // Camera pulse effect
    cameraScale.value = withRepeat(
      withSequence(
        withTiming(1.01, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  };

  const stopAnalysis = async () => {
    setIsAnalyzing(false);
    detector.stopAnalysis();
    
    if (analysisInterval.current) clearInterval(analysisInterval.current);
    if (sessionInterval.current) clearInterval(sessionInterval.current);

    // Save enhanced workout data
    if (sessionStats.repsCompleted > 0 && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const workout: Omit<WorkoutHistory, 'id' | 'completedAt' | 'minutes'> = {
        videoId: `detector_${exerciseType}`,
        title: `AI ${exerciseTypes.find(e => e.id === exerciseType)?.name} Analysis`,
        duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
        calories: Math.round(sessionStats.caloriesBurned),
        category: 'AI Imbalance Detection',
        difficulty: sessionStats.averageScore >= 90 ? 'Expert' : sessionStats.averageScore >= 80 ? 'Advanced' : sessionStats.averageScore >= 70 ? 'Intermediate' : 'Beginner',
      };

      await storageService.addWorkoutToHistory(workout);
      const updatedStats = await storageService.incrementWorkout(
        Math.round(sessionStats.caloriesBurned),
        Math.floor(duration / 60)
      );
      setUserStats(updatedStats);

      // Enhanced completion feedback
      const perfectPercentage = Math.round((sessionStats.perfectReps / sessionStats.repsCompleted) * 100);
      Alert.alert(
        '🎉 Analysis Complete!',
        `Outstanding session! ${sessionStats.repsCompleted} reps completed\n` +
        `Average Form Score: ${Math.round(sessionStats.averageScore)}%\n` +
        `Perfect Reps: ${perfectPercentage}%\n` +
        `Imbalances Detected: ${sessionStats.imbalanceDetected}\n` +
        `Calories Burned: ${Math.round(sessionStats.caloriesBurned)}`,
        [{ text: 'Amazing!', onPress: () => triggerHapticFeedback('heavy') }]
      );
    }

    // Reset animations smoothly
    cameraScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    feedbackOpacity.value = withTiming(0, { duration: 300 });
    connectionPulse.value = withTiming(0.5, { duration: 300 });
    
    triggerHapticFeedback('medium');
  };

  const analyzeImbalances = (data: PoseData) => {
    const { bodyAlignment, movementQuality } = data.formAnalysis;
    
    // Shoulder imbalance detection
    if (Math.abs(bodyAlignment.shoulders - 100) > 15) {
      if (Math.random() > 0.95) { // Occasional alerts to avoid spam
        addImbalanceAlert(
          bodyAlignment.shoulders < 70 ? 'critical' : 'warning',
          `Shoulder imbalance detected - ${bodyAlignment.shoulders < 50 ? 'left' : 'right'} side dropping`,
          'shoulders'
        );
        setSessionStats(prev => ({ ...prev, imbalanceDetected: prev.imbalanceDetected + 1 }));
      }
    }

    // Hip alignment issues
    if (bodyAlignment.hips < 75) {
      if (Math.random() > 0.97) {
        addImbalanceAlert(
          'warning',
          'Hip alignment needs attention - maintain level pelvis',
          'hips'
        );
      }
    }

    // Knee tracking problems
    if (bodyAlignment.knees < 70) {
      if (Math.random() > 0.96) {
        addImbalanceAlert(
          'critical',
          'Knee valgus detected - push knees out',
          'knees'
        );
        setSessionStats(prev => ({ ...prev, imbalanceDetected: prev.imbalanceDetected + 1 }));
      }
    }

    // Stability issues
    if (movementQuality.stability < 75) {
      if (Math.random() > 0.98) {
        addImbalanceAlert(
          'warning',
          'Stability compromised - engage core',
          'core'
        );
      }
    }

    // Positive reinforcement for good form
    if (data.score >= 95 && Math.random() > 0.92) {
      addImbalanceAlert('good', 'Excellent symmetry! Perfect balance!', 'overall');
    }
  };

  const updateRealTimeMetrics = (data: PoseData) => {
    setRealTimeMetrics(prev => {
      const intensity = Math.max(0, Math.min(100, data.score * 0.7 + Math.random() * 30));
      const fatigue = Math.max(0, Math.min(100, prev.fatigue + (sessionStats.sessionTime > 300 ? 0.05 : 0)));
      
      return {
        heartRate: Math.max(65, Math.min(180, prev.heartRate + (Math.random() - 0.5) * 3 + (intensity > 80 ? 2 : 0))),
        intensity,
        fatigue,
        focus: Math.max(75, Math.min(100, data.score * 0.85 + Math.random() * 15)),
        symmetryScore: (data.formAnalysis.bodyAlignment.shoulders + data.formAnalysis.bodyAlignment.hips) / 2,
        stabilityIndex: data.formAnalysis.movementQuality.stability,
      };
    });
  };

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    triggerHapticFeedback('light');
    
    // Camera flip animation
    cameraScale.value = withSequence(
      withTiming(0.8, { duration: 150 }),
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 150 })
    );
  };

  const resetSession = () => {
    setSessionStats({
      sessionTime: 0,
      repsCompleted: 0,
      caloriesBurned: 0,
      averageScore: 0,
      bestScore: 0,
      formIssues: 0,
      imbalanceDetected: 0,
      perfectReps: 0,
    });
    setPoseData(null);
    setImbalanceAlerts([]);
    triggerHapticFeedback('medium');
    
    // Reset animation
    scoreScale.value = withTiming(1, { duration: 300 });
    repCountScale.value = withTiming(1, { duration: 300 });
  };

  // Enhanced Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(masterPulse.value, [0, 1], [0.98, 1.02]) }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    shadowOpacity: interpolate(scoreScale.value, [1, 1.4], [0.3, 0.8]),
  }));

  const repStyle = useAnimatedStyle(() => ({
    transform: [{ scale: repCountScale.value }],
  }));

  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ translateY: interpolate(feedbackOpacity.value, [0, 1], [10, 0]) }],
  }));

  const metricsStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${metricsRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowIntensity.value * 0.6,
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [8, 20]),
  }));

  const alertStyle = useAnimatedStyle(() => ({
    opacity: interpolate(alertPulse.value, [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(alertPulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  const symmetryStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateX: interpolate(symmetryWave.value, [0, 1], [-2, 2]) 
    }],
  }));

  const connectionStyle = useAnimatedStyle(() => ({
    opacity: connectionPulse.value,
    transform: [{ scale: interpolate(connectionPulse.value, [0.7, 1], [0.9, 1]) }],
  }));

  const perfectRepStyle = useAnimatedStyle(() => ({
    opacity: perfectRepGlow.value,
    transform: [{ scale: interpolate(perfectRepGlow.value, [0, 1], [0.8, 1.2]) }],
  }));

  const getScoreColor = (score: number) => {
    if (score >= 95) return '#10B981'; // Emerald
    if (score >= 90) return '#3B82F6'; // Blue
    if (score >= 80) return '#8B5CF6'; // Purple
    if (score >= 70) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getAlertColor = (type: ImbalanceAlert['type']) => {
    switch (type) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'good': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.permissionGradient}>
          <Animated.View style={pulseStyle}>
            <Camera size={80} color="#3B82F6" />
          </Animated.View>
          <Text style={styles.permissionTitle}>AI Imbalance Detector</Text>
          <Text style={styles.permissionSubtitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Enable camera access to unlock advanced pose analysis and real-time imbalance detection.
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.permissionGradient}>
          <Animated.View style={pulseStyle}>
            <Camera size={80} color="#3B82F6" />
          </Animated.View>
          <Text style={styles.permissionTitle}>FitBuddy AI Ready</Text>
          <Text style={styles.permissionText}>
            Grant camera permission to start detecting imbalances and perfecting your form with AI-powered analysis.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.buttonGradient}>
              <Text style={styles.permissionButtonText}>Enable AI Detection</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.background}>
        
        {/* Enhanced Header with Connection Status */}
        <View style={styles.headerContainer}>
          <View style={styles.headerStats}>
            <Animated.View style={[styles.statCard, pulseStyle]}>
              <Text style={styles.statValue}>{userStats?.level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </Animated.View>
            <Animated.View style={[styles.statCard, pulseStyle]}>
              <Text style={styles.statValue}>{userStats?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </Animated.View>
            <Animated.View style={[styles.statCard, pulseStyle]}>
              <Text style={styles.statValue}>{userStats?.totalWorkouts || 0}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </Animated.View>
          </View>
          
          {/* AI Connection Status */}
          <Animated.View style={[styles.connectionStatus, connectionStyle]}>
            <Wifi size={16} color={isConnected ? '#10B981' : '#EF4444'} />
            <Text style={[styles.connectionText, { color: isConnected ? '#10B981' : '#EF4444' }]}>
              AI {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </Animated.View>
        </View>

        {/* Exercise Type Selector with Enhanced Design */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.exerciseSelector}
          contentContainerStyle={styles.exerciseSelectorContent}
        >
          {exerciseTypes.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseCard,
                exerciseType === exercise.id && styles.exerciseCardActive
              ]}
              onPress={() => {
                setExerciseType(exercise.id);
                triggerHapticFeedback('light');
              }}
            >
              <LinearGradient
                colors={exerciseType === exercise.id 
                  ? [exercise.color, exercise.color + '80'] 
                  : ['#374151', '#4B5563']
                }
                style={styles.exerciseCardGradient}
              >
                <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
                <Text style={[
                  styles.exerciseName,
                  exerciseType === exercise.id && styles.exerciseNameActive
                ]}>
                  {exercise.name}
                </Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Enhanced Camera View with AI Overlay */}
        <Animated.View style={[styles.cameraContainer, cameraStyle, glowStyle]}>
          <CameraView style={styles.camera} facing={facing}>
            
            {/* Advanced Pose Overlay with Symmetry Lines */}
            {poseData && isAnalyzing && (
              <View style={styles.poseOverlay}>
                {/* Keypoints */}
                {poseData.keypoints.map((keypoint, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.keypoint,
                      {
                        left: keypoint.x - 6,
                        top: keypoint.y - 6,
                        backgroundColor: getScoreColor(keypoint.confidence * 100),
                      },
                      pulseStyle,
                    ]}
                  />
                ))}
                
                {/* Symmetry Grid */}
                <View style={styles.symmetryGrid}>
                  <View style={styles.centerLine} />
                  <View style={styles.horizontalLine} />
                </View>
                
                {/* Perfect Rep Celebration */}
                <Animated.View style={[styles.perfectRepOverlay, perfectRepStyle]}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.8)', 'rgba(5, 150, 105, 0.8)']}
                    style={styles.perfectRepContainer}
                  >
                    <CheckCircle size={40} color="#FFFFFF" />
                    <Text style={styles.perfectRepText}>PERFECT REP!</Text>
                  </LinearGradient>
                </Animated.View>
              </View>
            )}

            {/* Enhanced Real-time Score with Trend */}
            {poseData && isAnalyzing && (
              <Animated.View style={[styles.scoreOverlay, scoreStyle]}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']}
                  style={styles.scoreContainer}
                >
                  <Text style={[styles.scoreText, { color: getScoreColor(poseData.score) }]}>
                    {Math.round(poseData.score)}%
                  </Text>
                  <Text style={styles.scoreLabel}>Form Score</Text>
                  <View style={styles.scoreTrend}>
                    <TrendingUp size={12} color={poseData.score > 85 ? '#10B981' : '#F59E0B'} />
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Enhanced Rep Counter with Perfect Rep Indicator */}
            <Animated.View style={[styles.repCounter, repStyle]}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.9)', 'rgba(29, 78, 216, 0.9)']}
                style={styles.repContainer}
              >
                <Text style={styles.repCount}>{sessionStats.repsCompleted}</Text>
                <Text style={styles.repLabel}>Reps</Text>
                {sessionStats.perfectReps > 0 && (
                  <View style={styles.perfectRepBadge}>
                    <Star size={12} color="#FFD700" />
                    <Text style={styles.perfectRepCount}>{sessionStats.perfectReps}</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Enhanced Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
                <BlurView intensity={80} style={styles.controlButtonBlur}>
                  <RotateCcw size={24} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => {
                  setShowHeatmap(!showHeatmap);
                  triggerHapticFeedback('light');
                }}
              >
                <BlurView intensity={80} style={styles.controlButtonBlur}>
                  {showHeatmap ? <EyeOff size={24} color="#FFFFFF" /> : <Eye size={24} color="#FFFFFF" />}
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => {
                  setSoundEnabled(!soundEnabled);
                  triggerHapticFeedback('light');
                }}
              >
                <BlurView intensity={80} style={styles.controlButtonBlur}>
                  {soundEnabled ? <Volume2 size={24} color="#FFFFFF" /> : <VolumeX size={24} color="#FFFFFF" />}
                </BlurView>
              </TouchableOpacity>
            </View>
          </CameraView>
        </Animated.View>

        {/* Enhanced Real-time Feedback with Imbalance Alerts */}
        {poseData && isAnalyzing && (
          <Animated.View style={[styles.feedbackContainer, feedbackStyle]}>
            <BlurView intensity={90} style={styles.feedbackBlur}>
              <Text style={styles.feedbackText}>{poseData.feedback}</Text>
              {poseData.formAnalysis.commonMistakes.length > 0 && (
                <Text style={styles.mistakeText}>
                  💡 {poseData.formAnalysis.commonMistakes[0]}
                </Text>
              )}
              
              {/* Symmetry Score */}
              <Animated.View style={[styles.symmetryIndicator, symmetryStyle]}>
                <Text style={styles.symmetryLabel}>Symmetry</Text>
                <Text style={[styles.symmetryScore, { color: getScoreColor(realTimeMetrics.symmetryScore) }]}>
                  {Math.round(realTimeMetrics.symmetryScore)}%
                </Text>
              </Animated.View>
            </BlurView>
          </Animated.View>
        )}

        {/* Imbalance Alerts Panel */}
        {imbalanceAlerts.length > 0 && isAnalyzing && (
          <Animated.View style={[styles.alertsContainer, alertStyle]}>
            <BlurView intensity={95} style={styles.alertsBlur}>
              <Text style={styles.alertsTitle}>⚡ Live Imbalance Detection</Text>
              {imbalanceAlerts.slice(0, 3).map((alert, index) => (
                <Animated.View key={alert.timestamp} style={[styles.alertItem, { opacity: 1 - (index * 0.2) }]}>
                  <View style={[styles.alertIndicator, { backgroundColor: getAlertColor(alert.type) }]} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertBodyPart}>{alert.bodyPart}</Text>
                  </View>
                  {alert.type === 'critical' && <AlertTriangle size={16} color="#EF4444" />}
                  {alert.type === 'good' && <CheckCircle size={16} color="#10B981" />}
                </Animated.View>
              ))}
            </BlurView>
          </Animated.View>
        )}

        {/* Enhanced Real-time Metrics */}
        {isAnalyzing && (
          <View style={styles.metricsContainer}>
            <Animated.View style={[styles.metricCard, metricsStyle]}>
              <Activity size={16} color="#EF4444" />
              <Text style={styles.metricValue}>{Math.round(realTimeMetrics.heartRate)}</Text>
              <Text style={styles.metricLabel}>BPM</Text>
            </Animated.View>
            
            <Animated.View style={[styles.metricCard, pulseStyle]}>
              <Zap size={16} color="#F59E0B" />
              <Text style={styles.metricValue}>{Math.round(realTimeMetrics.intensity)}%</Text>
              <Text style={styles.metricLabel}>Intensity</Text>
            </Animated.View>
            
            <Animated.View style={[styles.metricCard, pulseStyle]}>
              <Target size={16} color="#10B981" />
              <Text style={styles.metricValue}>{Math.round(realTimeMetrics.stabilityIndex)}%</Text>
              <Text style={styles.metricLabel}>Stability</Text>
            </Animated.View>
            
            <Animated.View style={[styles.metricCard, symmetryStyle]}>
              <Trophy size={16} color="#8B5CF6" />
              <Text style={styles.metricValue}>{Math.round(realTimeMetrics.focus)}%</Text>
              <Text style={styles.metricLabel}>Focus</Text>
            </Animated.View>
          </View>
        )}

        {/* Enhanced Session Stats */}
        <View style={styles.sessionStats}>
          <View style={styles.sessionStatCard}>
            <Timer size={20} color="#3B82F6" />
            <Text style={styles.sessionStatValue}>{formatTime(sessionStats.sessionTime)}</Text>
            <Text style={styles.sessionStatLabel}>Time</Text>
          </View>
          
          <View style={styles.sessionStatCard}>
            <Flame size={20} color="#EF4444" />
            <Text style={styles.sessionStatValue}>{Math.round(sessionStats.caloriesBurned)}</Text>
            <Text style={styles.sessionStatLabel}>Calories</Text>
          </View>
          
          <View style={styles.sessionStatCard}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.sessionStatValue}>{Math.round(sessionStats.averageScore)}%</Text>
            <Text style={styles.sessionStatLabel}>Avg Score</Text>
          </View>
          
          <View style={styles.sessionStatCard}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.sessionStatValue}>{sessionStats.imbalanceDetected}</Text>
            <Text style={styles.sessionStatLabel}>Imbalances</Text>
          </View>
        </View>

        {/* Enhanced Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.resetButton]}
            onPress={resetSession}
          >
            <LinearGradient colors={['#6B7280', '#4B5563']} style={styles.buttonGradient}>
              <RotateCcw size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Reset</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.mainButton]}
            onPress={isAnalyzing ? stopAnalysis : startAnalysis}
          >
            <LinearGradient
              colors={isAnalyzing ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
              style={styles.buttonGradient}
            >
              {isAnalyzing ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" />
              )}
              <Text style={styles.mainButtonText}>
                {isAnalyzing ? 'Stop' : 'Start'} AI Analysis
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.metricsButton]}
            onPress={() => {
              setShowAdvancedMetrics(!showAdvancedMetrics);
              triggerHapticFeedback('light');
            }}
          >
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
              <BarChart3 size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Advanced Metrics Panel with Enhanced Data */}
        {showAdvancedMetrics && poseData && (
          <Animated.View style={[styles.advancedMetrics, pulseStyle]}>
            <BlurView intensity={95} style={styles.advancedMetricsBlur}>
              <Text style={styles.advancedTitle}>🧠 AI Biomechanics Analysis</Text>
              
              <View style={styles.formAnalysisGrid}>
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisLabel}>Shoulders</Text>
                  <Text style={[styles.analysisValue, { color: getScoreColor(poseData.formAnalysis.bodyAlignment.shoulders) }]}>
                    {Math.round(poseData.formAnalysis.bodyAlignment.shoulders)}%
                  </Text>
                  <Text style={styles.analysisSubtext}>Alignment</Text>
                </View>
                
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisLabel}>Hips</Text>
                  <Text style={[styles.analysisValue, { color: getScoreColor(poseData.formAnalysis.bodyAlignment.hips) }]}>
                    {Math.round(poseData.formAnalysis.bodyAlignment.hips)}%
                  </Text>
                  <Text style={styles.analysisSubtext}>Level</Text>
                </View>
                
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisLabel}>Knees</Text>
                  <Text style={[styles.analysisValue, { color: getScoreColor(poseData.formAnalysis.bodyAlignment.knees) }]}>
                    {Math.round(poseData.formAnalysis.bodyAlignment.knees)}%
                  </Text>
                  <Text style={styles.analysisSubtext}>Tracking</Text>
                </View>
                
                <View style={styles.analysisCard}>
                  <Text style={styles.analysisLabel}>Stability</Text>
                  <Text style={[styles.analysisValue, { color: getScoreColor(poseData.formAnalysis.movementQuality.stability) }]}>
                    {Math.round(poseData.formAnalysis.movementQuality.stability)}%
                  </Text>
                  <Text style={styles.analysisSubtext}>Core</Text>
                </View>
              </View>

              {/* Movement Quality Indicators */}
              <View style={styles.qualityIndicators}>
                <Text style={styles.qualityTitle}>Movement Quality</Text>
                <View style={styles.qualityBars}>
                  <View style={styles.qualityBar}>
                    <Text style={styles.qualityLabel}>Range</Text>
                    <View style={styles.qualityBarContainer}>
                      <View 
                        style={[
                          styles.qualityBarFill, 
                          { 
                            width: `${poseData.formAnalysis.movementQuality.range}%`,
                            backgroundColor: getScoreColor(poseData.formAnalysis.movementQuality.range)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.qualityBar}>
                    <Text style={styles.qualityLabel}>Tempo</Text>
                    <View style={styles.qualityBarContainer}>
                      <View 
                        style={[
                          styles.qualityBarFill, 
                          { 
                            width: `${poseData.formAnalysis.movementQuality.tempo}%`,
                            backgroundColor: getScoreColor(poseData.formAnalysis.movementQuality.tempo)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.qualityBar}>
                    <Text style={styles.qualityLabel}>Symmetry</Text>
                    <View style={styles.qualityBarContainer}>
                      <View 
                        style={[
                          styles.qualityBarFill, 
                          { 
                            width: `${poseData.formAnalysis.movementQuality.symmetry}%`,
                            backgroundColor: getScoreColor(poseData.formAnalysis.movementQuality.symmetry)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </View>

              {poseData.formAnalysis.improvements.length > 0 && (
                <View style={styles.improvementsContainer}>
                  <Text style={styles.improvementsTitle}>🎯 AI Coaching Tips</Text>
                  {poseData.formAnalysis.improvements.map((improvement, index) => (
                    <Text key={index} style={styles.improvementText}>
                      • {improvement}
                    </Text>
                  ))}
                </View>
              )}
            </BlurView>
          </Animated.View>
        )}

        {/* Enhanced Symmetry Heatmap */}
        {poseData && (
          <SymmetryHeatmap
            data={{
              shoulders: poseData.formAnalysis.bodyAlignment.shoulders,
              upperBack: poseData.formAnalysis.movementQuality.stability,
              lowerBack: poseData.formAnalysis.bodyAlignment.hips,
              hips: poseData.formAnalysis.bodyAlignment.hips,
              leftThigh: poseData.formAnalysis.bodyAlignment.knees + (Math.random() - 0.5) * 10,
              rightThigh: poseData.formAnalysis.bodyAlignment.knees + (Math.random() - 0.5) * 10,
              leftKnee: poseData.formAnalysis.bodyAlignment.knees,
              rightKnee: poseData.formAnalysis.bodyAlignment.knees + (Math.random() - 0.5) * 8,
              leftCalf: poseData.formAnalysis.bodyAlignment.ankles,
              rightCalf: poseData.formAnalysis.bodyAlignment.ankles + (Math.random() - 0.5) * 6,
            }}
            isVisible={showHeatmap && isAnalyzing}
          />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  permissionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exerciseSelectorContent: {
    gap: 12,
  },
  exerciseCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  exerciseCardActive: {
    transform: [{ scale: 1.05 }],
  },
  exerciseCardGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  exerciseIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  exerciseNameActive: {
    color: '#FFFFFF',
  },
  exerciseDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  cameraContainer: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    height: height * 0.35,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  camera: {
    flex: 1,
    position: 'relative',
  },
  poseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keypoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  symmetryGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    marginLeft: -0.5,
  },
  horizontalLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginTop: -0.5,
  },
  perfectRepOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -80,
  },
  perfectRepContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: 160,
  },
  perfectRepText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
  },
  scoreOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  scoreContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '600',
  },
  scoreTrend: {
    marginTop: 4,
  },
  repCounter: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  repContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  repCount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  repLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '600',
  },
  perfectRepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  perfectRepCount: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  controlButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlButtonBlur: {
    padding: 12,
  },
  feedbackContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  feedbackBlur: {
    padding: 20,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  mistakeText: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  symmetryIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  symmetryLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  symmetryScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  alertsContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  alertsBlur: {
    padding: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingVertical: 8,
  },
  alertIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertBodyPart: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sessionStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sessionStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  sessionStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  resetButton: {
    flex: 0.8,
  },
  mainButton: {
    flex: 1.4,
  },
  metricsButton: {
    flex: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  advancedMetrics: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: height * 0.6,
  },
  advancedMetricsBlur: {
    padding: 20,
  },
  advancedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  formAnalysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  analysisLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  analysisSubtext: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  qualityIndicators: {
    marginBottom: 16,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  qualityBars: {
    gap: 8,
  },
  qualityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualityLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    width: 60,
  },
  qualityBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  improvementsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  improvementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  improvementText: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 4,
    fontWeight: '500',
  },
});