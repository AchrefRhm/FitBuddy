import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Play, Pause, RotateCcw, Target, Clock, Flame, Activity, Eye, Mic, Camera, Dumbbell, Timer, Zap, Award, TrendingUp, Heart, Shield, CircleCheck as CheckCircle, ArrowRight, Sparkles, Volume2, VolumeX, Droplets, Star, Trophy, SkipForward, Settings, Info, User, Calendar } from 'lucide-react-native';
import { storageService } from '@/services/storage';

const { width, height } = Dimensions.get('window');

interface WorkoutExercise {
  id: string;
  name: string;
  duration: number;
  reps?: string;
  sets?: number;
  restTime: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscles: string[];
  instructions: string[];
  aiFeatures: string[];
  formTips: string[];
  calories: number;
  preview3D: string;
}

const workoutData: WorkoutExercise[] = [
  {
    id: '1',
    name: 'AI-Guided Push-ups',
    duration: 45,
    reps: '8-12',
    sets: 3,
    restTime: 60,
    difficulty: 'Intermediate',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower body until chest nearly touches ground',
      'Push back up to starting position',
      'Keep core engaged throughout movement'
    ],
    aiFeatures: ['Real-time form analysis', 'Automatic rep counting', 'Posture corrections'],
    formTips: [
      'Keep your body in a straight line',
      'Don\'t let your hips sag',
      'Control the descent',
      'Push through your palms'
    ],
    calories: 8,
    preview3D: 'Push-up motion with proper form visualization'
  },
  {
    id: '2',
    name: 'Smart Squats',
    duration: 50,
    reps: '12-15',
    sets: 3,
    restTime: 45,
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower body as if sitting back into chair',
      'Keep knees behind toes',
      'Return to standing position'
    ],
    aiFeatures: ['Depth tracking', 'Knee alignment monitoring', 'Balance analysis'],
    formTips: [
      'Keep your chest up',
      'Weight on your heels',
      'Knees track over toes',
      'Full range of motion'
    ],
    calories: 10,
    preview3D: 'Squat movement with depth indicators'
  },
  {
    id: '3',
    name: 'Intelligent Plank Hold',
    duration: 60,
    reps: '30-60 sec',
    sets: 3,
    restTime: 60,
    difficulty: 'Intermediate',
    targetMuscles: ['Core', 'Shoulders', 'Back'],
    instructions: [
      'Start in forearm plank position',
      'Keep body in straight line',
      'Engage core muscles',
      'Hold position for specified time'
    ],
    aiFeatures: ['Spine alignment detection', 'Hip position monitoring', 'Core engagement analysis'],
    formTips: [
      'Engage your core',
      'Don\'t hold your breath',
      'Keep hips level',
      'Look down at the floor'
    ],
    calories: 6,
    preview3D: 'Plank position with alignment guides'
  },
  {
    id: '4',
    name: 'Dynamic Lunges',
    duration: 55,
    reps: '10 each leg',
    sets: 3,
    restTime: 45,
    difficulty: 'Intermediate',
    targetMuscles: ['Legs', 'Glutes', 'Core'],
    instructions: [
      'Step forward into lunge position',
      'Lower back knee toward ground',
      'Push back to starting position',
      'Alternate legs'
    ],
    aiFeatures: ['Step length optimization', 'Balance tracking', 'Knee safety monitoring'],
    formTips: [
      'Keep front knee over ankle',
      'Lower back knee straight down',
      'Maintain upright torso',
      'Push through front heel'
    ],
    calories: 9,
    preview3D: 'Lunge movement with balance indicators'
  }
];

export default function WorkoutScreen() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(workoutData[0].duration);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showFormTips, setShowFormTips] = useState(false);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<any>({});
  const [showWaterBreak, setShowWaterBreak] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    loadPersonalRecords();
    setWorkoutStartTime(new Date());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleExerciseComplete();
            return 0;
          }
          
          // Voice countdown for last 5 seconds
          if (prev <= 5 && prev > 1 && voiceEnabled) {
            Speech.speak(prev.toString(), { rate: 1.2 });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          if (prev === 1 && voiceEnabled) {
            Speech.speak(isResting ? 'Rest complete! Get ready!' : 'Exercise complete!');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining, voiceEnabled, isResting]);

  useEffect(() => {
    // Check for water break every 15 minutes
    const checkWaterBreak = setInterval(() => {
      if (workoutStartTime) {
        const elapsed = (new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60;
        if (elapsed > 0 && elapsed % 15 < 0.1) {
          setShowWaterBreak(true);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkWaterBreak);
  }, [workoutStartTime]);

  const startAnimations = () => {
    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Color animation for timer
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const loadPersonalRecords = async () => {
    try {
      const records = await storageService.getPersonalRecords();
      setPersonalRecords(records);
    } catch (error) {
      console.error('Error loading personal records:', error);
    }
  };

  const handleExerciseComplete = async () => {
    setIsPlaying(false);
    const exercise = workoutData[currentExercise];
    
    // Add to completed exercises
    if (!completedExercises.includes(exercise.id)) {
      setCompletedExercises(prev => [...prev, exercise.id]);
      setTotalCalories(prev => prev + exercise.calories);
    }
    
    // Transition animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (currentSet < (exercise.sets || 1)) {
      // Start rest period
      setIsResting(true);
      setTimeRemaining(exercise.restTime);
      setCurrentSet(prev => prev + 1);
      
      if (voiceEnabled) {
        Speech.speak(`Great job! Rest for ${exercise.restTime} seconds.`);
      }
    } else {
      // Move to next exercise
      if (currentExercise < workoutData.length - 1) {
        // Exercise transition animation
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        setCurrentExercise(prev => prev + 1);
        setTimeRemaining(workoutData[currentExercise + 1].duration);
        setCurrentSet(1);
        setIsResting(false);
        
        if (voiceEnabled) {
          Speech.speak(`Next exercise: ${workoutData[currentExercise + 1].name}`);
        }
      } else {
        // Workout complete
        await completeWorkout();
      }
    }
  };

  const completeWorkout = async () => {
    try {
      const workoutDuration = workoutStartTime 
        ? Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60)
        : 30;
      
      // Update user stats
      await storageService.incrementWorkout(totalCalories, workoutDuration);
      
      // Save workout to history
      await storageService.addWorkoutToHistory({
        videoId: 'ai-workout',
        title: 'AI Guided Workout',
        duration: `${workoutDuration}:00`,
        calories: totalCalories,
        category: 'AI Training',
        difficulty: 'Mixed'
      });
      
      if (voiceEnabled) {
        Speech.speak(`Congratulations! Workout complete. You burned ${totalCalories} calories!`);
      }
      
      Alert.alert(
        '🎉 Workout Complete!',
        `Amazing job! You burned ${totalCalories} calories in ${workoutDuration} minutes.`,
        [{ text: 'Awesome!', onPress: () => {} }]
      );
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying && voiceEnabled) {
      Speech.speak(isResting ? 'Rest timer started' : 'Exercise started');
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetExercise = () => {
    setIsPlaying(false);
    setTimeRemaining(workoutData[currentExercise].duration);
    setCurrentSet(1);
    setIsResting(false);
    
    if (voiceEnabled) {
      Speech.speak('Exercise reset');
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const skipExercise = () => {
    if (currentExercise < workoutData.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(workoutData[currentExercise + 1].duration);
      setCurrentSet(1);
      setIsResting(false);
      setIsPlaying(false);
      
      if (voiceEnabled) {
        Speech.speak(`Skipped to ${workoutData[currentExercise + 1].name}`);
      }
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const exercise = workoutData[currentExercise];
  const progress = 1 - (timeRemaining / (isResting ? exercise.restTime : exercise.duration));
  
  // Dynamic timer colors
  const timerColors = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isResting 
      ? ['#FF6B6B', '#FF4757'] 
      : timeRemaining <= 10 
        ? ['#FFD93D', '#FF6B6B']
        : ['#00D4FF', '#0099CC']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Controls */}
        <LinearGradient
          colors={['#0F0F23', '#1E1E3F', '#2D2D5F']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>AI Workout Pro</Text>
                <Text style={styles.headerSubtitle}>
                  Exercise {currentExercise + 1} of {workoutData.length}
                </Text>
              </View>
              
              <View style={styles.headerControls}>
                <TouchableOpacity
                  style={styles.controlIcon}
                  onPress={toggleVoice}
                  activeOpacity={0.8}
                >
                  {voiceEnabled ? (
                    <Volume2 size={20} color="#00D4FF" />
                  ) : (
                    <VolumeX size={20} color="#666" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.controlIcon}
                  onPress={() => setShow3DPreview(true)}
                  activeOpacity={0.8}
                >
                  <Eye size={20} color="#A78BFA" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.controlIcon}
                  onPress={() => setShowFormTips(true)}
                  activeOpacity={0.8}
                >
                  <Info size={20} color="#00FF88" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.workoutProgress}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${((currentExercise + progress) / workoutData.length) * 100}%`],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(((currentExercise + progress) / workoutData.length) * 100)}% Complete
              </Text>
            </View>
            
            {/* Calories Counter */}
            <View style={styles.caloriesCounter}>
              <Flame size={16} color="#FF6B6B" />
              <Text style={styles.caloriesText}>{totalCalories} calories burned</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Current Exercise Card */}
        <Animated.View 
          style={[
            styles.exerciseSection,
            { transform: [{ translateX: slideAnim }, { scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2', '#8B5CF6']}
            style={styles.exerciseCard}
          >
            <BlurView intensity={30} style={styles.exerciseContent}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIconContainer}>
                  <LinearGradient
                    colors={['#00D4FF', '#0099CC']}
                    style={styles.exerciseIcon}
                  >
                    <Dumbbell size={32} color="#FFFFFF" strokeWidth={2.5} />
                  </LinearGradient>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseStats}>
                    <View style={styles.exerciseStat}>
                      <Target size={16} color="#00D4FF" />
                      <Text style={styles.exerciseStatText}>{exercise.reps}</Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Clock size={16} color="#FFD93D" />
                      <Text style={styles.exerciseStatText}>{exercise.duration}s</Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Activity size={16} color="#FF6B6B" />
                      <Text style={styles.exerciseStatText}>{exercise.difficulty}</Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Flame size={16} color="#FF6B6B" />
                      <Text style={styles.exerciseStatText}>{exercise.calories} cal</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Enhanced Timer Display */}
              <View style={styles.timerSection}>
                <Animated.View
                  style={[
                    styles.timerContainer,
                    {
                      transform: [{ scale: isPlaying ? pulseAnim : 1 }],
                    },
                  ]}
                >
                  <Animated.View style={styles.timerGradient}>
                    <LinearGradient
                      colors={isResting ? ['#FF6B6B', '#FF4757'] : timeRemaining <= 10 ? ['#FFD93D', '#FF6B6B'] : ['#00D4FF', '#0099CC']}
                      style={styles.timerInner}
                    >
                      <Text style={styles.timerText}>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </Text>
                      <Text style={styles.timerLabel}>
                        {isResting ? 'REST TIME' : 'EXERCISE TIME'}
                      </Text>
                      
                      {/* Animated progress ring */}
                      <View style={styles.progressRing}>
                        <Animated.View
                          style={[
                            styles.progressRingFill,
                            {
                              transform: [{
                                rotate: progressAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', `${progress * 360}deg`]
                                })
                              }]
                            }
                          ]}
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </Animated.View>
                
                <View style={styles.setInfo}>
                  <Text style={styles.setInfoText}>
                    Set {currentSet} of {exercise.sets}
                  </Text>
                  {completedExercises.includes(exercise.id) && (
                    <CheckCircle size={16} color="#00FF88" />
                  )}
                </View>
              </View>

              {/* Enhanced Control Buttons */}
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={resetExercise}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.controlButtonGradient}
                  >
                    <RotateCcw size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={togglePlayPause}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#00D4FF', '#0099CC']}
                    style={styles.playButtonGradient}
                  >
                    {isPlaying ? (
                      <Pause size={32} color="#FFFFFF" />
                    ) : (
                      <Play size={32} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipExercise}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.controlButtonGradient}
                  >
                    <SkipForward size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced AI Features */}
        <View style={styles.aiSection}>
          <Text style={styles.aiSectionTitle}>🤖 AI Coaching Active</Text>
          <View style={styles.aiFeatures}>
            {exercise.aiFeatures.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.aiFeature,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [-width, 0],
                        outputRange: [-50, 0]
                      })
                    }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['#00FF8820', '#00FF8810']}
                  style={styles.aiFeatureIcon}
                >
                  <CheckCircle size={20} color="#00FF88" />
                </LinearGradient>
                <Text style={styles.aiFeatureText}>{feature}</Text>
                <View style={styles.aiStatus}>
                  <View style={styles.aiStatusDot} />
                  <Text style={styles.aiStatusText}>Active</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Exercise Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📋 Exercise Instructions</Text>
          <View style={styles.instructionsList}>
            {exercise.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Target Muscles */}
        <View style={styles.musclesSection}>
          <Text style={styles.musclesTitle}>🎯 Target Muscles</Text>
          <View style={styles.musclesList}>
            {exercise.targetMuscles.map((muscle, index) => (
              <View key={index} style={styles.muscleTag}>
                <LinearGradient
                  colors={['#A78BFA20', '#A78BFA10']}
                  style={styles.muscleTagGradient}
                >
                  <Text style={styles.muscleTagText}>{muscle}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Enhanced AI Insights */}
        <View style={styles.insightsSection}>
          <LinearGradient
            colors={['#1E1E3F', '#2D2D5F']}
            style={styles.insightsContainer}
          >
            <BlurView intensity={20} style={styles.insightsContent}>
              <View style={styles.insightsHeader}>
                <LinearGradient
                  colors={['#00D4FF', '#A78BFA']}
                  style={styles.insightsIcon}
                >
                  <Sparkles size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.insightsTitle}>✨ AI Performance Insights</Text>
              </View>
              
              <View style={styles.insightsList}>
                <View style={styles.insightItem}>
                  <Eye size={20} color="#00D4FF" />
                  <Text style={styles.insightText}>Form accuracy: 94% - Excellent technique!</Text>
                  <Star size={16} color="#FFD93D" />
                </View>
                <View style={styles.insightItem}>
                  <Activity size={20} color="#FF6B6B" />
                  <Text style={styles.insightText}>Heart rate zone: Optimal for fat burning</Text>
                  <Heart size={16} color="#FF6B6B" />
                </View>
                <View style={styles.insightItem}>
                  <TrendingUp size={20} color="#00FF88" />
                  <Text style={styles.insightText}>15% improvement from last session</Text>
                  <Trophy size={16} color="#00FF88" />
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Form Tips Modal */}
      <Modal
        visible={showFormTips}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormTips(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E1E3F', '#2D2D5F']}
            style={styles.modalContent}
          >
            <BlurView intensity={30} style={styles.modalInner}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💡 AI Form Tips</Text>
                <TouchableOpacity
                  onPress={() => setShowFormTips(false)}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {exercise.formTips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={styles.tipIcon}>
                      <Zap size={16} color="#FFD93D" />
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </ScrollView>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>

      {/* 3D Preview Modal */}
      <Modal
        visible={show3DPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShow3DPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#0F0F23', '#1E1E3F']}
            style={styles.previewModal}
          >
            <BlurView intensity={40} style={styles.previewContent}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>🎬 3D Exercise Preview</Text>
                <TouchableOpacity
                  onPress={() => setShow3DPreview(false)}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.preview3D}>
                <LinearGradient
                  colors={['#00D4FF20', '#A78BFA20']}
                  style={styles.preview3DContainer}
                >
                  <Camera size={48} color="#00D4FF" />
                  <Text style={styles.preview3DText}>{exercise.preview3D}</Text>
                  <Text style={styles.preview3DSubtext}>
                    Interactive 3D model showing proper form and movement
                  </Text>
                </LinearGradient>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>

      {/* Water Break Reminder */}
      <Modal
        visible={showWaterBreak}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWaterBreak(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#00D4FF', '#0099CC']}
            style={styles.waterBreakModal}
          >
            <BlurView intensity={30} style={styles.waterBreakContent}>
              <Droplets size={64} color="#FFFFFF" />
              <Text style={styles.waterBreakTitle}>💧 Hydration Break!</Text>
              <Text style={styles.waterBreakText}>
                Time to hydrate! Drink some water to keep your performance optimal.
              </Text>
              <TouchableOpacity
                style={styles.waterBreakButton}
                onPress={() => setShowWaterBreak(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.waterBreakButtonText}>Thanks for the reminder!</Text>
              </TouchableOpacity>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
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
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
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
  headerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  caloriesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  caloriesText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  exerciseSection: {
    padding: 24,
  },
  exerciseCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  exerciseContent: {
    padding: 28,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  exerciseIconContainer: {
    marginRight: 16,
  },
  exerciseIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  exerciseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  exerciseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseStatText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  timerGradient: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRingFill: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 4,
    borderColor: '#00D4FF',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  setInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  setInfoText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  aiSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00FF88',
    marginBottom: 16,
    textAlign: 'center',
  },
  aiFeatures: {
    gap: 12,
  },
  aiFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  aiFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiFeatureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  aiStatusText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  instructionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  musclesSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  musclesTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  musclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  muscleTagGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  muscleTagText: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '700',
  },
  insightsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  insightsContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  insightsContent: {
    padding: 24,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  insightsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalInner: {
    padding: 24,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 400,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  previewModal: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '90%',
    padding: 24,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
    borderRadius: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  preview3D: {
    alignItems: 'center',
  },
  preview3DContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  preview3DText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  preview3DSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  waterBreakModal: {
    width: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  waterBreakContent: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.9)',
    gap: 16,
  },
  waterBreakTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  waterBreakText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  waterBreakButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginTop: 8,
  },
  waterBreakButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 120,
  },
});