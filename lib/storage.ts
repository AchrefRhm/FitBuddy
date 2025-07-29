import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserStats {
  totalWorkouts: number;
  totalCalories: number;
  currentStreak: number;
  achievements: number;
  lastWorkoutDate?: string;
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  totalMinutes: number;
  bestStreak: number;
  joinDate: string;
  level: number;
  experience: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  bestTime: number;
  maxReps: number;
  maxWeight?: number;
  achievedAt: string;
  category: string;
}

export interface FavoriteVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  videoId: string;
  addedAt: string;
}

export interface WorkoutHistory {
  id: string;
  videoId: string;
  title: string;
  duration: string;
  calories: number;
  completedAt: string;
  category: string;
  difficulty: string;
  minutes: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'workouts' | 'calories' | 'minutes' | 'streak';
  reward: string;
  date: string;
  completed: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  experience: number;
}

class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // User Stats
  async getUserStats(): Promise<UserStats> {
    try {
      const stats = await AsyncStorage.getItem('userStats');
      return stats ? JSON.parse(stats) : {
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
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
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
    }
  }

  async updateUserStats(stats: UserStats): Promise<void> {
    try {
      await AsyncStorage.setItem('userStats', JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  async incrementWorkout(calories: number, minutes: number = 0): Promise<UserStats> {
    const stats = await this.getUserStats();
    const today = new Date().toDateString();
    const lastWorkout = stats.lastWorkoutDate;
    
    // Calculate streak
    let newStreak = stats.currentStreak;
    if (lastWorkout) {
      const lastDate = new Date(lastWorkout);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Calculate weekly and monthly workouts
    const history = await this.getWorkoutHistory();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = history.filter(w => new Date(w.completedAt) >= weekAgo).length + 1;
    const monthlyWorkouts = history.filter(w => new Date(w.completedAt) >= monthAgo).length + 1;

    // Calculate experience and level
    const baseExp = stats.experience;
    const workoutExp = 50 + (minutes * 2); // Base 50 + 2 per minute
    const streakBonus = newStreak >= 7 ? 100 : newStreak * 10;
    const newExp = baseExp + workoutExp + streakBonus;
    const newLevel = Math.floor(newExp / 1000) + 1;
    const updatedStats: UserStats = {
      totalWorkouts: stats.totalWorkouts + 1,
      totalCalories: stats.totalCalories + calories,
      currentStreak: newStreak,
      achievements: stats.achievements,
      lastWorkoutDate: today,
      weeklyWorkouts,
      monthlyWorkouts,
      totalMinutes: stats.totalMinutes + minutes,
      bestStreak: Math.max(stats.bestStreak, newStreak),
      joinDate: stats.joinDate,
      level: newLevel,
      experience: newExp
    };

    await this.updateUserStats(updatedStats);
    
    // Update daily challenge progress
    await this.updateDailyChallengeProgress('workouts', 1);
    await this.updateDailyChallengeProgress('calories', calories);
    await this.updateDailyChallengeProgress('minutes', minutes);
    if (newStreak > stats.currentStreak) {
      await this.updateDailyChallengeProgress('streak', newStreak);
    }
    
    // Check for new achievements
    await this.checkAndUnlockAchievements(updatedStats);
    
    return updatedStats;
  }

  // Personal Records
  async getPersonalRecords(): Promise<Record<string, PersonalRecord>> {
    try {
      const records = await AsyncStorage.getItem('personalRecords');
      return records ? JSON.parse(records) : {};
    } catch (error) {
      console.error('Error getting personal records:', error);
      return {};
    }
  }

  async updatePersonalRecord(record: PersonalRecord): Promise<void> {
    try {
      const records = await this.getPersonalRecords();
      const existing = records[record.exerciseId];
      
      if (!existing || 
          record.bestTime < existing.bestTime || 
          record.maxReps > existing.maxReps ||
          (record.maxWeight && (!existing.maxWeight || record.maxWeight > existing.maxWeight))) {
        records[record.exerciseId] = record;
        await AsyncStorage.setItem('personalRecords', JSON.stringify(records));
      }
    } catch (error) {
      console.error('Error updating personal record:', error);
    }
  }

  // Favorites
  async getFavoriteVideos(): Promise<FavoriteVideo[]> {
    try {
      const favorites = await AsyncStorage.getItem('favoriteVideos');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting favorite videos:', error);
      return [];
    }
  }

  async addToFavorites(video: FavoriteVideo): Promise<void> {
    try {
      const favorites = await this.getFavoriteVideos();
      const exists = favorites.find(fav => fav.id === video.id);
      
      if (!exists) {
        favorites.push({
          ...video,
          addedAt: new Date().toISOString()
        });
        await AsyncStorage.setItem('favoriteVideos', JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  }

  async removeFromFavorites(videoId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteVideos();
      const filtered = favorites.filter(fav => fav.id !== videoId);
      await AsyncStorage.setItem('favoriteVideos', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  }

  async isVideoFavorited(videoId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteVideos();
      return favorites.some(fav => fav.id === videoId);
    } catch (error) {
      console.error('Error checking if video is favorited:', error);
      return false;
    }
  }

  // Workout History
  async getWorkoutHistory(): Promise<WorkoutHistory[]> {
    try {
      const history = await AsyncStorage.getItem('workoutHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting workout history:', error);
      return [];
    }
  }

  async addWorkoutToHistory(workout: Omit<WorkoutHistory, 'id' | 'completedAt' | 'minutes'>): Promise<void> {
    try {
      const history = await this.getWorkoutHistory();
      const minutes = this.parseDurationToMinutes(workout.duration);
      const newWorkout: WorkoutHistory = {
        ...workout,
        id: Date.now().toString(),
        completedAt: new Date().toISOString(),
        minutes
      };
      
      history.unshift(newWorkout);
      
      // Keep only last 100 workouts
      if (history.length > 100) {
        history.splice(100);
      }
      
      await AsyncStorage.setItem('workoutHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error adding workout to history:', error);
    }
  }

  private parseDurationToMinutes(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0]; // minutes
    } else if (parts.length === 3) {
      return parts[0] * 60 + parts[1]; // hours to minutes + minutes
    }
    return 0;
  }

  // Daily Challenges
  async getDailyChallenge(): Promise<DailyChallenge> {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem('dailyChallenge');
      const challenge = stored ? JSON.parse(stored) : null;
      
      // Check if we need a new challenge for today
      if (!challenge || challenge.date !== today) {
        const newChallenge = await this.generateDailyChallenge();
        await AsyncStorage.setItem('dailyChallenge', JSON.stringify(newChallenge));
        return newChallenge;
      }
      
      return challenge;
    } catch (error) {
      console.error('Error getting daily challenge:', error);
      return this.generateDailyChallenge();
    }
  }

  private async generateDailyChallenge(): Promise<DailyChallenge> {
    const stats = await this.getUserStats();
    const challenges = [
      {
        type: 'workouts' as const,
        title: 'Workout Warrior',
        description: 'Complete 2 workouts today',
        target: 2,
        icon: 'dumbbell',
        reward: '100 XP'
      },
      {
        type: 'calories' as const,
        title: 'Calorie Crusher',
        description: 'Burn 300 calories today',
        target: 300,
        icon: 'flame',
        reward: '150 XP'
      },
      {
        type: 'minutes' as const,
        title: 'Time Master',
        description: 'Exercise for 30 minutes today',
        target: 30,
        icon: 'clock',
        reward: '120 XP'
      },
      {
        type: 'streak' as const,
        title: 'Consistency King',
        description: 'Maintain your workout streak',
        target: Math.max(stats.currentStreak + 1, 2),
        icon: 'trophy',
        reward: '200 XP'
      }
    ];

    // Select challenge based on user's level and history
    const challengeIndex = Math.floor(Math.random() * challenges.length);
    const selectedChallenge = challenges[challengeIndex];

    return {
      id: Date.now().toString(),
      title: selectedChallenge.title,
      description: selectedChallenge.description,
      target: selectedChallenge.target,
      current: 0,
      type: selectedChallenge.type,
      reward: selectedChallenge.reward,
      date: new Date().toDateString(),
      completed: false,
      icon: selectedChallenge.icon
    };
  }

  async updateDailyChallengeProgress(type: string, amount: number): Promise<void> {
    try {
      const challenge = await this.getDailyChallenge();
      
      if (challenge.type === type && !challenge.completed) {
        challenge.current = Math.min(challenge.current + amount, challenge.target);
        challenge.completed = challenge.current >= challenge.target;
        
        if (challenge.completed) {
          // Award experience for completing challenge
          const stats = await this.getUserStats();
          stats.experience += 100;
          stats.level = Math.floor(stats.experience / 1000) + 1;
          await this.updateUserStats(stats);
        }
        
        await AsyncStorage.setItem('dailyChallenge', JSON.stringify(challenge));
      }
    } catch (error) {
      console.error('Error updating daily challenge progress:', error);
    }
  }

  // Achievements System
  async getAchievements(): Promise<Achievement[]> {
    try {
      const stored = await AsyncStorage.getItem('achievements');
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Initialize achievements
      const initialAchievements = this.getInitialAchievements();
      await AsyncStorage.setItem('achievements', JSON.stringify(initialAchievements));
      return initialAchievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return this.getInitialAchievements();
    }
  }

  private getInitialAchievements(): Achievement[] {
    return [
      {
        id: 'first_workout',
        title: 'First Step',
        description: 'Complete your first workout',
        icon: 'play',
        category: 'Getting Started',
        requirement: 1,
        current: 0,
        unlocked: false,
        rarity: 'common',
        experience: 50
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Complete 7 workouts in a week',
        icon: 'calendar',
        category: 'Consistency',
        requirement: 7,
        current: 0,
        unlocked: false,
        rarity: 'rare',
        experience: 200
      },
      {
        id: 'calorie_crusher',
        title: 'Calorie Crusher',
        description: 'Burn 1000 calories total',
        icon: 'flame',
        category: 'Endurance',
        requirement: 1000,
        current: 0,
        unlocked: false,
        rarity: 'rare',
        experience: 150
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintain a 30-day streak',
        icon: 'trophy',
        category: 'Dedication',
        requirement: 30,
        current: 0,
        unlocked: false,
        rarity: 'epic',
        experience: 500
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Complete 100 workouts',
        icon: 'award',
        category: 'Milestone',
        requirement: 100,
        current: 0,
        unlocked: false,
        rarity: 'legendary',
        experience: 1000
      },
      {
        id: 'time_master',
        title: 'Time Master',
        description: 'Exercise for 1000 minutes total',
        icon: 'clock',
        category: 'Endurance',
        requirement: 1000,
        current: 0,
        unlocked: false,
        rarity: 'epic',
        experience: 300
      },
      {
        id: 'level_up',
        title: 'Level Up',
        description: 'Reach level 5',
        icon: 'star',
        category: 'Progress',
        requirement: 5,
        current: 1,
        unlocked: false,
        rarity: 'rare',
        experience: 250
      }
    ];
  }

  async checkAndUnlockAchievements(stats: UserStats): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements();
      const history = await this.getWorkoutHistory();
      const newlyUnlocked: Achievement[] = [];
      
      for (const achievement of achievements) {
        if (!achievement.unlocked) {
          let current = 0;
          
          switch (achievement.id) {
            case 'first_workout':
              current = stats.totalWorkouts;
              break;
            case 'week_warrior':
              current = stats.weeklyWorkouts;
              break;
            case 'calorie_crusher':
              current = stats.totalCalories;
              break;
            case 'streak_master':
              current = stats.currentStreak;
              break;
            case 'century_club':
              current = stats.totalWorkouts;
              break;
            case 'time_master':
              current = stats.totalMinutes;
              break;
            case 'level_up':
              current = stats.level;
              break;
          }
          
          achievement.current = current;
          
          if (current >= achievement.requirement) {
            achievement.unlocked = true;
            achievement.unlockedAt = new Date().toISOString();
            newlyUnlocked.push(achievement);
            
            // Award experience
            stats.experience += achievement.experience;
            stats.level = Math.floor(stats.experience / 1000) + 1;
            stats.achievements += 1;
          }
        }
      }
      
      await AsyncStorage.setItem('achievements', JSON.stringify(achievements));
      
      if (newlyUnlocked.length > 0) {
        await this.updateUserStats(stats);
      }
      
      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  async getRecentAchievements(limit: number = 3): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements();
      return achievements
        .filter(a => a.unlocked)
        .sort((a, b) => {
          if (!a.unlockedAt || !b.unlockedAt) return 0;
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent achievements:', error);
      return [];
    }
  }

  // Progress Analytics
  async getWeeklyProgress(): Promise<{ day: string; workouts: number; calories: number; minutes: number }[]> {
    try {
      const history = await this.getWorkoutHistory();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyWorkouts = history.filter(w => new Date(w.completedAt) >= weekAgo);
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData = days.map(day => ({
        day,
        workouts: 0,
        calories: 0,
        minutes: 0
      }));
      
      weeklyWorkouts.forEach(workout => {
        const workoutDate = new Date(workout.completedAt);
        const dayIndex = workoutDate.getDay();
        weeklyData[dayIndex].workouts += 1;
        weeklyData[dayIndex].calories += workout.calories;
        weeklyData[dayIndex].minutes += workout.minutes;
      });
      
      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly progress:', error);
      return [];
    }
  }
  // Settings
  async getSettings(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      return settings ? JSON.parse(settings) : {
        darkMode: false,
        theme: 'light',
        notifications: true,
        preferredDifficulty: 'all',
        preferredDuration: 'all'
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        darkMode: false,
        theme: 'light',
        notifications: true,
        preferredDifficulty: 'all',
        preferredDuration: 'all'
      };
    }
  }

  async updateSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }
}

export const storageService = StorageService.getInstance();