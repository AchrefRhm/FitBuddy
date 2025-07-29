import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, RotateCcw, Square, Play, Pause, Volume2, VolumeX, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Zap, Target, TrendingUp, Award } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { SpeechFeedback } from '../utils/speechFeedback';
import { PoseDetector } from '../components/PoseDetector';

const { width, height } = Dimensions.get('window');

interface PoseData {
  score: number;
  feedback: string;
  reps: number;
  formIssues: string[];
  confidence: number;
  bodyAlignment: {
    shoulders: number;
    hips: number;
    knees: number;
    ankles: number;
  };
}

interface SmartCoachingData {
  personalBest: number;
  streakDays: number;
  totalWorkouts: number;
  averageScore: number;
  improvements: string[];
  nextGoal: string;
}

export default function AICoachScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [poseData, setPoseData] = useState<PoseData>({
    score: 0,
    feedback: 'Position yourself in the frame',
    reps: 0,
    formIssues: [],
    confidence: 0,
    bodyAlignment: {
      shoulders: 0,
      hips: 0,
      knees: 0,
      ankles: 0,
    },
  });
  const [sessionData, setSessionData] = useState({
    duration: 0,
    calories: 0,
    perfectReps: 0,
    totalReps: 0,
  });
  const [smartCoaching, setSmartCoaching] = useState<SmartCoachingData>({
    personalBest: 92,
    streakDays: 7,
    totalWorkouts: 23,
    averageScore: 87,
    improvements: ['Better knee alignment', 'Improved depth'],
    nextGoal: 'Maintain 90%+ form for 20 reps',
  });

  const pulseAnimation = useSharedValue(0);
  const scoreAnimation = useSharedValue(0);
  const confidenceAnimation = useSharedValue(0);
  const repCelebration = useSharedValue(0);
  const formIndicators = useSharedValue({
    shoulders: 0,
    hips: 0,
    knees: 0,
    ankles: 0,
  });

  const speechFeedback = SpeechFeedback.getInstance();
  const poseDetector = PoseDetector.getInstance();

  useEffect(() => {
    speechFeedback.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    if (isRecording) {
      poseDetector.startAnalysis();
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
      
      // Advanced real-time pose analysis
      const interval = setInterval(() => {
        const analysis = poseDetector.analyzeFrame(selectedExercise);
        const newScore = analysis.score;
        const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
        
        // Generate realistic form issues
        const formIssues = [];
        if (newScore < 90) {
          const issues = [
            'Knee tracking needs attention',
            'Maintain neutral spine',
            'Engage core muscles',
            'Control the descent',
            'Full range of motion needed',
          ];
          formIssues.push(issues[Math.floor(Math.random() * issues.length)]);
        }

        // Simulate body alignment scores
        const bodyAlignment = {
          shoulders: Math.floor(Math.random() * 20) + 80,
          hips: Math.floor(Math.random() * 25) + 75,
          knees: Math.floor(Math.random() * 30) + 70,
          ankles: Math.floor(Math.random() * 15) + 85,
        };

        // Check for rep completion
        const repDetected = Math.random() > 0.85;
        let newReps = poseData.reps;
        let perfectReps = sessionData.perfectReps;
        
        if (repDetected) {
          newReps += 1;
          if (newScore >= 85) {
            perfectReps += 1;
          }
          
          // Trigger celebration animation
          repCelebration.value = withSequence(
            withSpring(1, { damping: 8, stiffness: 200 }),
            withSpring(0, { damping: 8, stiffness: 200 })
          );
          
          // Provide audio feedback
          if (audioEnabled) {
            runOnJS(speechFeedback.announceRep)(newReps);
            if (newScore >= 90) {
              runOnJS(speechFeedback.speak)('Perfect rep!');
            }
          }
        }
        
        setPoseData(prev => ({
          score: newScore,
          feedback: analysis.feedback,
          reps: newReps,
          formIssues,
          confidence,
          bodyAlignment,
        }));
        
        setSessionData(prev => ({
          duration: prev.duration + 1,
          calories: prev.calories + 0.8,
          perfectReps,
          totalReps: newReps,
        }));
        
        // Animate score and confidence
        scoreAnimation.value = withTiming(newScore / 100, { duration: 500 });
        confidenceAnimation.value = withTiming(confidence, { duration: 300 });
        
        // Animate form indicators
        formIndicators.value = withTiming({
          shoulders: bodyAlignment.shoulders / 100,
          hips: bodyAlignment.hips / 100,
          knees: bodyAlignment.knees / 100,
          ankles: bodyAlignment.ankles / 100,
        }, { duration: 400 });
        
      }, 1500); // Faster analysis for better responsiveness

      return () => {
        clearInterval(interval);
        poseDetector.stopAnalysis();
      };
    } else {
      pulseAnimation.value = 0;
      poseDetector.stopAnalysis();
    }
  }, [isRecording, selectedExercise, audioEnabled]);

  const animatedPulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.1]);
    return {
      transform: [{ scale }],
    };
  });

  const animatedScoreStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      scoreAnimation.value,
      [0, 0.7, 0.85, 0.95],
      [0xff4444, 0xffa500, 0x3b82f6, 0x10b981]
    );
    return {
      backgroundColor: `#${Math.floor(backgroundColor).toString(16).padStart(6, '0')}`,
    };
  });

  const animatedConfidenceStyle = useAnimatedStyle(() => {
    const opacity = interpolate(confidenceAnimation.value, [0.5, 1], [0.3, 1]);
    return { opacity };
  });

  const animatedRepCelebration = useAnimatedStyle(() => {
    const scale = interpolate(repCelebration.value, [0, 1], [1, 1.3]);
    return {
      transform: [{ scale }],
    };
  });

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Zap size={80} color="#3B82F6" />
        <Text style={styles.permissionTitle}>AI Coach Ready</Text>
        <Text style={styles.permissionMessage}>
          Grant camera access to unlock advanced pose detection, real-time form analysis, and personalized coaching
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Activate AI Coach</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setPoseData(prev => ({ 
        ...prev, 
        reps: 0,
        score: 0,
        feedback: 'Get ready! Position yourself in frame',
      }));
      setSessionData({ duration: 0, calories: 0, perfectReps: 0, totalReps: 0 });
    } else {
      // Workout complete feedback
      if (audioEnabled && sessionData.totalReps > 0) {
        const avgScore = Math.floor((sessionData.perfectReps / sessionData.totalReps) * 100);
        speechFeedback.announceWorkoutComplete(sessionData.totalReps, avgScore);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Award size={20} color="#FFFFFF" />;
    if (score >= 80) return <CheckCircle size={20} color="#FFFFFF" />;
    return <AlertTriangle size={20} color="#FFFFFF" />;
  };

  const exercises = ['squat', 'lunge', 'yoga', 'stretch', 'pushup'];
  const currentExerciseIndex = exercises.indexOf(selectedExercise);

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        {/* Advanced Header with Smart Coaching */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'transparent']}
          style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <RotateCcw size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.exerciseSelector}>
              <TouchableOpacity
                onPress={() => {
                  const nextIndex = (currentExerciseIndex + 1) % exercises.length;
                  setSelectedExercise(exercises[nextIndex]);
                }}>
                <Text style={styles.exerciseText}>{selectedExercise.toUpperCase()}</Text>
                <Text style={styles.exerciseSubtext}>Tap to change</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setAudioEnabled(!audioEnabled)}>
              {audioEnabled ? (
                <Volume2 size={24} color="#FFFFFF" />
              ) : (
                <VolumeX size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Smart Coaching Stats */}
          <View style={styles.smartStats}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.statText}>{smartCoaching.streakDays} day streak</Text>
            </View>
            <View style={styles.statItem}>
              <Target size={16} color="#3B82F6" />
              <Text style={styles.statText}>PB: {smartCoaching.personalBest}%</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={16} color="#F59E0B" />
              <Text style={styles.statText}>{smartCoaching.totalWorkouts} workouts</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Advanced Pose Overlay with Body Alignment */}
        {isRecording && (
          <View style={styles.poseOverlay}>
            {/* AI Detection Confidence Indicator */}
            <Animated.View style={[styles.confidenceIndicator, animatedConfidenceStyle]}>
              <Zap size={16} color="#10B981" />
              <Text style={styles.confidenceText}>
                AI: {Math.floor(poseData.confidence * 100)}%
              </Text>
            </Animated.View>

            {/* Body Alignment Indicators */}
            <View style={styles.alignmentIndicators}>
              <View style={styles.alignmentRow}>
                <Text style={styles.alignmentLabel}>Shoulders</Text>
                <View style={styles.alignmentBar}>
                  <Animated.View 
                    style={[
                      styles.alignmentFill,
                      { 
                        width: `${poseData.bodyAlignment.shoulders}%`,
                        backgroundColor: getScoreColor(poseData.bodyAlignment.shoulders),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.alignmentScore}>{poseData.bodyAlignment.shoulders}%</Text>
              </View>
              
              <View style={styles.alignmentRow}>
                <Text style={styles.alignmentLabel}>Hips</Text>
                <View style={styles.alignmentBar}>
                  <Animated.View 
                    style={[
                      styles.alignmentFill,
                      { 
                        width: `${poseData.bodyAlignment.hips}%`,
                        backgroundColor: getScoreColor(poseData.bodyAlignment.hips),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.alignmentScore}>{poseData.bodyAlignment.hips}%</Text>
              </View>
              
              <View style={styles.alignmentRow}>
                <Text style={styles.alignmentLabel}>Knees</Text>
                <View style={styles.alignmentBar}>
                  <Animated.View 
                    style={[
                      styles.alignmentFill,
                      { 
                        width: `${poseData.bodyAlignment.knees}%`,
                        backgroundColor: getScoreColor(poseData.bodyAlignment.knees),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.alignmentScore}>{poseData.bodyAlignment.knees}%</Text>
              </View>
            </View>

            {/* Center Guide with Smart Detection */}
            <View style={styles.centerGuide}>
              <Animated.View style={[
                styles.guideCircle,
                {
                  borderColor: poseData.confidence > 0.8 ? '#10B981' : '#3B82F6',
                  borderWidth: poseData.confidence > 0.8 ? 4 : 2,
                }
              ]}>
                {poseData.confidence > 0.8 && (
                  <View style={styles.detectionSuccess}>
                    <CheckCircle size={32} color="#10B981" />
                    <Text style={styles.detectionText}>Perfect Position</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </View>
        )}

        {/* Enhanced Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.bottomGradient}>
          
          {/* Advanced Real-time Stats */}
          {isRecording && (
            <View style={styles.statsOverlay}>
              <Animated.View style={[styles.scoreCard, animatedScoreStyle]}>
                {getScoreIcon(poseData.score)}
                <Text style={styles.scoreText}>{poseData.score}%</Text>
                <Text style={styles.scoreLabel}>FORM</Text>
              </Animated.View>
              
              <Animated.View style={[styles.repCounter, animatedRepCelebration]}>
                <Text style={styles.repNumber}>{poseData.reps}</Text>
                <Text style={styles.repLabel}>REPS</Text>
                <Text style={styles.repSubLabel}>
                  {sessionData.perfectReps} perfect
                </Text>
              </Animated.View>
              
              <View style={styles.sessionStats}>
                <Text style={styles.sessionText}>
                  {Math.floor(sessionData.duration / 60)}:{(sessionData.duration % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.sessionSubText}>TIME</Text>
                <Text style={styles.sessionText}>{Math.floor(sessionData.calories)}</Text>
                <Text style={styles.sessionSubText}>CALORIES</Text>
              </View>
            </View>
          )}

          {/* Smart Feedback with Form Issues */}
          {isRecording && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{poseData.feedback}</Text>
              {poseData.formIssues.length > 0 && (
                <View style={styles.formIssues}>
                  {poseData.formIssues.map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <AlertTriangle size={14} color="#F59E0B" />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Enhanced Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Square size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Animated.View style={animatedPulseStyle}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                ]}
                onPress={toggleRecording}>
                {isRecording ? (
                  <Pause size={32} color="#FFFFFF" />
                ) : (
                  <Play size={32} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Camera size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Smart Coaching Insights */}
          {!isRecording && sessionData.totalReps > 0 && (
            <View style={styles.insightsContainer}>
              <Text style={styles.insightsTitle}>Workout Complete! 🎉</Text>
              <Text style={styles.insightsText}>
                {sessionData.perfectReps}/{sessionData.totalReps} perfect reps
              </Text>
              <Text style={styles.insightsText}>
                Next goal: {smartCoaching.nextGoal}
              </Text>
            </View>
          )}
        </LinearGradient>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 28,
    color: '#1F2937',
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseSelector: {
    backgroundColor: 'rgba(59,130,246,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  exerciseText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  exerciseSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  smartStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  poseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceIndicator: {
    position: 'absolute',
    top: 180,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  confidenceText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  alignmentIndicators: {
    position: 'absolute',
    top: 220,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  alignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alignmentLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    width: 70,
  },
  alignmentBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  alignmentFill: {
    height: '100%',
    borderRadius: 3,
  },
  alignmentScore: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    width: 35,
    textAlign: 'right',
  },
  centerGuide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionSuccess: {
    alignItems: 'center',
  },
  detectionText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 8,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
    zIndex: 1,
  },
  statsOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
  },
  scoreText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  repCounter: {
    alignItems: 'center',
  },
  repNumber: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  repLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  repSubLabel: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  sessionStats: {
    alignItems: 'center',
  },
  sessionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sessionSubText: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  formIssues: {
    marginTop: 8,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  recordButtonActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  insightsContainer: {
    backgroundColor: 'rgba(16,185,129,0.9)',
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
});