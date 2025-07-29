import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import {
  Play,
  Heart,
  Clock,
  Flame,
  Trophy,
  Star,
  TrendingUp,
  Target,
  Award,
  X,
  User,
  Zap,
  Crown,
  Sparkles,
  Brain,
  Camera,
  ChevronRight,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { youtubeService, YouTubeVideo } from '@/services/youtubeApi';
import { storageService, UserStats, DailyChallenge, Achievement } from '@/services/storage';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [userStats, setUserStats] = useState<UserStats>({
    totalWorkouts: 0,
    totalCalories: 0,
    currentStreak: 0,
    achievements: 0,
    weeklyWorkouts: 0,
    monthlyWorkouts: 0,
    totalMinutes: 0,
    bestStreak: 0,
    joinDate: new Date().toISOString(),
    level: 1,
    experience: 0
  });
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [featuredWorkouts, setFeaturedWorkouts] = useState<YouTubeVideo[]>([]);
  const [trendingWorkouts, setTrendingWorkouts] = useState<YouTubeVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadInitialData();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadDailyChallenge(),
        loadRecentAchievements(),
        loadFeaturedWorkouts(),
        loadTrendingWorkouts(),
        loadFavorites(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    const stats = await storageService.getUserStats();
    setUserStats(stats);
  };

  const loadDailyChallenge = async () => {
    const challenge = await storageService.getDailyChallenge();
    setDailyChallenge(challenge);
  };

  const loadRecentAchievements = async () => {
    const achievements = await storageService.getRecentAchievements(3);
    setRecentAchievements(achievements);
  };

  const loadFeaturedWorkouts = async () => {
    try {
      const workouts = await youtubeService.getWorkoutsByCategory('fullbody', 4);
      setFeaturedWorkouts(workouts);
    } catch (error) {
      console.error('Error loading featured workouts:', error);
    }
  };

  const loadTrendingWorkouts = async () => {
    try {
      const workouts = await youtubeService.getWorkoutsByCategory('hiit', 6);
      setTrendingWorkouts(workouts);
    } catch (error) {
      console.error('Error loading trending workouts:', error);
    }
  };

  const loadFavorites = async () => {
    const favorites = await storageService.getFavoriteVideos();
    setFavoriteVideos(favorites.map(fav => fav.id));
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const toggleFavorite = async (video: YouTubeVideo) => {
    const isFavorited = favoriteVideos.includes(video.id);
    
    if (isFavorited) {
      await storageService.removeFromFavorites(video.id);
      setFavoriteVideos(prev => prev.filter(id => id !== video.id));
    } else {
      await storageService.addToFavorites({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        duration: video.duration,
        videoId: video.videoId,
        addedAt: new Date().toISOString(),
      });
      setFavoriteVideos(prev => [...prev, video.id]);
    }
  };

  const startWorkout = async (video: YouTubeVideo) => {
    const calories = video.estimatedCalories || 150;
    const minutes = parseInt(video.duration.split(':')[0]) || 15;
    
    const updatedStats = await storageService.incrementWorkout(calories, minutes);
    setUserStats(updatedStats);
    
    await storageService.addWorkoutToHistory({
      videoId: video.videoId,
      title: video.title,
      duration: video.duration,
      calories,
      category: video.difficulty || 'General',
      difficulty: video.difficulty || 'Intermediate',
    });
    
    // Refresh data to show updated progress
    await loadDailyChallenge();
    await loadRecentAchievements();
    
    setSelectedVideo(video);
    setIsVideoModalVisible(true);
    setIsPlaying(true);
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getLevelProgress = (): number => {
    const currentLevelExp = (userStats.level - 1) * 1000;
    const nextLevelExp = userStats.level * 1000;
    const progressExp = userStats.experience - currentLevelExp;
    const levelRange = nextLevelExp - currentLevelExp;
    return (progressExp / levelRange) * 100;
  };

  const handleImageError = (videoId: string) => {
    setImageLoadErrors(prev => new Set([...prev, videoId]));
  };

  const getVideoThumbnail = (video: YouTubeVideo): string => {
    if (imageLoadErrors.has(video.id)) {
      const fallbackImages = [
        'https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800',
      ];
      return fallbackImages[Math.abs(video.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % fallbackImages.length];
    }
    return video.thumbnail;
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => router.push('/interactionAI')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionIcon}>
              <Brain size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionTitle}>AI Coach</Text>
            <Text style={styles.quickActionSubtitle}>Smart Training</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => router.push('/camera')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionIcon}>
              <Camera size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionTitle}>Live Coach</Text>
            <Text style={styles.quickActionSubtitle}>Pose Detection</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => router.push('/workouts1')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionIcon}>
              <Activity size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionTitle}>Workouts</Text>
            <Text style={styles.quickActionSubtitle}>AI Workout</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => router.push('/detector')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#A78BFA', '#8B5CF6']}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionIcon}>
              <User size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionTitle}>Detector</Text>
            <Text style={styles.quickActionSubtitle}>AI Pose Detector
</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <View>
          <Text style={styles.statsTitle}>Your Fitness Journey 🚀</Text>
          <View style={styles.levelContainer}>
            <Crown size={16} color="#F59E0B" />
            <Text style={styles.statsSubtitle}>Level {userStats.level} Champion</Text>
          </View>
        </View>
        <Animated.View 
          style={[
            styles.levelBadge,
            {
              transform: [{
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              }],
            }
          ]}
        >
          <Sparkles size={20} color="#F59E0B" />
        </Animated.View>
      </View>
      
      <View style={styles.levelProgress}>
        <View style={styles.levelProgressBar}>
          <View
            style={[
              styles.levelProgressFill, 
              { width: `${getLevelProgress()}%` }
            ]}
          />
        </View>
        <Text style={styles.levelProgressText}>
          {userStats.experience % 1000}/1000 XP to next level
        </Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Trophy size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{userStats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Flame size={24} color="#EF4444" />
          </View>
          <Text style={styles.statNumber}>{userStats.totalCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
            <TrendingUp size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
            <Award size={24} color="#6366F1" />
          </View>
          <Text style={styles.statNumber}>{userStats.achievements}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>
    </View>
  );

  const renderDailyChallenge = () => {
    if (!dailyChallenge) return null;
    
    const progress = getProgressPercentage(dailyChallenge.current, dailyChallenge.target);
    
    return (
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeIconContainer}>
            <Target size={24} color="#FFFFFF" />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>🎯 {dailyChallenge.title}</Text>
            <Text style={styles.challengeDescription}>{dailyChallenge.description}</Text>
          </View>
          {dailyChallenge.completed && (
            <View style={styles.completedBadge}>
              <Trophy size={20} color="#F59E0B" />
            </View>
          )}
        </View>
        
        <View style={styles.challengeProgress}>
          <View style={styles.challengeProgressBar}>
            <View
              style={[
                styles.challengeProgressFill, 
                { width: `${progress}%` }
              ]}
            />
          </View>
          <Text style={styles.challengeProgressText}>
            {dailyChallenge.current}/{dailyChallenge.target} {dailyChallenge.completed ? '✅' : '⏳'}
          </Text>
        </View>
        
        <Text style={styles.challengeReward}>🎁 Reward: {dailyChallenge.reward}</Text>
      </View>
    );
  };

  const renderRecentAchievements = () => {
    if (recentAchievements.length === 0) return null;
    
    return (
      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Award size={24} color="#F59E0B" />
              </View>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              <Text style={styles.achievementExp}>+{achievement.experience} XP</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedWorkouts = () => (
    <View style={styles.featuredSection}>
      <Text style={styles.sectionTitle}>🌟 Featured Workouts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {featuredWorkouts.map((video) => {
          const isFavorited = favoriteVideos.includes(video.id);
          
          return (
            <TouchableOpacity 
              key={video.id} 
              style={styles.featuredCard}
              onPress={() => startWorkout(video)}
              activeOpacity={0.8}
            >
              <View style={styles.featuredImageContainer}>
                <Image 
                  source={{ uri: getVideoThumbnail(video) }} 
                  style={styles.featuredImage}
                  onError={() => handleImageError(video.id)}
                />
                <View style={styles.featuredOverlay}>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(video);
                    }}
                  >
                    <Heart 
                      size={18} 
                      color={isFavorited ? "#EF4444" : "#6B7280"} 
                      fill={isFavorited ? "#EF4444" : "transparent"}
                    />
                  </TouchableOpacity>
                  <View style={styles.playButtonContainer}>
                    <View style={styles.playButton}>
                      <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle} numberOfLines={2}>{video.title}</Text>
                <View style={styles.featuredChannelContainer}>
                  <View style={styles.featuredChannelAvatar}>
                    <User size={12} color="#6B7280" />
                  </View>
                  <Text style={styles.featuredChannel}>{video.channelTitle}</Text>
                </View>
                <View style={styles.featuredMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color="#6B7280" />
                    <Text style={styles.featuredMetaText}>{video.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Flame size={12} color="#EF4444" />
                    <Text style={styles.featuredMetaText}>{video.estimatedCalories} cal</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTrendingWorkouts = () => (
    <View style={styles.trendingSection}>
      <View style={styles.trendingHeader}>
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        <View style={styles.trendingBadge}>
          <Zap size={16} color="#FFFFFF" />
          <Text style={styles.trendingBadgeText}>HOT</Text>
        </View>
      </View>
      {trendingWorkouts.map((video, index) => {
        const isFavorited = favoriteVideos.includes(video.id);
        
        return (
          <TouchableOpacity 
            key={video.id} 
            style={[styles.trendingCard, { marginBottom: index === trendingWorkouts.length - 1 ? 100 : 16 }]}
            onPress={() => startWorkout(video)}
            activeOpacity={0.8}
          >
            <View style={styles.trendingImageContainer}>
              <Image 
                source={{ uri: getVideoThumbnail(video) }} 
                style={styles.trendingImage}
                onError={() => handleImageError(video.id)}
              />
              <View style={styles.trendingImageOverlay}>
                <View style={styles.trendingPlayButton}>
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            </View>
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingTitle} numberOfLines={2}>{video.title}</Text>
              <View style={styles.trendingChannelContainer}>
                <View style={styles.trendingChannelAvatar}>
                  <User size={10} color="#6B7280" />
                </View>
                <Text style={styles.trendingChannel}>{video.channelTitle}</Text>
              </View>
              <View style={styles.trendingMeta}>
                <View style={styles.metaItem}>
                  <Clock size={12} color="#6B7280" />
                  <Text style={styles.trendingMetaText}>{video.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Flame size={12} color="#EF4444" />
                  <Text style={styles.trendingMetaText}>{video.estimatedCalories} cal</Text>
                </View>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(video);
                  }}
                  style={styles.heartButton}
                >
                  <Heart 
                    size={14} 
                    color={isFavorited ? "#EF4444" : "#6B7280"} 
                    fill={isFavorited ? "#EF4444" : "transparent"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderVideoModal = () => (
    <Modal
      visible={isVideoModalVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsVideoModalVisible(false)}
    >
      {selectedVideo && (
        <View style={styles.videoModal}>
          <View style={styles.videoPlayerContainer}>
            <YoutubePlayer
              height={height * 0.4}
              play={isPlaying}
              videoId={selectedVideo.videoId}
              onChangeState={(state) => {
                if (state === 'ended') {
                  setIsPlaying(false);
                }
              }}
              webViewStyle={styles.youtubePlayer}
              webViewProps={{
                androidLayerType: Platform.OS === 'android' ? 'hardware' : undefined,
              }}
            />
            <TouchableOpacity 
              style={styles.closeVideoButton}
              onPress={() => {
                setIsVideoModalVisible(false);
                setIsPlaying(false);
              }}
            >
              <BlurView intensity={80} style={styles.closeButtonBlur}>
                <X size={24} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
          </View>
          <View style={styles.videoModalInfo}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.videoModalTitle}>{selectedVideo.title}</Text>
              <Text style={styles.videoModalChannel}>{selectedVideo.channelTitle}</Text>
              <View style={styles.videoModalMeta}>
                <View style={styles.metaItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.videoModalMetaText}>{selectedVideo.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Flame size={16} color="#EF4444" />
                  <Text style={styles.videoModalMetaText}>{selectedVideo.estimatedCalories} cal</Text>
                </View>
                <View style={styles.metaItem}>
                  <Target size={16} color="#10B981" />
                  <Text style={styles.videoModalMetaText}>{selectedVideo.difficulty}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.playControlButton}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <View style={styles.playControlGradient}>
                  <Play size={20} color="#FFFFFF" />
                  <Text style={styles.playControlText}>
                    {isPlaying ? 'Pause Workout' : 'Start Workout'}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your fitness journey...</Text>
        <Text style={styles.loadingSubtext}>Get ready to crush your goals! 💪</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Good morning, Champion! 👋</Text>
          <Text style={styles.headerSubtitle}>Ready to dominate your workout?</Text>
        </View>

        {renderQuickActions()}
        {renderStatsCard()}
        {renderDailyChallenge()}
        {renderRecentAchievements()}
        {renderFeaturedWorkouts()}
        {renderTrendingWorkouts()}
      </ScrollView>

      {renderVideoModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickActionsSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelProgress: {
    marginBottom: 24,
  },
  levelProgressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 5,
  },
  levelProgressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  challengeCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  completedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeProgress: {
    marginBottom: 12,
  },
  challengeProgressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  challengeProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  challengeReward: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementCard: {
    width: 160,
    marginLeft: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementExp: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredSection: {
    marginBottom: 24,
  },
  featuredCard: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImageContainer: {
    height: 140,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 12,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  playButtonContainer: {
    alignSelf: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  durationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  durationText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  featuredChannelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredChannelAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  featuredChannel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  trendingSection: {
    paddingHorizontal: 20,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  trendingBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  trendingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendingImageContainer: {
    width: 140,
    height: 100,
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  trendingImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  trendingChannelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendingChannelAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  trendingChannel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendingMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  heartButton: {
    padding: 4,
  },
  videoModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPlayerContainer: {
    height: height * 0.4,
    position: 'relative',
    backgroundColor: '#000000',
  },
  youtubePlayer: {
    backgroundColor: '#000000',
  },
  closeVideoButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalInfo: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  videoModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  videoModalChannel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  videoModalMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  videoModalMetaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  playControlButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#3B82F6',
  },
  playControlGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  playControlText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});