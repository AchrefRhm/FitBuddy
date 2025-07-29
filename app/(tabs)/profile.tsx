import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import Toast from 'react-native-toast-message';
import { User, Settings, Trophy, Target, Calendar, Flame, Bell, Moon, Sun, Volume2, Smartphone, Info, LogOut, CreditCard as Edit, Crown, Star, Award, Activity, Palette, Heart, Sparkles } from 'lucide-react-native';
import { storageService, UserStats } from '@/services/storage';

interface Theme {
  name: string;
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string[];
    warning: string[];
    error: string[];
  };
}

const themes: Record<string, Theme> = {
  light: {
    name: 'Light',
    colors: {
      primary: ['#667eea', '#764ba2'],
      secondary: ['#f093fb', '#f5576c'],
      accent: ['#4facfe', '#00f2fe'],
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1a202c',
      textSecondary: '#718096',
      success: ['#48bb78', '#38a169'],
      warning: ['#ed8936', '#dd6b20'],
      error: ['#f56565', '#e53e3e'],
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: ['#0F0F23', '#1E1E3F'],
      secondary: ['#667eea', '#764ba2'],
      accent: ['#00D4FF', '#A78BFA'],
      background: '#0F0F23',
      surface: '#1a1a2e',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      success: ['#00FF88', '#00CC6A'],
      warning: ['#FFD93D', '#FFC107'],
      error: ['#FF6B6B', '#E74C3C'],
    },
  },
  ocean: {
    name: 'Ocean',
    colors: {
      primary: ['#667eea', '#764ba2'],
      secondary: ['#4facfe', '#00f2fe'],
      accent: ['#43e97b', '#38f9d7'],
      background: '#e6f3ff',
      surface: '#ffffff',
      text: '#2d3748',
      textSecondary: '#4a5568',
      success: ['#48bb78', '#38a169'],
      warning: ['#ed8936', '#dd6b20'],
      error: ['#f56565', '#e53e3e'],
    },
  },
  sunset: {
    name: 'Sunset',
    colors: {
      primary: ['#ff9a9e', '#fecfef'],
      secondary: ['#ffecd2', '#fcb69f'],
      accent: ['#a8edea', '#fed6e3'],
      background: '#fff5f5',
      surface: '#ffffff',
      text: '#2d3748',
      textSecondary: '#4a5568',
      success: ['#48bb78', '#38a169'],
      warning: ['#ed8936', '#dd6b20'],
      error: ['#f56565', '#e53e3e'],
    },
  },
};

export default function ProfileScreen() {
  const [currentTheme, setCurrentTheme] = useState<string>('light');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const theme = themes[currentTheme];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [stats, userSettings, achievements] = await Promise.all([
        storageService.getUserStats(),
        storageService.getSettings(),
        storageService.getRecentAchievements(5)
      ]);
      
      setUserStats(stats);
      setSettings(userSettings);
      setRecentAchievements(achievements);
      setCurrentTheme(userSettings.theme || 'light');
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await storageService.updateSettings(newSettings);
      
      Toast.show({
        type: 'success',
        text1: 'Settings Updated! ✨',
        text2: 'Your preferences have been saved',
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const changeTheme = async (themeName: string) => {
    setCurrentTheme(themeName);
    setShowThemeSelector(false);
    
    const newSettings = { ...settings, theme: themeName };
    setSettings(newSettings);
    await storageService.updateSettings(newSettings);
    
    Toast.show({
      type: 'success',
      text1: `${themes[themeName].name} Theme Applied! 🎨`,
      text2: 'Your app looks amazing now!',
    });
  };

  const resetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              const resetStats: UserStats = {
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
              };
              await storageService.updateUserStats(resetStats);
              setUserStats(resetStats);
              
              Toast.show({
                type: 'success',
                text1: 'Progress Reset! 🔄',
                text2: 'Ready for a fresh start!',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to reset progress',
              });
            }
          }
        }
      ]
    );
  };

  if (!userStats) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Animatable.View animation="pulse" iterationCount="infinite">
          <LinearGradient colors={theme.colors.primary} style={styles.loadingCard}>
            <User size={48} color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </LinearGradient>
        </Animatable.View>
      </View>
    );
  }

  const memberSince = new Date(userStats.joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={theme.colors.primary} style={styles.header}>
          <Animatable.View animation="fadeInDown" style={styles.headerContent}>
            <View style={styles.profileSection}>
              <LinearGradient
                colors={theme.colors.accent}
                style={styles.avatarContainer}
              >
                <User size={48} color="#FFFFFF" />
              </LinearGradient>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Fitness Champion</Text>
                <Text style={styles.profileLevel}>Level {userStats.level} 🏆</Text>
                <Text style={styles.memberSince}>Member since {memberSince}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton} 
                activeOpacity={0.8}
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: '✏️ Edit Profile',
                    text2: 'Profile editing coming soon!',
                  });
                }}
              >
                <Edit size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Level Progress */}
            <Animatable.View animation="fadeInUp" delay={300} style={styles.levelProgress}>
              <View style={styles.levelProgressBar}>
                <LinearGradient
                  colors={['#FFFFFF', 'rgba(255, 255, 255, 0.8)']}
                  style={[
                    styles.levelProgressFill,
                    { width: `${((userStats.experience % 1000) / 1000) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.levelProgressText}>
                {userStats.experience % 1000}/1000 XP to Level {userStats.level + 1}
              </Text>
            </Animatable.View>
          </Animatable.View>
        </LinearGradient>

        {/* Theme Selector */}
        {showThemeSelector && (
          <Animatable.View animation="slideInDown" style={styles.themeSelector}>
            <BlurView intensity={80} style={styles.themeSelectorBlur}>
              <Text style={[styles.themeSelectorTitle, { color: theme.colors.text }]}>
                🎨 Choose Your Theme
              </Text>
              <View style={styles.themeOptions}>
                {Object.entries(themes).map(([key, themeOption]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeOption,
                      currentTheme === key && styles.themeOptionActive,
                    ]}
                    onPress={() => changeTheme(key)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={themeOption.colors.primary}
                      style={styles.themePreview}
                    />
                    <Text style={[styles.themeOptionText, { color: theme.colors.text }]}>
                      {themeOption.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animatable.View>
        )}

        {/* Quick Stats */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📊 Your Amazing Stats
          </Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: '🔥 Calories Burned!',
                  text2: `${userStats.totalCalories} calories and counting!`,
                });
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={theme.colors.error} style={styles.statGradient}>
                <Flame size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{userStats.totalCalories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: '💪 Workouts Done!',
                  text2: `${userStats.totalWorkouts} workouts completed!`,
                });
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={theme.colors.accent} style={styles.statGradient}>
                <Activity size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{userStats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: '🔥 Streak Power!',
                  text2: `${userStats.currentStreak} days of consistency!`,
                });
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={theme.colors.success} style={styles.statGradient}>
                <Target size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: '🏆 Achievements!',
                  text2: `${userStats.achievements} achievements unlocked!`,
                });
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={theme.colors.warning} style={styles.statGradient}>
                <Trophy size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{userStats.achievements}</Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={600} style={styles.achievementsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🏆 Recent Achievements
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentAchievements.map((achievement, index) => (
                <Animatable.View
                  key={achievement.id}
                  animation="bounceIn"
                  delay={index * 100}
                >
                  <TouchableOpacity
                    style={styles.achievementCard}
                    onPress={() => {
                      Toast.show({
                        type: 'success',
                        text1: `🏆 ${achievement.title}`,
                        text2: achievement.description,
                      });
                    }}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={
                        achievement.rarity === 'legendary' 
                          ? ['#FFD93D', '#FFA500']
                          : achievement.rarity === 'epic'
                          ? theme.colors.error
                          : theme.colors.accent
                      }
                      style={styles.achievementGradient}
                    >
                      <Award size={24} color="#FFFFFF" />
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDate}>
                        {achievement.unlockedAt 
                          ? new Date(achievement.unlockedAt).toLocaleDateString()
                          : 'Recently'
                        }
                      </Text>
                      <View style={styles.achievementBadge}>
                        <Sparkles size={12} color="#FFFFFF" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>
        )}

        {/* Settings */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ⚙️ Settings & Preferences
          </Text>
          
          <View style={styles.settingsList}>
            {/* Theme Selector */}
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowThemeSelector(!showThemeSelector)}
              activeOpacity={0.8}
            >
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary[0] + '20' }]}>
                <Palette size={20} color={theme.colors.primary[0]} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  App Theme
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Current: {theme.name}
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: theme.colors.primary[0] }]}>
                Change
              </Text>
            </TouchableOpacity>

            {/* Notifications */}
            <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.accent[0] + '20' }]}>
                <Bell size={20} color={theme.colors.accent[0]} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Get reminders and updates
                </Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSetting('notifications', value)}
                trackColor={{ false: '#333', true: theme.colors.accent[0] }}
                thumbColor={settings.notifications ? '#FFFFFF' : '#666'}
              />
            </View>

            {/* Voice Coaching */}
            <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.success[0] + '20' }]}>
                <Volume2 size={20} color={theme.colors.success[0]} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Voice Coaching
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  AI voice guidance during workouts
                </Text>
              </View>
              <Switch
                value={settings.voiceCoaching !== false}
                onValueChange={(value) => updateSetting('voiceCoaching', value)}
                trackColor={{ false: '#333', true: theme.colors.success[0] }}
                thumbColor={settings.voiceCoaching !== false ? '#FFFFFF' : '#666'}
              />
            </View>
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={1000} style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'ℹ️ About This App',
                text2: 'AI Fitness Pro v1.0 - Built with React Native & Expo',
              });
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.actionButtonContent, { backgroundColor: theme.colors.surface }]}>
              <Info size={20} color={theme.colors.accent[0]} />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                About
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={resetProgress}
            activeOpacity={0.8}
          >
            <View style={[styles.actionButtonContent, { backgroundColor: theme.colors.error[0] + '20' }]}>
              <LogOut size={20} color={theme.colors.error[0]} />
              <Text style={[styles.actionButtonText, { color: theme.colors.error[0] }]}>
                Reset Progress
              </Text>
            </View>
          </TouchableOpacity>
        </Animatable.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
  },
  headerContent: {
    gap: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelProgress: {
    alignItems: 'center',
  },
  levelProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelProgressText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  themeSelector: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  themeSelectorBlur: {
    padding: 20,
  },
  themeSelectorTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  themeOption: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    flex: 1,
  },
  themeOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  achievementsSection: {
    paddingLeft: 24,
    marginBottom: 32,
  },
  achievementCard: {
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  achievementGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  achievementDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  achievementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 100,
  },
});