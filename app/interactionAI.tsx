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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Brain, Camera, Zap, Shield, Target, TrendingUp, Award, Users, Play, Sparkles, Activity, Eye, MessageCircle, Clock, ChartBar as BarChart3, CircleCheck as CheckCircle, Star, Flame, Heart, Dumbbell, Bot, Mic } from 'lucide-react-native';
import { storageService } from '@/services/storage';
import AIChat from '@/components/AIChat';

const { width, height } = Dimensions.get('window');

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string[];
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient colors={gradient} style={styles.featureGradient}>
        <BlurView intensity={20} style={styles.featureContent}>
          <View style={styles.featureIcon}>{icon}</View>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      {icon}
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function FitBuddyHome() {
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    totalCalories: 0,
    level: 1,
  });

  const [showAIChat, setShowAIChat] = useState(false);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserStats();
    startAnimations();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await storageService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const startAnimations = () => {
    // Hero animation
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#0F0F23', '#1E1E3F', '#2D2D5F']}
          style={styles.heroSection}
        >
          <Animated.View
            style={[
              styles.heroBackground,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />
            <View style={styles.heroCircle3} />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: heroAnim,
                transform: [
                  {
                    translateY: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.heroIconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#00D4FF', '#0099CC', '#0066FF']}
                style={styles.heroIcon}
              >
                <Brain size={40} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.heroTitle}>FitBuddy AI</Text>
            <Text style={styles.heroSubtitle}>Your Intelligent Fitness Coach</Text>
            <Text style={styles.heroDescription}>
              Master perfect form with AI-powered pose detection, real-time corrections, 
              and adaptive workout plans tailored just for you.
            </Text>

            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => setShowAIChat(true)}
            >
              <LinearGradient
                colors={['#00D4FF', '#0099CC']}
                style={styles.ctaGradient}
              >
                <Bot size={20} color="#FFFFFF" />
                <Text style={styles.ctaText}>Talk to AI Coach</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowAIChat(true)}
            >
              <View style={styles.secondaryButtonContent}>
                <Mic size={18} color="#00D4FF" />
                <Text style={styles.secondaryButtonText}>Voice Interaction Available</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Dumbbell size={24} color="#00D4FF" />}
              value={userStats.totalWorkouts.toString()}
              label="Workouts"
              color="#00D4FF"
            />
            <StatCard
              icon={<Flame size={24} color="#FF6B6B" />}
              value={`${userStats.currentStreak}`}
              label="Day Streak"
              color="#FF6B6B"
            />
            <StatCard
              icon={<Zap size={24} color="#FFD93D" />}
              value={`${userStats.totalCalories}`}
              label="Calories"
              color="#FFD93D"
            />
            <StatCard
              icon={<Star size={24} color="#A78BFA" />}
              value={`${userStats.level}`}
              label="Level"
              color="#A78BFA"
            />
          </View>
        </View>

        {/* AI Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>AI-Powered Features</Text>
          <Text style={styles.sectionSubtitle}>
            Experience the future of fitness with cutting-edge AI technology
          </Text>

          <View style={styles.featuresGrid}>
            <FeatureCard
              icon={<Eye size={28} color="#FFFFFF" />}
              title="Pose Detection"
              description="Advanced AI analyzes your form in real-time for perfect technique"
              gradient={['#667eea', '#764ba2']}
              delay={0}
            />
            <FeatureCard
              icon={<MessageCircle size={28} color="#FFFFFF" />}
              title="Voice Coaching"
              description="Instant spoken corrections and encouragement during workouts"
              gradient={['#f093fb', '#f5576c']}
              delay={200}
            />
            <FeatureCard
              icon={<Brain size={28} color="#FFFFFF" />}
              title="Adaptive Plans"
              description="Dynamic workouts that evolve with your progress and recovery"
              gradient={['#4facfe', '#00f2fe']}
              delay={400}
            />
            <FeatureCard
              icon={<Shield size={28} color="#FFFFFF" />}
              title="Injury Prevention"
              description="Smart alerts detect risky movements before they cause harm"
              gradient={['#43e97b', '#38f9d7']}
              delay={600}
            />
          </View>
        </View>

        {/* Smart Features */}
        <View style={styles.smartSection}>
          <LinearGradient
            colors={['#1E1E3F', '#2D2D5F']}
            style={styles.smartContainer}
          >
            <Text style={styles.smartTitle}>Smart Training Intelligence</Text>
            
            <View style={styles.smartFeatures}>
              <View style={styles.smartFeature}>
                <View style={styles.smartIcon}>
                  <Target size={20} color="#00D4FF" />
                </View>
                <Text style={styles.smartFeatureText}>Rep Counting</Text>
              </View>
              
              <View style={styles.smartFeature}>
                <View style={styles.smartIcon}>
                  <Activity size={20} color="#FF6B6B" />
                </View>
                <Text style={styles.smartFeatureText}>Form Analysis</Text>
              </View>
              
              <View style={styles.smartFeature}>
                <View style={styles.smartIcon}>
                  <Clock size={20} color="#FFD93D" />
                </View>
                <Text style={styles.smartFeatureText}>Rest Timing</Text>
              </View>
              
              <View style={styles.smartFeature}>
                <View style={styles.smartIcon}>
                  <BarChart3 size={20} color="#A78BFA" />
                </View>
                <Text style={styles.smartFeatureText}>Progress Tracking</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Choose FitBuddy?</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <CheckCircle size={24} color="#00D4FF" />
              <Text style={styles.benefitText}>No equipment needed - bodyweight workouts</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <CheckCircle size={24} color="#00D4FF" />
              <Text style={styles.benefitText}>Works anywhere - home, gym, or outdoors</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <CheckCircle size={24} color="#00D4FF" />
              <Text style={styles.benefitText}>Personalized to your fitness level</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <CheckCircle size={24} color="#00D4FF" />
              <Text style={styles.benefitText}>Injury prevention with smart alerts</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <CheckCircle size={24} color="#00D4FF" />
              <Text style={styles.benefitText}>Cloud sync across all devices</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.finalCTA}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.finalCTAContainer}
          >
            <Sparkles size={32} color="#FFFFFF" />
            <Text style={styles.finalCTATitle}>Ready to Transform?</Text>
            <Text style={styles.finalCTADescription}>
              Join thousands who've revolutionized their fitness with AI coaching
            </Text>
            
            <TouchableOpacity 
              style={styles.finalCTAButton}
              onPress={() => setShowAIChat(true)}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F0F0F0']}
                style={styles.finalCTAGradient}
              >
                <Brain size={20} color="#667eea" />
                <Text style={styles.finalCTAButtonText}>Start AI Journey</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={showAIChat}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <AIChat onClose={() => setShowAIChat(false)} />
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
  heroSection: {
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    width: width * 2,
    height: width * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    top: -50,
    left: -50,
  },
  heroCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    bottom: -30,
    right: -30,
  },
  heroCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    top: 100,
    right: 50,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  heroIconContainer: {
    marginBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D4FF',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  ctaButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4FF',
  },
  statsSection: {
    padding: 24,
    backgroundColor: '#0F0F23',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#1E1E3F',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    fontWeight: '600',
  },
  featuresSection: {
    padding: 24,
    backgroundColor: '#0F0F23',
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  featureGradient: {
    padding: 2,
  },
  featureContent: {
    backgroundColor: 'rgba(30, 30, 63, 0.8)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  smartSection: {
    padding: 24,
    backgroundColor: '#0F0F23',
  },
  smartContainer: {
    borderRadius: 20,
    padding: 24,
  },
  smartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  smartFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  smartFeature: {
    width: (width - 80) / 2,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  smartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartFeatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  benefitsSection: {
    padding: 24,
    backgroundColor: '#0F0F23',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1E1E3F',
    padding: 16,
    borderRadius: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  finalCTA: {
    padding: 24,
    backgroundColor: '#0F0F23',
  },
  finalCTAContainer: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  finalCTADescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  finalCTAButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  finalCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  finalCTAButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  bottomSpacing: {
    height: 40,
  },
});