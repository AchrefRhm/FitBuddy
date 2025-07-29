import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Clock,
  Flame,
  Star,
  Play,
  Trash2,
  BookmarkPlus,
} from 'lucide-react-native';
import { storageService, FavoriteVideo } from '@/services/storage';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  useEffect(() => {
    loadFavorites();
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withTiming(0, { duration: 600 });
  }, []);

  const loadFavorites = async () => {
    try {
      const favoriteVideos = await storageService.getFavoriteVideos();
      setFavorites(favoriteVideos);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (videoId: string) => {
    try {
      await storageService.removeFromFavorites(videoId);
      setFavorites(prev => prev.filter(fav => fav.id !== videoId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideAnim.value }],
    };
  });

  const renderFavoriteCard = (favorite: FavoriteVideo, index: number) => {
    const cardAnim = useSharedValue(0);
    
    useEffect(() => {
      cardAnim.value = withTiming(1, { duration: 600 + index * 100 });
    }, []);

    const animatedCardStyle = useAnimatedStyle(() => {
      return {
        opacity: cardAnim.value,
        transform: [
          {
            translateY: interpolate(cardAnim.value, [0, 1], [30, 0]),
          },
          {
            scale: interpolate(cardAnim.value, [0, 1], [0.95, 1]),
          },
        ],
      };
    });

    return (
      <Animated.View key={favorite.id} style={[styles.favoriteCard, animatedCardStyle]}>
        <TouchableOpacity style={styles.favoriteCardContent}>
          <View style={styles.favoriteImageContainer}>
            <Image source={{ uri: favorite.thumbnail }} style={styles.favoriteImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.favoriteGradient}
            />
            
            {/* Play Button */}
            <View style={styles.playButton}>
              <Play size={16} color="#fff" fill="#fff" />
            </View>

            {/* Duration */}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{favorite.duration}</Text>
            </View>
          </View>

          <View style={styles.favoriteInfo}>
            <View style={styles.favoriteHeader}>
              <View style={styles.favoriteTextContainer}>
                <Text style={styles.favoriteTitle} numberOfLines={2}>
                  {favorite.title}
                </Text>
                <Text style={styles.favoriteChannel}>{favorite.channelTitle}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromFavorites(favorite.id)}
              >
                <Heart size={20} color="#ff6b6b" fill="#ff6b6b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.favoriteMeta}>
              <Text style={styles.addedDate}>
                Added {new Date(favorite.addedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Heart size={40} color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <LinearGradient
            colors={['#ff6b6b', '#ee5a52']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Heart size={32} color="#fff" fill="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Your Favorites</Text>
                <Text style={styles.headerSubtitle}>
                  {favorites.length} saved workout{favorites.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        {favorites.length > 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionGradient}
              >
                <Play size={20} color="#fff" />
                <Text style={styles.actionText}>Play Random</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.actionGradient}
              >
                <BookmarkPlus size={20} color="#fff" />
                <Text style={styles.actionText}>Create Playlist</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Favorites List */}
        {favorites.length > 0 ? (
          <View style={styles.favoritesContainer}>
            {favorites.map((favorite, index) => renderFavoriteCard(favorite, index))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#ff6b6b', '#ee5a52']}
              style={styles.emptyIcon}
            >
              <Heart size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Start adding workouts to your favorites by tapping the heart icon
            </Text>
            <TouchableOpacity style={styles.exploreButton}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.exploreGradient}
              >
                <Text style={styles.exploreText}>Explore Workouts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    height: 120,
    marginBottom: 20,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    height: 120,
  },
  favoriteCardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  favoriteImageContainer: {
    width: 120,
    height: '100%',
    position: 'relative',
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
  },
  favoriteGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  favoriteTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  favoriteTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  favoriteChannel: {
    color: '#666',
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  favoriteMeta: {
    marginTop: 8,
  },
  addedDate: {
    color: '#666',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exploreGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  exploreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});