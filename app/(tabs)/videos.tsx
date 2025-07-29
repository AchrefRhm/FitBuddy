import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { 
  Play, 
  Heart, 
  Share, 
  Bookmark, 
  Clock, 
  Flame, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  X, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  User,
  Zap,
  Star,
  Crown,
  Sparkles,
  TrendingUp,
  Pause
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import YoutubePlayer from 'react-native-youtube-iframe';
import { storageService } from '@/services/storage';
import Toast from 'react-native-toast-message';
import { youtubeService, YouTubeVideo, WORKOUT_CATEGORIES } from '@/services/youtubeApi';

const { width, height } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  count: number;
  icon: string;
  gradient: string[];
}

interface FavoriteVideo extends YouTubeVideo {
  isFavorited: boolean;
  isLiked: boolean;
  addedToFavorites: string;
}

const categories: Category[] = [
  { id: 'trending', name: 'Trending', count: 0, icon: '🔥', gradient: ['#FF6B35', '#FF8E53'] },
  { id: 'all', name: 'All', count: 0, icon: '🌟', gradient: ['#667eea', '#764ba2'] },
  { id: 'new', name: 'New', count: 0, icon: '✨', gradient: ['#10B981', '#34D399'] },
  { id: 'hiit', name: 'HIIT', count: 0, icon: '⚡', gradient: ['#EF4444', '#F87171'] },
  { id: 'yoga', name: 'Yoga', count: 0, icon: '🧘‍♀️', gradient: ['#8B5CF6', '#A855F7'] },
  { id: 'strength', name: 'Strength', count: 0, icon: '💪', gradient: ['#F59E0B', '#FBBF24'] },
  { id: 'cardio', name: 'Cardio', count: 0, icon: '❤️', gradient: ['#EC4899', '#F472B6'] },
];

export default function VideosScreen() {
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<any>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    loadVideos('trending');
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

  const loadVideos = async (category: string) => {
    setIsLoading(true);
    try {
      let newVideos: YouTubeVideo[] = [];
      
      if (category === 'all') {
        // Load a mix of different categories
        const [trending, hiit, yoga] = await Promise.all([
          youtubeService.getTrendingWorkouts(),
          youtubeService.getWorkoutsByCategory('hiit', 5),
          youtubeService.getWorkoutsByCategory('yoga', 5),
        ]);
        newVideos = [...trending.slice(0, 5), ...hiit, ...yoga];
      } else if (category === 'trending') {
        newVideos = await youtubeService.getTrendingWorkouts();
      } else if (category === 'new') {
        newVideos = await youtubeService.getNewWorkouts();
      } else {
        newVideos = await youtubeService.getWorkoutsByCategory(category, 15);
      }
      
      // Remove duplicates based on video ID
      const uniqueVideos = newVideos.filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      );
      
      setVideos(uniqueVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    loadVideos(category);
  };

  const refreshVideos = () => {
    loadVideos(selectedCategory);
  };

  const toggleFavorite = (video: YouTubeVideo) => {
    const existingFavorite = favoriteVideos.find(fav => fav.id === video.id);
    
    if (existingFavorite) {
      // Remove from favorites
      setFavoriteVideos(prev => prev.filter(fav => fav.id !== video.id));
    } else {
      // Add to favorites
      const favoriteVideo: FavoriteVideo = {
        ...video,
        isFavorited: true,
        isLiked: false,
        addedToFavorites: new Date().toISOString(),
      };
      setFavoriteVideos(prev => [...prev, favoriteVideo]);
    }
  };

  const toggleLike = (videoId: string) => {
    setFavoriteVideos(prev =>
      prev.map(video =>
        video.id === videoId
          ? { ...video, isLiked: !video.isLiked }
          : video
      )
    );
  };

  const isVideoFavorited = (videoId: string) => {
    return favoriteVideos.some(fav => fav.id === videoId);
  };

  const isVideoLiked = (videoId: string) => {
    const favorite = favoriteVideos.find(fav => fav.id === videoId);
    return favorite?.isLiked || false;
  };

  const openVideoModal = (video: YouTubeVideo) => {
    // Track video view and add to fitness journey
    trackVideoView(video);
    setSelectedVideo(video);
    setIsVideoModalVisible(true);
    setIsPlaying(false); // Start paused to ensure proper loading
  };

  const closeVideoModal = () => {
    setIsVideoModalVisible(false);
    setSelectedVideo(null);
    setIsPlaying(false);
  };

  const trackVideoView = async (video: YouTubeVideo) => {
    try {
      const calories = video.estimatedCalories || 150;
      const minutes = parseInt(video.duration.split(':')[0]) || 15;
      
      // Calculate XP reward
      const baseXP = 30; // Base XP for watching a video
      const durationBonus = Math.floor(minutes / 5) * 8; // 8 XP per 5 minutes
      const difficultyBonus = video.difficulty === 'Advanced' ? 20 : 
                             video.difficulty === 'Intermediate' ? 15 : 10;
      const categoryBonus = video.category === 'HIIT' ? 10 : 5; // Extra for HIIT
      const totalXP = baseXP + durationBonus + difficultyBonus + categoryBonus;
      
      // Update user stats
      const updatedStats = await storageService.incrementWorkout(calories, minutes);
      updatedStats.experience += totalXP;
      updatedStats.level = Math.floor(updatedStats.experience / 1000) + 1;
      await storageService.updateUserStats(updatedStats);
      
      // Add to workout history
      await storageService.addWorkoutToHistory({
        videoId: video.videoId,
        title: video.title,
        duration: video.duration,
        calories,
        category: video.category || 'General',
        difficulty: video.difficulty || 'Intermediate',
      });
      
      // Show reward notification
      Toast.show({
        type: 'success',
        text1: `🎉 +${totalXP} XP Earned!`,
        text2: `Great choice! Enjoy your ${video.duration} ${video.category || 'workout'}!`,
        position: 'top',
        visibilityTime: 3000,
      });
      
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const onStateChange = (state: string) => {
    if (state === 'ended') {
      setIsPlaying(false);
      // Award completion bonus when video ends
      if (selectedVideo) {
        awardCompletionBonus(selectedVideo);
      }
    }
  };

  const awardCompletionBonus = async (video: YouTubeVideo) => {
    try {
      const completionXP = 50; // Bonus XP for completing video
      const stats = await storageService.getUserStats();
      stats.experience += completionXP;
      stats.level = Math.floor(stats.experience / 1000) + 1;
      await storageService.updateUserStats(stats);
      
      Toast.show({
        type: 'success',
        text1: '🏆 Workout Completed!',
        text2: `+${completionXP} XP bonus for finishing the video!`,
        position: 'top',
        visibilityTime: 4000,
      });
    } catch (error) {
      console.error('Error awarding completion bonus:', error);
    }
  };

  const getDifficultyFromTitle = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('beginner') || lowerTitle.includes('easy') || lowerTitle.includes('gentle')) {
      return 'Beginner';
    }
    if (lowerTitle.includes('advanced') || lowerTitle.includes('intense') || lowerTitle.includes('extreme')) {
      return 'Advanced';
    }
    return 'Intermediate';
  };

  const getCaloriesFromDuration = (duration: string): string => {
    const minutes = parseInt(duration.split(':')[0]) || 0;
    const estimatedCalories = Math.round(minutes * 8); // Rough estimate: 8 calories per minute
    return `${estimatedCalories} cal`;
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

  const renderCategoryButton = (category: Category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive,
      ]}
      onPress={() => handleCategoryChange(category.id)}
      activeOpacity={0.8}
    >
      {selectedCategory === category.id ? (
        <LinearGradient
          colors={category.gradient}
          style={styles.categoryButtonGradient}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryButtonTextActive}>
            {category.name}
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.categoryButtonInactive}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryButtonText}>
            {category.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderVideoCard = ({ item: video }: { item: YouTubeVideo }) => {
    const difficulty = getDifficultyFromTitle(video.title);
    const calories = getCaloriesFromDuration(video.duration);
    const isFavorited = isVideoFavorited(video.id);
    const isLiked = isVideoLiked(video.id);

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => openVideoModal(video)}
        activeOpacity={0.9}
      >
        <View style={styles.videoThumbnailContainer}>
          <Image 
            source={{ uri: getVideoThumbnail(video) }} 
            style={styles.videoThumbnail}
            onError={() => handleImageError(video.id)}
          />
          
          {/* Video Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.videoOverlay}
          >
            {/* New Badge for recent videos */}
            {new Date(video.publishedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
              <View style={styles.newBadge}>
                <Sparkles size={12} color="#FFFFFF" />
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            
            {/* Play Button */}
            <Animated.View 
              style={[
                styles.playButtonContainer,
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
              <LinearGradient
                colors={['#FF6B35', '#FF8E53']}
                style={styles.playButton}
              >
                <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
            
            {/* Duration */}
            <View style={styles.durationBadge}>
              <Clock size={12} color="#FFFFFF" />
              <Text style={styles.durationText}>{video.duration}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Video Info */}
        <View style={styles.videoInfo}>
          <View style={styles.videoHeader}>
            <View style={styles.trainerAvatar}>
              <User size={16} color="#64748B" />
            </View>
            <View style={styles.videoTitleContainer}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={styles.trainerName}>{video.channelTitle}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => toggleFavorite(video)}
              style={styles.favoriteButtonContainer}
            >
              <Bookmark
                size={20}
                color={isFavorited ? '#FF6B35' : '#94A3B8'}
                fill={isFavorited ? '#FF6B35' : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.videoMeta}>
            <View style={styles.metaItem}>
              <Clock size={14} color="#64748B" />
              <Text style={styles.metaText}>{video.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Flame size={14} color="#FF6B35" />
              <Text style={styles.metaText}>{calories}</Text>
            </View>
            <View style={styles.metaItem}>
              <Eye size={14} color="#64748B" />
              <Text style={styles.metaText}>{video.viewCount}</Text>
            </View>
          </View>

          <View style={styles.videoActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleLike(video.id)}
            >
              <ThumbsUp
                size={16}
                color={isLiked ? '#FF6B35' : '#64748B'}
                fill={isLiked ? '#FF6B35' : 'transparent'}
              />
              <Text style={[
                styles.actionText,
                isLiked && styles.actionTextActive
              ]}>
                {video.likeCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={16} color="#64748B" />
              <Text style={styles.actionText}>Comments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Share size={16} color="#64748B" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <View style={[
              styles.difficultyBadge,
              difficulty === 'Beginner' && styles.beginnerBadge,
              difficulty === 'Intermediate' && styles.intermediateBadge,
              difficulty === 'Advanced' && styles.advancedBadge,
            ]}>
              <Text style={[
                styles.difficultyText,
                difficulty === 'Beginner' && styles.beginnerText,
                difficulty === 'Intermediate' && styles.intermediateText,
                difficulty === 'Advanced' && styles.advancedText,
              ]}>
                {difficulty}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVideoModal = () => (
    <Modal
      visible={isVideoModalVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeVideoModal}
    >
      {selectedVideo && (
        <View style={styles.modalContainer}>
          {/* YouTube Video Player */}
          <View style={styles.videoPlayerContainer}>
            <YoutubePlayer
              height={height * 0.4}
              width={width}
              play={isPlaying}
              videoId={selectedVideo.videoId}
              initialPlayerParams={{
                cc_lang_pref: 'en',
                showClosedCaptions: false,
                preventFullScreen: false,
                playsInline: true,
                modestbranding: true,
                rel: false,
                showinfo: false,
              }}
              onChangeState={onStateChange}
              onReady={() => {
                console.log('YouTube player ready');
              }}
              onError={(error) => {
                if (error === 'embed_not_allowed') {
                  // Handle embed restriction gracefully
                  setIsPlaying(false);
                } else {
                  console.log('YouTube player error:', error);
                }
              }}
              webViewStyle={styles.youtubePlayer}
              webViewProps={{
                androidLayerType: Platform.OS === 'android' ? 'hardware' : undefined,
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
                javaScriptEnabled: true,
                domStorageEnabled: true,
                startInLoadingState: true,
                scalesPageToFit: true,
              }}
            />
            
            {/* Video Controls Overlay */}
            <View style={styles.videoControlsOverlay}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeVideoModal}
              >
                <BlurView intensity={80} style={styles.controlButton}>
                  <X size={24} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <BlurView intensity={80} style={styles.controlButton}>
                  {isPlaying ? (
                    <Pause size={24} color="#FFFFFF" />
                  ) : (
                    <Play size={24} color="#FFFFFF" />
                  )}
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          {/* Video Details */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.modalVideoInfo}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTrainerInfo}>
                  <View style={styles.modalTrainerAvatar}>
                    <User size={20} color="#64748B" />
                  </View>
                  <View style={styles.modalTrainerDetails}>
                    <Text style={styles.modalVideoTitle}>{selectedVideo.title}</Text>
                    <Text style={styles.modalTrainerName}>{selectedVideo.channelTitle}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalFavoriteButton}
                  onPress={() => toggleFavorite(selectedVideo)}
                >
                  <Heart
                    size={24}
                    color={isVideoFavorited(selectedVideo.id) ? '#FF6B35' : '#64748B'}
                    fill={isVideoFavorited(selectedVideo.id) ? '#FF6B35' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription} numberOfLines={3}>
                {selectedVideo.description || 'Follow along with this amazing workout routine designed to help you achieve your fitness goals! Get ready to sweat, burn calories, and transform your body with this expertly crafted fitness session.'}
              </Text>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Eye size={16} color="#64748B" />
                  <Text style={styles.modalStatText}>{selectedVideo.viewCount} views</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <ThumbsUp size={16} color="#64748B" />
                  <Text style={styles.modalStatText}>{selectedVideo.likeCount} likes</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Clock size={16} color="#64748B" />
                  <Text style={styles.modalStatText}>{selectedVideo.duration}</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Flame size={16} color="#FF6B35" />
                  <Text style={styles.modalStatText}>{getCaloriesFromDuration(selectedVideo.duration)}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.startWorkoutButton}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8E53']}
                  style={styles.startWorkoutGradient}
                >
                  <Play size={20} color="#FFFFFF" />
                  <Text style={styles.startWorkoutText}>
                    {isPlaying ? 'Pause Workout' : 'Start Workout'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#E2E8F0']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Workout Videos 🎬</Text>
            <Text style={styles.headerSubtitle}>Discover amazing fitness content</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={refreshVideos}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#94A3B8', '#CBD5E1'] : ['#FF6B35', '#FF8E53']}
                style={styles.headerButtonGradient}
              >
                <RefreshCw size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.headerButtonGradient}
              >
                <Heart size={20} color="#FFFFFF" />
                {favoriteVideos.length > 0 && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>{favoriteVideos.length}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map(renderCategoryButton)}
          </ScrollView>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.loadingGradient}
            >
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading awesome workouts...</Text>
              <Text style={styles.loadingSubtext}>Get ready to sweat! 💪</Text>
            </LinearGradient>
          </View>
        )}

        {/* Videos List */}
        {!isLoading && (
          <FlatList
            data={videos}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.videosList}
            refreshing={isLoading}
            onRefresh={refreshVideos}
          />
        )}

        {/* Video Modal */}
        {renderVideoModal()}
        
        {/* Toast Messages */}
        <Toast />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  headerButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  categoryButtonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryButtonTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  videosList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  videoThumbnailContainer: {
    height: 220,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playButtonContainer: {
    alignSelf: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  videoInfo: {
    padding: 20,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trainerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoTitleContainer: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  trainerName: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  favoriteButtonContainer: {
    padding: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#FF6B35',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  beginnerBadge: {
    backgroundColor: '#DCFCE7',
  },
  intermediateBadge: {
    backgroundColor: '#FEF3C7',
  },
  advancedBadge: {
    backgroundColor: '#FEE2E2',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  beginnerText: {
    color: '#16A34A',
  },
  intermediateText: {
    color: '#D97706',
  },
  advancedText: {
    color: '#DC2626',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPlayerContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  youtubePlayer: {
    backgroundColor: '#000000',
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    pointerEvents: 'box-none',
  },
  closeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  playButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVideoInfo: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTrainerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTrainerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTrainerDetails: {
    flex: 1,
  },
  modalVideoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalTrainerName: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalFavoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 20,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalStatText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  startWorkoutButton: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  startWorkoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});