import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  FlatList,
  StatusBar,
} from 'react-native';
import { Search, Filter, Clock, Flame, Star, Play, Heart, X, ChevronDown, TrendingUp, Zap, Target, Award, Users, Calendar, Grid3x3 as Grid3X3, List, SlidersHorizontal, Sparkles, Trophy, Timer, Activity, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import YoutubePlayer from 'react-native-youtube-iframe';
import { youtubeService, YouTubeVideo, WORKOUT_CATEGORIES } from '@/services/youtubeApi';
import { storageService } from '@/services/storage';

const { width, height } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: any;
  gradient: string[];
  count: number;
  description: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  participants: number;
  reward: string;
  gradient: string[];
  icon: any;
}

const categories: Category[] = [
  { 
    id: 'all', 
    name: 'All Workouts', 
    icon: Grid3X3, 
    gradient: ['#667eea', '#764ba2'], 
    count: 0,
    description: 'Complete collection of fitness videos'
  },
  { 
    id: 'hiit', 
    name: 'HIIT', 
    icon: Zap, 
    gradient: ['#FF6B6B', '#FF8E53'], 
    count: 0,
    description: 'High-intensity interval training'
  },
  { 
    id: 'yoga', 
    name: 'Yoga', 
    icon: Target, 
    gradient: ['#4ECDC4', '#44A08D'], 
    count: 0,
    description: 'Mindful movement and flexibility'
  },
  { 
    id: 'strength', 
    name: 'Strength', 
    icon: Award, 
    gradient: ['#A8E6CF', '#7FCDCD'], 
    count: 0,
    description: 'Build muscle and power'
  },
  { 
    id: 'cardio', 
    name: 'Cardio', 
    icon: Heart, 
    gradient: ['#FFD93D', '#FF6B6B'], 
    count: 0,
    description: 'Heart-pumping endurance'
  },
  { 
    id: 'core', 
    name: 'Core', 
    icon: Target, 
    gradient: ['#6C5CE7', '#A29BFE'], 
    count: 0,
    description: 'Strengthen your center'
  },
  { 
    id: 'fullbody', 
    name: 'Full Body', 
    icon: Users, 
    gradient: ['#FD79A8', '#FDCB6E'], 
    count: 0,
    description: 'Complete body transformation'
  },
];

const challenges: Challenge[] = [
  {
    id: '1',
    title: '30-Day HIIT Challenge',
    description: 'Transform your body with high-intensity workouts',
    duration: '30 days',
    difficulty: 'Intermediate',
    participants: 12847,
    reward: '500 XP + Badge',
    gradient: ['#FF6B6B', '#FF8E53'],
    icon: Zap,
  },
  {
    id: '2',
    title: 'Yoga Flexibility Journey',
    description: 'Improve flexibility and find inner peace',
    duration: '21 days',
    difficulty: 'Beginner',
    participants: 8934,
    reward: '300 XP + Badge',
    gradient: ['#4ECDC4', '#44A08D'],
    icon: Target,
  },
  {
    id: '3',
    title: 'Strength Builder Pro',
    description: 'Build serious muscle and strength',
    duration: '45 days',
    difficulty: 'Advanced',
    participants: 5672,
    reward: '750 XP + Badge',
    gradient: ['#A8E6CF', '#7FCDCD'],
    icon: Award,
  },
];

const difficultyFilters = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const durationFilters = ['All', 'Short (5-15min)', 'Medium (15-30min)', 'Long (30min+)'];
const sortOptions = ['Popular', 'Recent', 'Duration', 'Difficulty'];

export default function WorkoutsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [workouts, setWorkouts] = useState<YouTubeVideo[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<YouTubeVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerHeight = useRef(new Animated.Value(200)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadInitialData();
    startAnimations();
  }, []);

  useEffect(() => {
    filterWorkouts();
  }, [workouts, searchQuery, selectedCategory, selectedDifficulty, selectedDuration, sortBy]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadWorkouts(),
        loadFavorites(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkouts = async () => {
    try {
      const allWorkouts: YouTubeVideo[] = [];
      
      // Load more videos per category for better pagination
      const categoryPromises = Object.keys(WORKOUT_CATEGORIES).map(category => 
        youtubeService.getWorkoutsByCategory(category, 8)
      );
      
      const categoryResults = await Promise.all(categoryPromises);
      categoryResults.forEach(categoryWorkouts => {
        allWorkouts.push(...categoryWorkouts);
      });
      
      // Add trending and new workouts
      const [trending, newWorkouts] = await Promise.all([
        youtubeService.getTrendingWorkouts(15),
        youtubeService.getNewWorkouts(10),
      ]);
      
      allWorkouts.push(...trending, ...newWorkouts);
      
      // Remove duplicates and shuffle for variety
      const uniqueWorkouts = allWorkouts.filter((workout, index, self) => 
        index === self.findIndex(w => w.id === workout.id)
      );
      
      const shuffledWorkouts = uniqueWorkouts.sort(() => Math.random() - 0.5);
      setWorkouts(shuffledWorkouts);
      
      // Update category counts
      categories.forEach(category => {
        if (category.id === 'all') {
          category.count = shuffledWorkouts.length;
        } else {
          category.count = shuffledWorkouts.filter(w => 
            w.category?.toLowerCase().includes(category.name.toLowerCase()) ||
            w.title.toLowerCase().includes(category.name.toLowerCase())
          ).length;
        }
      });
      
    } catch (error) {
      console.error('Error loading workouts:', error);
      setWorkouts([]);
    }
  };

  const loadFavorites = async () => {
    const favorites = await storageService.getFavoriteVideos();
    setFavoriteVideos(favorites.map(fav => fav.id));
  };

  const filterWorkouts = () => {
    let filtered = [...workouts];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(workout =>
        workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workout.channelTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workout.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const categoryKeywords = {
        fullbody: ['full body', 'total body', 'whole body'],
        core: ['core', 'abs', 'abdominal'],
        hiit: ['hiit', 'high intensity', 'interval', 'tabata'],
        yoga: ['yoga', 'flow', 'vinyasa', 'meditation'],
        strength: ['strength', 'muscle', 'weight', 'resistance'],
        cardio: ['cardio', 'aerobic', 'heart', 'endurance']
      };

      const keywords = categoryKeywords[selectedCategory as keyof typeof categoryKeywords] || [];
      filtered = filtered.filter(workout =>
        keywords.some(keyword => {
          const titleMatch = workout.title.toLowerCase().includes(keyword);
          const descriptionMatch = workout.description?.toLowerCase().includes(keyword);
          const categoryMatch = workout.category?.toLowerCase().includes(keyword);
          return titleMatch || descriptionMatch || categoryMatch;
        })
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(workout =>
        workout.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Duration filter
    if (selectedDuration !== 'All') {
      filtered = filtered.filter(workout => {
        const [minutes] = workout.duration.split(':').map(Number);
        switch (selectedDuration) {
          case 'Short (5-15min)':
            return minutes >= 5 && minutes <= 15;
          case 'Medium (15-30min)':
            return minutes > 15 && minutes <= 30;
          case 'Long (30min+)':
            return minutes > 30;
          default:
            return true;
        }
      });
    }

    // Sort filter
    switch (sortBy) {
      case 'Popular':
        filtered.sort((a, b) => parseInt(b.viewCount.replace(/[^\d]/g, '')) - parseInt(a.viewCount.replace(/[^\d]/g, '')));
        break;
      case 'Recent':
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'Duration':
        filtered.sort((a, b) => {
          const aDuration = parseInt(a.duration.split(':')[0]);
          const bDuration = parseInt(b.duration.split(':')[0]);
          return aDuration - bDuration;
        });
        break;
      case 'Difficulty':
        const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
        filtered.sort((a, b) => {
          const aLevel = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2;
          const bLevel = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2;
          return aLevel - bLevel;
        });
        break;
    }

    setFilteredWorkouts(filtered);
    setCurrentPage(1);
  };

  const loadMoreWorkouts = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    // Simulate loading more content
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 1000);
  };

  const getPaginatedWorkouts = () => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredWorkouts.slice(startIndex, endIndex);
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
    await storageService.incrementWorkout(calories);
    
    await storageService.addWorkoutToHistory({
      videoId: video.videoId,
      title: video.title,
      duration: video.duration,
      calories,
      category: video.category || 'General',
      difficulty: video.difficulty || 'Intermediate',
    });
    
    setSelectedVideo(video);
    setIsVideoModalVisible(true);
  };

  const handleImageError = (videoId: string) => {
    setImageLoadErrors(prev => new Set([...prev, videoId]));
  };

  const getVideoThumbnail = (video: YouTubeVideo): string => {
    if (imageLoadErrors.has(video.id)) {
      // Return a fitness-themed fallback image
      const fallbackImages = [
        'https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800'
      ];
      return fallbackImages[Math.abs(video.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % fallbackImages.length];
    }
    return video.thumbnail;
  };

  const renderAnimatedHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const headerScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.95],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
          }
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <StatusBar barStyle="light-content" backgroundColor="#667eea" />
          
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Workouts</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredWorkouts.length} amazing workouts
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.challengeButton}
                onPress={() => setShowChallenges(true)}
              >
                <Sparkles size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search workouts..."
                  placeholderTextColor="#8E8E93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity 
                  style={styles.filterIconButton}
                  onPress={() => setShowFilters(true)}
                >
                  <SlidersHorizontal size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.quickFilters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.quickFiltersContent}>
                  <TouchableOpacity 
                    style={[styles.quickFilter, sortBy === 'Popular' && styles.quickFilterActive]}
                    onPress={() => setSortBy('Popular')}
                  >
                    <TrendingUp size={16} color={sortBy === 'Popular' ? '#FFFFFF' : '#667eea'} />
                    <Text style={[styles.quickFilterText, sortBy === 'Popular' && styles.quickFilterTextActive]}>
                      Popular
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.quickFilter, sortBy === 'Recent' && styles.quickFilterActive]}
                    onPress={() => setSortBy('Recent')}
                  >
                    <Calendar size={16} color={sortBy === 'Recent' ? '#FFFFFF' : '#667eea'} />
                    <Text style={[styles.quickFilterText, sortBy === 'Recent' && styles.quickFilterTextActive]}>
                      New
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.quickFilter, viewMode === 'grid' && styles.quickFilterActive]}
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? 
                      <Grid3X3 size={16} color="#FFFFFF" /> : 
                      <List size={16} color="#667eea" />
                    }
                    <Text style={[styles.quickFilterText, viewMode === 'grid' && styles.quickFilterTextActive]}>
                      {viewMode === 'grid' ? 'Grid' : 'List'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderCategories = () => (
    <Animated.View 
      style={[
        styles.categoriesSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category, index) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Animated.View
              key={category.id}
              style={{
                opacity: fadeAnim,
                transform: [
                  { 
                    translateX: Animated.multiply(
                      slideAnim,
                      new Animated.Value(index * 0.1)
                    )
                  }
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSelected ? category.gradient : ['#FFFFFF', '#F8F9FA']}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    isSelected && styles.categoryIconSelected
                  ]}>
                    <IconComponent 
                      size={24} 
                      color={isSelected ? '#FFFFFF' : category.gradient[0]} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    isSelected && styles.categoryNameSelected
                  ]}>
                    {category.name}
                  </Text>
                  <Text style={[
                    styles.categoryCount,
                    isSelected && styles.categoryCountSelected
                  ]}>
                    {category.count} videos
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderWorkoutCard = (video: YouTubeVideo, index: number) => {
    const isFavorited = favoriteVideos.includes(video.id);
    
    if (viewMode === 'list') {
      return (
        <Animated.View
          key={video.id}
          style={[
            styles.listWorkoutCard,
            {
              opacity: fadeAnim,
              transform: [
                { 
                  translateX: Animated.multiply(
                    slideAnim,
                    new Animated.Value(index * 0.05)
                  )
                }
              ],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.listWorkoutContent}
            onPress={() => startWorkout(video)}
            activeOpacity={0.9}
          >
            <View style={styles.listImageContainer}>
              <Image 
                source={{ uri: getVideoThumbnail(video) }} 
                style={styles.listWorkoutImage}
                onError={() => handleImageError(video.id)}
                defaultSource={{ uri: 'https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800' }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.listImageOverlay}
              />
              <View style={styles.listPlayButton}>
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.listWorkoutInfo}>
              <Text style={styles.listWorkoutTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={styles.listWorkoutChannel}>{video.channelTitle}</Text>
              
              <View style={styles.listWorkoutMeta}>
                <View style={styles.listMetaItem}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.listMetaText}>{video.duration}</Text>
                </View>
                <View style={styles.listMetaItem}>
                  <Flame size={12} color="#64748B" />
                  <Text style={styles.listMetaText}>{video.estimatedCalories} cal</Text>
                </View>
                <View style={styles.listMetaItem}>
                  <Star size={12} color="#FFD700" />
                  <Text style={styles.listMetaText}>{video.difficulty}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.listFavoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(video);
              }}
            >
              <Heart 
                size={20} 
                color={isFavorited ? "#FF6B6B" : "#94A3B8"} 
                fill={isFavorited ? "#FF6B6B" : "transparent"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={video.id}
        style={[
          styles.gridWorkoutCard,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: Animated.multiply(
                  slideAnim,
                  new Animated.Value(index * 0.1)
                )
              }
            ],
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => startWorkout(video)}
          activeOpacity={0.9}
        >
          <View style={styles.workoutImageContainer}>
            <Image 
              source={{ uri: getVideoThumbnail(video) }} 
              style={styles.workoutImage}
              onError={() => handleImageError(video.id)}
              defaultSource={{ uri: 'https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              resizeMode="cover"
            />
            
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.workoutOverlay}
            />
            
            <View style={styles.workoutBadges}>
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(video);
                }}
              >
                <BlurView intensity={20} style={styles.favoriteBlur}>
                  <Heart 
                    size={14} 
                    color={isFavorited ? "#FF6B6B" : "#FFFFFF"} 
                    fill={isFavorited ? "#FF6B6B" : "transparent"}
                  />
                </BlurView>
              </TouchableOpacity>
              
              <View style={styles.durationBadge}>
                <BlurView intensity={20} style={styles.durationBlur}>
                  <Clock size={10} color="#FFFFFF" />
                  <Text style={styles.durationText}>{video.duration}</Text>
                </BlurView>
              </View>
            </View>
            
            <View style={styles.playButton}>
              <BlurView intensity={20} style={styles.playButtonBlur}>
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              </BlurView>
            </View>
          </View>
          
          <View style={styles.workoutDetails}>
            <Text style={styles.workoutTitle} numberOfLines={2}>{video.title}</Text>
            <Text style={styles.workoutChannel}>{video.channelTitle}</Text>
            
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Flame size={12} color="#FF6B6B" />
                <Text style={styles.metaText}>{video.estimatedCalories} cal</Text>
              </View>
              <View style={styles.metaItem}>
                <Star size={12} color="#FFD700" />
                <Text style={styles.metaText}>{video.difficulty}</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={12} color="#4ECDC4" />
                <Text style={styles.metaText}>{video.viewCount}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filtersModal}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.filtersHeader}
        >
          <View style={styles.filtersHeaderContent}>
            <Text style={styles.filtersTitle}>Advanced Filters</Text>
            <TouchableOpacity 
              style={styles.closeFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        <ScrollView style={styles.filtersContent} showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Difficulty Level</Text>
            <View style={styles.filterOptions}>
              {difficultyFilters.map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterOption,
                    selectedDifficulty === difficulty && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedDifficulty(difficulty)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedDifficulty === difficulty && styles.filterOptionTextSelected
                  ]}>
                    {difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Workout Duration</Text>
            <View style={styles.filterOptions}>
              {durationFilters.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.filterOption,
                    selectedDuration === duration && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedDuration(duration)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedDuration === duration && styles.filterOptionTextSelected
                  ]}>
                    {duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    sortBy === option && styles.filterOptionSelected
                  ]}
                  onPress={() => setSortBy(option)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    sortBy === option && styles.filterOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.filtersFooter}>
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedDifficulty('All');
              setSelectedDuration('All');
              setSortBy('Popular');
              setSelectedCategory('all');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.applyFiltersGradient}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderChallengesModal = () => (
    <Modal
      visible={showChallenges}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowChallenges(false)}
    >
      <View style={styles.challengesModal}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.challengesHeader}
        >
          <StatusBar barStyle="light-content" />
          <View style={styles.challengesHeaderContent}>
            <View>
              <Text style={styles.challengesTitle}>Fitness Challenges</Text>
              <Text style={styles.challengesSubtitle}>Push your limits & earn rewards</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeChallengesButton}
              onPress={() => setShowChallenges(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        <ScrollView style={styles.challengesContent} showsVerticalScrollIndicator={false}>
          {challenges.map((challenge, index) => {
            const IconComponent = challenge.icon;
            
            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <LinearGradient
                  colors={challenge.gradient}
                  style={styles.challengeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.challengeHeader}>
                    <View style={styles.challengeIconContainer}>
                      <IconComponent size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.challengeInfo}>
                      <Text style={styles.challengeTitle}>{challenge.title}</Text>
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.challengeStats}>
                    <View style={styles.challengeStat}>
                      <Timer size={16} color="#FFFFFF" />
                      <Text style={styles.challengeStatText}>{challenge.duration}</Text>
                    </View>
                    <View style={styles.challengeStat}>
                      <Activity size={16} color="#FFFFFF" />
                      <Text style={styles.challengeStatText}>{challenge.difficulty}</Text>
                    </View>
                    <View style={styles.challengeStat}>
                      <Users size={16} color="#FFFFFF" />
                      <Text style={styles.challengeStatText}>{challenge.participants.toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.challengeReward}>
                    <Trophy size={16} color="#FFD700" />
                    <Text style={styles.challengeRewardText}>{challenge.reward}</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.joinChallengeButton}>
                    <Text style={styles.joinChallengeText}>Join Challenge</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
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
              play={true}
              videoId={selectedVideo.videoId}
              webViewStyle={styles.youtubePlayer}
            />
            <TouchableOpacity 
              style={styles.closeVideoButton}
              onPress={() => setIsVideoModalVisible(false)}
            >
              <BlurView intensity={20} style={styles.closeVideoBlur}>
                <X size={24} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
          </View>
          <View style={styles.videoModalInfo}>
            <Text style={styles.videoModalTitle}>{selectedVideo.title}</Text>
            <Text style={styles.videoModalChannel}>{selectedVideo.channelTitle}</Text>
            <View style={styles.videoModalMeta}>
              <Text style={styles.videoModalMetaText}>{selectedVideo.duration}</Text>
              <Text style={styles.videoModalMetaText}>•</Text>
              <Text style={styles.videoModalMetaText}>{selectedVideo.estimatedCalories} cal</Text>
              <Text style={styles.videoModalMetaText}>•</Text>
              <Text style={styles.videoModalMetaText}>{selectedVideo.difficulty}</Text>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );

  const renderLoadingMore = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingMoreText}>Loading more workouts...</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading amazing workouts...</Text>
        </LinearGradient>
      </View>
    );
  }

  const paginatedWorkouts = getPaginatedWorkouts();

  return (
    <View style={styles.container}>
      {renderAnimatedHeader()}
      
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (paginatedWorkouts.length < filteredWorkouts.length) {
              loadMoreWorkouts();
            }
          }
        }}
      >
        {renderCategories()}
        
        <View style={styles.workoutsSection}>
          <View style={styles.workoutsHeader}>
            <Text style={styles.workoutsTitle}>
              {selectedCategory === 'all' ? 'All Workouts' : categories.find(c => c.id === selectedCategory)?.name}
            </Text>
            <Text style={styles.workoutsCount}>
              {filteredWorkouts.length} videos found
            </Text>
          </View>
          
          <View style={viewMode === 'grid' ? styles.workoutsGrid : styles.workoutsList}>
            {paginatedWorkouts.map((video, index) => renderWorkoutCard(video, index))}
          </View>
          
          {renderLoadingMore()}
          
          {paginatedWorkouts.length < filteredWorkouts.length && !isLoadingMore && (
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={loadMoreWorkouts}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadMoreGradient}
              >
                <Text style={styles.loadMoreText}>Load More Workouts</Text>
                <ChevronDown size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {renderFiltersModal()}
      {renderChallengesModal()}
      {renderVideoModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  challengeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginTop: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilters: {
    marginTop: 10,
  },
  quickFiltersContent: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  quickFilterActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: 140,
  },
  categoryCardSelected: {
    elevation: 10,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  categoryGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryNameSelected: {
    color: '#FFFFFF',
  },
  categoryCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  categoryCountSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  workoutsSection: {
    paddingHorizontal: 20,
  },
  workoutsHeader: {
    marginBottom: 20,
  },
  workoutsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  workoutsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  workoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  workoutsList: {
    gap: 16,
  },
  gridWorkoutCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  listWorkoutCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  listWorkoutContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  listImageContainer: {
    width: 80,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 16,
  },
  listWorkoutImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  listImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  listPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWorkoutInfo: {
    flex: 1,
  },
  listWorkoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  listWorkoutChannel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  listWorkoutMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  listMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  listFavoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  workoutImageContainer: {
    height: 140,
    position: 'relative',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  workoutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  workoutBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  favoriteBlur: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  durationBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  durationBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  playButtonBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  workoutDetails: {
    padding: 16,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 22,
  },
  workoutChannel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  loadingMore: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingMoreText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  loadMoreButton: {
    marginTop: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filtersHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  filtersHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeFiltersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 30,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  filterOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  filterOptionTextSelected: {
    color: '#FFFFFF',
  },
  filtersFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  applyFiltersButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyFiltersGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  challengesModal: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  challengesHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  challengesHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challengesTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengesSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  closeChallengesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengesContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  challengeCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  challengeGradient: {
    padding: 24,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  challengeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  challengeStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  challengeRewardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinChallengeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinChallengeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  closeVideoBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  videoModalInfo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  videoModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  videoModalChannel: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  videoModalMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  videoModalMetaText: {
    fontSize: 14,
    color: '#64748B',
  },
  bottomSpacing: {
    height: 120,
  },
  videoInfo: {
    padding: 16,
  },
  videoHeader: {
    marginBottom: 12,
  },
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  videoThumbnailContainer: {
    height: 200,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  listVideoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  listVideoContent: {
    flexDirection: 'row',
    padding: 12,
  },
  listThumbnailContainer: {
    width: 120,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  listThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
});