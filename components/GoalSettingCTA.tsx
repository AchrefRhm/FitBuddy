import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
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
import { Target, Plus, Calendar, Trophy, Zap, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'workouts' | 'calories' | 'streak' | 'minutes';
  deadline: string;
  reward: string;
}

interface GoalSettingCTAProps {
  onGoalSet: (goal: Goal) => void;
  currentGoals: Goal[];
}

export default function GoalSettingCTA({ onGoalSet, currentGoals }: GoalSettingCTAProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalType, setGoalType] = useState<Goal['type']>('workouts');
  const [goalDeadline, setGoalDeadline] = useState('7');

  const scaleAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);
  const modalAnimation = useSharedValue(0);

  React.useEffect(() => {
    glowAnimation.value = withSequence(
      withTiming(1, { duration: 2000 }),
      withTiming(0.3, { duration: 2000 })
    );
  }, []);

  const handlePress = () => {
    scaleAnimation.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    setModalVisible(true);
    modalAnimation.value = withSpring(1);
  };

  const handleCreateGoal = () => {
    if (!goalTitle.trim() || !goalTarget.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
        position: 'top',
      });
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalTitle,
      target: parseInt(goalTarget),
      current: 0,
      type: goalType,
      deadline: new Date(Date.now() + parseInt(goalDeadline) * 24 * 60 * 60 * 1000).toISOString(),
      reward: getRewardForGoal(goalType, parseInt(goalTarget)),
    };

    onGoalSet(newGoal);
    setModalVisible(false);
    modalAnimation.value = withTiming(0);
    
    // Reset form
    setGoalTitle('');
    setGoalTarget('');
    setGoalType('workouts');
    setGoalDeadline('7');

    Toast.show({
      type: 'success',
      text1: 'Goal Created! 🎯',
      text2: `Your ${goalTitle} goal is now active`,
      position: 'top',
    });
  };

  const getRewardForGoal = (type: Goal['type'], target: number): string => {
    const rewards = {
      workouts: `${target * 50} XP + Achievement Badge`,
      calories: `${Math.floor(target / 10)} XP + Calorie Crusher Badge`,
      streak: `${target * 100} XP + Consistency Master Badge`,
      minutes: `${Math.floor(target / 5)} XP + Time Master Badge`,
    };
    return rewards[type];
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale = scaleAnimation.value;
    return { transform: [{ scale }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.3, 0.8]);
    return { opacity };
  });

  const modalStyle = useAnimatedStyle(() => {
    const scale = interpolate(modalAnimation.value, [0, 1], [0.8, 1]);
    const opacity = modalAnimation.value;
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const goalTypes = [
    { key: 'workouts', label: 'Workouts', icon: <Trophy size={20} color="white" />, color: '#3B82F6' },
    { key: 'calories', label: 'Calories', icon: <Zap size={20} color="white" />, color: '#EF4444' },
    { key: 'streak', label: 'Streak', icon: <Target size={20} color="white" />, color: '#10B981' },
    { key: 'minutes', label: 'Minutes', icon: <Calendar size={20} color="white" />, color: '#F59E0B' },
  ];

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <BlurView intensity={20} style={styles.blur}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(147, 51, 234, 0.2)', 'rgba(236, 72, 153, 0.2)']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Animated Glow */}
              <Animated.View style={[styles.glowEffect, glowStyle]}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.4)', 'transparent']}
                  style={styles.glow}
                />
              </Animated.View>

              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <Target size={32} color="#3B82F6" />
                  <View style={styles.plusIcon}>
                    <Plus size={16} color="white" />
                  </View>
                </View>
                
                <View style={styles.textContainer}>
                  <Text style={styles.title}>Set Your Next Goal</Text>
                  <Text style={styles.subtitle}>
                    {currentGoals.length === 0 
                      ? 'Create your first fitness goal and track your progress!'
                      : `You have ${currentGoals.length} active goal${currentGoals.length > 1 ? 's' : ''}. Add another?`
                    }
                  </Text>
                </View>

                <View style={styles.arrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {/* Goal Creation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, modalStyle]}>
            <BlurView intensity={40} style={styles.modalBlur}>
              <LinearGradient
                colors={['rgba(15, 15, 35, 0.95)', 'rgba(26, 26, 46, 0.95)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create New Goal</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Goal Title</Text>
                    <TextInput
                      style={styles.textInput}
                      value={goalTitle}
                      onChangeText={setGoalTitle}
                      placeholder="e.g., Complete 20 workouts"
                      placeholderTextColor="#6B7280"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Target Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                      placeholder="e.g., 20"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Goal Type</Text>
                    <View style={styles.typeSelector}>
                      {goalTypes.map((type) => (
                        <TouchableOpacity
                          key={type.key}
                          style={[
                            styles.typeButton,
                            goalType === type.key && [styles.typeButtonActive, { backgroundColor: type.color }]
                          ]}
                          onPress={() => setGoalType(type.key as Goal['type'])}
                        >
                          {type.icon}
                          <Text style={[
                            styles.typeButtonText,
                            goalType === type.key && styles.typeButtonTextActive
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Deadline (days)</Text>
                    <View style={styles.deadlineSelector}>
                      {['7', '14', '30', '60'].map((days) => (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.deadlineButton,
                            goalDeadline === days && styles.deadlineButtonActive
                          ]}
                          onPress={() => setGoalDeadline(days)}
                        >
                          <Text style={[
                            styles.deadlineButtonText,
                            goalDeadline === days && styles.deadlineButtonTextActive
                          ]}>
                            {days}d
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.createButtonGradient}
                    >
                      <Target size={20} color="white" />
                      <Text style={styles.createButtonText}>Create Goal</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  blur: {
    flex: 1,
  },
  gradient: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  glow: {
    flex: 1,
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plusIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  arrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBlur: {
    flex: 1,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {},
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  deadlineSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  deadlineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  deadlineButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  deadlineButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  deadlineButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  createButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});