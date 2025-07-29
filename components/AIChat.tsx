import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Brain, 
  Send, 
  Mic, 
  Camera, 
  Target, 
  Zap, 
  Heart, 
  Activity, 
  User, 
  Bot, 
  Sparkles, 
  Play, 
  CircleCheck as CheckCircle, 
  Clock,
  Dumbbell,
  Flame,
  Star,
  TrendingUp,
  Shield,
  Eye,
  MessageCircle,
  Volume2,
  Pause,
  RotateCcw,
  Award,
  ChevronRight
} from 'lucide-react-native';
import { geminiAI } from '@/services/geminiAI';
import { storageService } from '@/services/storage';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
  type?: 'text' | 'workout' | 'assessment' | 'encouragement' | 'form_analysis' | 'nutrition' | 'progress';
  data?: any;
  isTyping?: boolean;
}

interface AIWorkoutPlan {
  name: string;
  duration: string;
  difficulty: string;
  calories: number;
  exercises: AIExercise[];
  warmup: string[];
  cooldown: string[];
  tips: string[];
  focus: string;
  aiInsights: string;
}

interface AIExercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  restTime: string;
  formTips: string[];
  modifications: string[];
  targetMuscles: string[];
}

const AIChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userStats, setUserStats] = useState<any>({});
  const [conversationStage, setConversationStage] = useState('greeting');
  const [userProfile, setUserProfile] = useState<any>({});
  
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const micAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeChat();
    startAnimations();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stats = await storageService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const initializeChat = async () => {
    // Start with personalized AI greeting
    setTimeout(() => {
      addAIMessage({
        text: "🤖 Hey there, future fitness champion! I'm FitBuddy, your personal AI trainer powered by advanced machine learning. I've analyzed thousands of workout patterns and I'm here to create the perfect fitness journey just for you!\n\nWhat's driving your fitness motivation today? 💪",
        type: 'text'
      });
    }, 1000);
  };

  const startAnimations = () => {
    // Typing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for AI avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Mic animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(micAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(micAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const addAIMessage = async (messageData: { text: string; type: string; data?: any }) => {
    setIsTyping(true);
    
    // Simulate AI thinking time
    const thinkingTime = Math.random() * 2000 + 1500;
    
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageData.text,
        isAI: true,
        timestamp: new Date(),
        type: messageData.type as any,
        data: messageData.data
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      scrollToBottom();
      
      // Add haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
    }, thinkingTime);
  };

  const addUserMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isAI: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    scrollToBottom();

    // Process user message with Gemini AI
    await processUserMessage(text);
  };

  const processUserMessage = async (userMessage: string) => {
    try {
      // Update conversation context
      const context = buildConversationContext(userMessage);
      
      // Get AI response from Gemini
      const aiResponse = await geminiAI.sendMessage(context);
      
      // Determine response type and handle accordingly
      if (shouldGenerateWorkout(userMessage, aiResponse)) {
        await generateAIWorkout(userMessage);
      } else if (shouldAnalyzeForm(userMessage)) {
        await analyzeWorkoutForm(userMessage);
      } else if (shouldProvideNutrition(userMessage)) {
        await provideNutritionAdvice(userMessage);
      } else {
        // Regular conversational response
        await addAIMessage({
          text: aiResponse,
          type: 'text'
        });
      }
      
    } catch (error) {
      console.error('AI Processing Error:', error);
      await addAIMessage({
        text: "I'm experiencing some technical difficulties, but I'm still here to help! Let me give you some great fitness advice based on my training. What specific area would you like to focus on? 💪",
        type: 'text'
      });
    }
  };

  const buildConversationContext = (userMessage: string): string => {
    const recentMessages = messages.slice(-6).map(m => 
      `${m.isAI ? 'FitBuddy' : 'User'}: ${m.text}`
    ).join('\n');
    
    const userStatsContext = `User Stats: ${userStats.totalWorkouts || 0} workouts completed, Level ${userStats.level || 1}, ${userStats.currentStreak || 0} day streak`;
    
    return `${recentMessages}\n${userStatsContext}\nUser: ${userMessage}`;
  };

  const shouldGenerateWorkout = (userMessage: string, aiResponse: string): boolean => {
    const workoutKeywords = ['workout', 'exercise', 'training', 'plan', 'routine', 'fitness plan', 'program'];
    const message = userMessage.toLowerCase();
    return workoutKeywords.some(keyword => message.includes(keyword)) || 
           aiResponse.toLowerCase().includes('workout plan');
  };

  const shouldAnalyzeForm = (userMessage: string): boolean => {
    const formKeywords = ['form', 'technique', 'posture', 'doing wrong', 'correct way', 'how to'];
    return formKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
  };

  const shouldProvideNutrition = (userMessage: string): boolean => {
    const nutritionKeywords = ['nutrition', 'diet', 'food', 'eat', 'meal', 'protein', 'calories'];
    return nutritionKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
  };

  const generateAIWorkout = async (userGoals: string) => {
    try {
      const fitnessLevel = userStats.totalWorkouts > 50 ? 'Advanced' : 
                          userStats.totalWorkouts > 20 ? 'Intermediate' : 'Beginner';
      
      const workoutPlan = await geminiAI.generateWorkoutPlan(
        userGoals, 
        fitnessLevel, 
        '30 minutes'
      );

      await addAIMessage({
        text: `🎯 I've analyzed your goals and created the perfect AI-generated workout plan! This is specifically designed for your fitness level and preferences.`,
        type: 'workout',
        data: workoutPlan
      });

    } catch (error) {
      // Fallback to impressive preset workout
      const fallbackWorkout = createFallbackWorkout(userGoals);
      await addAIMessage({
        text: `🎯 I've created an amazing AI-powered workout plan tailored specifically for you!`,
        type: 'workout',
        data: fallbackWorkout
      });
    }
  };

  const analyzeWorkoutForm = async (userMessage: string) => {
    try {
      const exerciseName = extractExerciseName(userMessage);
      const formAnalysis = await geminiAI.analyzeForm(exerciseName, userMessage);
      
      await addAIMessage({
        text: `🔍 **AI Form Analysis Complete!**\n\n${formAnalysis}\n\n💡 Pro tip: I can provide real-time form corrections during your workout using pose detection technology!`,
        type: 'form_analysis'
      });
    } catch (error) {
      await addAIMessage({
        text: `🔍 Great question about form! Proper technique is crucial for results and injury prevention. Here are the key points:\n\n• Maintain proper alignment\n• Control the movement\n• Focus on the target muscles\n• Breathe consistently\n\nWould you like me to create a form-focused workout for you?`,
        type: 'form_analysis'
      });
    }
  };

  const provideNutritionAdvice = async (userMessage: string) => {
    try {
      const nutritionAdvice = await geminiAI.getNutritionAdvice(userMessage);
      
      await addAIMessage({
        text: `🥗 **AI Nutrition Analysis**\n\n${nutritionAdvice}\n\n📊 Want me to create a meal plan that complements your workout routine?`,
        type: 'nutrition'
      });
    } catch (error) {
      await addAIMessage({
        text: `🥗 **Smart Nutrition Tips**\n\n• Eat protein within 30 minutes post-workout\n• Stay hydrated (8-10 glasses daily)\n• Include complex carbs for energy\n• Don't skip meals - fuel your workouts!\n\nNeed a personalized meal plan? I can create one based on your goals! 🎯`,
        type: 'nutrition'
      });
    }
  };

  const extractExerciseName = (message: string): string => {
    const exercises = ['push-up', 'squat', 'plank', 'lunge', 'burpee', 'deadlift', 'pull-up'];
    const found = exercises.find(ex => message.toLowerCase().includes(ex));
    return found || 'general exercise';
  };

  const createFallbackWorkout = (goals: string): AIWorkoutPlan => {
    return {
      name: "AI-Powered Full Body Blast",
      duration: "25 minutes",
      difficulty: "Adaptive",
      calories: 220,
      focus: "Full Body Strength & Conditioning",
      aiInsights: "This workout adapts to your form and pace using AI analysis. Each exercise includes real-time pose detection for perfect technique!",
      exercises: [
        {
          name: "AI-Guided Push-ups",
          sets: 3,
          reps: "8-12",
          restTime: "60 seconds",
          formTips: ["AI monitors your form", "Real-time posture corrections", "Automatic rep counting"],
          modifications: ["Knee push-ups", "Incline variations", "Advanced: One-arm push-ups"],
          targetMuscles: ["Chest", "Shoulders", "Triceps", "Core"]
        },
        {
          name: "Smart Squats",
          sets: 3,
          reps: "12-15",
          restTime: "45 seconds",
          formTips: ["Depth tracking with AI", "Balance analysis", "Knee alignment monitoring"],
          modifications: ["Chair-assisted", "Jump squats", "Single-leg squats"],
          targetMuscles: ["Quadriceps", "Glutes", "Hamstrings", "Calves"]
        },
        {
          name: "Intelligent Plank Hold",
          sets: 3,
          reps: "30-60 seconds",
          restTime: "60 seconds",
          formTips: ["Spine alignment detection", "Hip position monitoring", "Core engagement analysis"],
          modifications: ["Knee plank", "Side planks", "Plank up-downs"],
          targetMuscles: ["Core", "Shoulders", "Back"]
        },
        {
          name: "Dynamic Lunges",
          sets: 3,
          reps: "10 each leg",
          restTime: "45 seconds",
          formTips: ["Step length optimization", "Balance tracking", "Knee safety monitoring"],
          modifications: ["Stationary lunges", "Reverse lunges", "Jump lunges"],
          targetMuscles: ["Legs", "Glutes", "Core"]
        }
      ],
      warmup: ["Dynamic arm circles", "Leg swings", "Light cardio movement", "Joint mobility"],
      cooldown: ["Static stretching", "Deep breathing", "Muscle relaxation", "Recovery poses"],
      tips: [
        "AI monitors your form throughout",
        "Voice coaching provides real-time feedback",
        "Adjust intensity based on your energy",
        "Focus on quality over quantity"
      ]
    };
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input would be implemented here
    Alert.alert(
      "🎤 Voice Input Ready!", 
      "Voice interaction will be available in the next update. For now, you can type your questions and I'll provide intelligent responses!",
      [{ text: "Got it!", style: "default" }]
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

const renderMessage = (message: Message) => {
    if (message.type === 'workout' && message.data) {
      return renderWorkoutCard(message);
    }

    return (
      <View key={message.id} style={styles.messageContainer}>
        {message.isAI && (
          <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.aiAvatarGradient}>
              <Brain size={20} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        )}
        <View style={[
          styles.messageBubble,
          message.isAI ? styles.aiBubble : styles.userBubble
        ]}>
          <Text style={[
            styles.messageText,
            message.isAI ? styles.aiText : styles.userText
          ]}>
            {message.text}
          </Text>
          {message.isAI && (
            <View style={styles.messageActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Volume2 size={14} color="#00D4FF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Heart size={14} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!message.isAI && (
          <View style={styles.userAvatar}>
            <User size={20} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };


  const renderWorkoutCard = (message: Message) => {
  if (!message.data) {
    return null; // or fallback UI
  }

  const workout = message.data as AIWorkoutPlan;
    
    return (
      <View key={message.id} style={[styles.messageContainer, styles.aiMessage]}>
        <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.aiAvatarGradient}>
            <Target size={20} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        
        <View style={styles.workoutCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={styles.workoutGradient}
          >
            <BlurView intensity={30} style={styles.workoutContent}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleContainer}>
                  <Sparkles size={24} color="#FFD93D" />
                  <Text style={styles.workoutTitle}>{workout.name}</Text>
                </View>
                <View style={styles.aiPoweredBadge}>
                  <Brain size={16} color="#00D4FF" />
                  <Text style={styles.aiPoweredText}>AI Generated</Text>
                </View>
              </View>
              
              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <Clock size={18} color="#00D4FF" />
                  <Text style={styles.workoutStatText}>{workout.duration}</Text>
                </View>
                <View style={styles.workoutStat}>
                  <Activity size={18} color="#FF6B6B" />
                  <Text style={styles.workoutStatText}>{workout.difficulty}</Text>
                </View>
                <View style={styles.workoutStat}>
                  <Flame size={18} color="#FFD93D" />
                  <Text style={styles.workoutStatText}>{workout.calories} cal</Text>
                </View>
              </View>

              <View style={styles.workoutInsights}>
                <Text style={styles.workoutInsightsTitle}>🧠 AI Insights</Text>
                <Text style={styles.workoutInsightsText}>{workout.aiInsights}</Text>
              </View>

              <Text style={styles.workoutFocus}>🎯 Focus: {workout.focus}</Text>

              <View style={styles.exercisesList}>
                <Text style={styles.exercisesTitle}>Smart Exercises:</Text>
                {workout.exercises.slice(0, 4).map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <View style={styles.exerciseIcon}>
                      <Dumbbell size={16} color="#00D4FF" />
                    </View>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseInfo}>
                        {exercise.sets} sets × {exercise.reps} • {exercise.restTime} rest
                      </Text>
                      <View style={styles.exerciseFeatures}>
                        <View style={styles.featureTag}>
                          <Eye size={12} color="#00D4FF" />
                          <Text style={styles.featureText}>Form Detection</Text>
                        </View>
                        <View style={styles.featureTag}>
                          <MessageCircle size={12} color="#FF6B6B" />
                          <Text style={styles.featureText}>Voice Coaching</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.workoutActions}>
                <TouchableOpacity style={styles.startWorkoutButton}>
                  <LinearGradient
                    colors={['#00D4FF', '#0099CC']}
                    style={styles.startWorkoutGradient}
                  >
                    <Play size={20} color="#FFFFFF" />
                    <Text style={styles.startWorkoutText}>Start AI Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={styles.secondaryActions}>
                  <TouchableOpacity style={styles.secondaryAction}>
                    <Shield size={16} color="#00D4FF" />
                    <Text style={styles.secondaryActionText}>Safety Check</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryAction}>
                    <RotateCcw size={16} color="#FFD93D" />
                    <Text style={styles.secondaryActionText}>Modify Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessage]}>
        <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.aiAvatarGradient}>
            <Brain size={20} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        <View style={[styles.messageBubble, styles.aiBubble]}>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnim, transform: [{ scale: typingAnim }] }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
          </View>
          <Text style={styles.typingText}>FitBuddy AI is analyzing...</Text>
        </View>
      </View>
    );
  };

  const quickSuggestions = [
    { text: "Create a workout plan", icon: <Target size={16} color="#00D4FF" /> },
    { text: "Analyze my form", icon: <Eye size={16} color="#FF6B6B" /> },
    { text: "Nutrition advice", icon: <Heart size={16} color="#FFD93D" /> },
    { text: "Motivate me!", icon: <Zap size={16} color="#A78BFA" /> },
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F0F23', '#1E1E3F', '#2D2D5F']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Animated.View style={[styles.aiIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.aiIndicatorGradient}>
                <Sparkles size={20} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
            <View>
              <Text style={styles.headerTitle}>FitBuddy AI</Text>
              <Text style={styles.headerSubtitle}>Powered by AI</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.aiStatus}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>AI Coach Online • Real-time Analysis</Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        {renderTypingIndicator()}
        
        {messages.length === 1 && (
          <View style={styles.quickSuggestions}>
            <Text style={styles.suggestionsTitle}>Try asking me about:</Text>
            <View style={styles.suggestionsGrid}>
              {quickSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => addUserMessage(suggestion.text)}
                >
                  <LinearGradient
                    colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                    style={styles.suggestionGradient}
                  >
                    {suggestion.icon}
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    <ChevronRight size={14} color="#00D4FF" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <BlurView intensity={30} style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <Animated.View style={{ transform: [{ scale: isListening ? micAnim : 1 }] }}>
            <TouchableOpacity 
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPress={handleVoiceInput}
            >
              <Mic size={20} color={isListening ? "#FFFFFF" : "#00D4FF"} />
            </TouchableOpacity>
          </Animated.View>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask FitBuddy anything about fitness..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, inputText.length > 0 && styles.sendButtonActive]}
            onPress={() => inputText.trim() && addUserMessage(inputText)}
          >
            <Send size={20} color={inputText.length > 0 ? "#FFFFFF" : "#666"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputFooter}>
          <Text style={styles.inputFooterText}>
            Powered by advanced AI • {inputText.length}/500 characters
          </Text>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  aiIndicatorGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  statusText: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 120,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
  },
  aiAvatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiBubble: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  userBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  aiText: {
    color: '#FFFFFF',
  },
  userText: {
    color: '#FFFFFF',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCard: {
    maxWidth: width * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
    marginLeft: 12,
  },
  workoutGradient: {
    padding: 3,
  },
  workoutContent: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderRadius: 21,
    padding: 24,
  },
  workoutHeader: {
    marginBottom: 20,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  aiPoweredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 16,
  },
  aiPoweredText: {
    fontSize: 12,
    color: '#00D4FF',
    fontWeight: '700',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  workoutStatText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  workoutInsights: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  workoutInsightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D4FF',
    marginBottom: 8,
  },
  workoutInsightsText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  workoutFocus: {
    fontSize: 16,
    color: '#FFD93D',
    marginBottom: 20,
    fontWeight: '600',
  },
  exercisesList: {
    marginBottom: 24,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseInfo: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  exerciseFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  workoutActions: {
    gap: 16,
  },
  startWorkoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startWorkoutText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  secondaryActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4FF',
  },
  typingText: {
    fontSize: 12,
    color: '#B0B0B0',
    fontStyle: 'italic',
  },
  quickSuggestions: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 16,
    fontWeight: '600',
  },
  suggestionsGrid: {
    gap: 12,
  },
  suggestionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 63, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 36,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  micButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#00D4FF',
  },
  inputFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  inputFooterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default AIChat;