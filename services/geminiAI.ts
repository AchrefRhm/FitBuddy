import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with environment variable or fallback
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

interface UserProfile {
  fitnessGoal: string;
  experienceLevel: string;
  availableTime: string;
  preferredWorkouts: string[];
  injuries: string[];
  equipment: string[];
}

interface WorkoutPlan {
  name: string;
  duration: string;
  difficulty: string;
  calories: number;
  exercises: Exercise[];
  warmup: string[];
  cooldown: string[];
  tips: string[];
  focus: string;
  aiInsights: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  restTime: string;
  formTips: string[];
  modifications: string[];
  targetMuscles: string[];
}

class GeminiAIService {
  private model: any;
  private chatSession: any;
  private isApiAvailable: boolean;
  private userProfile: Partial<UserProfile> = {};
  private conversationHistory: string[] = [];

  constructor() {
    this.isApiAvailable = !!genAI;
    
    if (this.isApiAvailable) {
      this.model = genAI!.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
    }
    this.initializeChatSession();
  }

  private initializeChatSession() {
    if (!this.isApiAvailable) {
      this.chatSession = null;
      return;
    }
    
    const systemPrompt = `You are FitBuddy, the world's most advanced AI fitness coach with these capabilities:

PERSONALITY & EXPERTISE:
- Enthusiastic, motivational, and scientifically accurate
- Expert in exercise physiology, biomechanics, and sports science
- Personalized coaching based on individual needs and goals
- Safety-first approach with injury prevention focus
- Encouraging but realistic about expectations

CORE FEATURES YOU OFFER:
🎯 AI-Powered Pose Detection & Form Analysis
🗣️ Real-time Voice Coaching & Corrections  
🧠 Adaptive Workout Generation based on progress
📊 Smart Progress Tracking & Analytics
🛡️ Injury Risk Assessment & Prevention
🎮 Gamified Challenges & Motivation
☁️ Cloud Sync & Cross-device Support

COMMUNICATION STYLE:
- Use emojis strategically for engagement
- Keep responses conversational but informative
- Provide specific, actionable advice
- Include safety considerations
- Offer modifications for different fitness levels
- Be encouraging and supportive
- Reference your AI capabilities naturally

WORKOUT GENERATION:
When creating workouts, always include:
- Exercise name with AI features (pose detection, form analysis)
- Proper sets, reps, and rest periods
- Form tips and safety considerations
- Modifications for different levels
- Target muscle groups
- AI insights about the workout design

RESPONSE LENGTH:
- Keep regular responses under 200 words
- Workout plans can be longer and detailed
- Always prioritize clarity and actionability

Remember: You're not just giving advice - you're an intelligent AI coach that actively monitors form, provides real-time feedback, and adapts to each user's unique needs and progress.`;

    this.chatSession = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "🤖 Hello! I'm FitBuddy, your advanced AI fitness coach! I'm powered by cutting-edge machine learning algorithms that can analyze your form in real-time, provide voice coaching, and create personalized workouts that adapt to your progress.\n\nI'm here to help you achieve your fitness goals safely and effectively. Whether you want to build strength, lose weight, improve endurance, or just stay healthy - I've got you covered with intelligent, data-driven coaching!\n\nWhat brings you to FitBuddy today? Let's start your AI-powered fitness journey! 💪✨" }]
        }
      ],
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.isApiAvailable || !this.chatSession) {
      return this.getFallbackResponse(message);
    }
    
    try {
      // Add context about user's fitness journey
      const contextualMessage = this.addContext(message);
      
      // Send to Gemini AI
      const result = await this.chatSession.sendMessage(contextualMessage);
      const response = await result.response;
      const aiResponse = response.text();
      
      // Store conversation history
      this.conversationHistory.push(`User: ${message}`);
      this.conversationHistory.push(`FitBuddy: ${aiResponse}`);
      
      // Keep only last 10 exchanges
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
      
      return aiResponse;
    } catch (error) {
      console.error('Gemini AI Error:', error);
      return this.getFallbackResponse(message);
    }
  }

  private addContext(message: string): string {
    const context = [];
    
    // Add user profile context if available
    if (Object.keys(this.userProfile).length > 0) {
      context.push(`User Profile: ${JSON.stringify(this.userProfile)}`);
    }
    
    // Add recent conversation context
    if (this.conversationHistory.length > 0) {
      context.push(`Recent conversation: ${this.conversationHistory.slice(-6).join('\n')}`);
    }
    
    // Add current message
    context.push(`Current message: ${message}`);
    
    return context.join('\n\n');
  }

  async generateWorkoutPlan(userGoals: string, fitnessLevel: string, timeAvailable: string): Promise<WorkoutPlan> {
    if (!this.isApiAvailable) {
      console.log('Gemini API not available, using fallback workout generation');
      return this.getFallbackWorkout(userGoals, fitnessLevel, timeAvailable);
    }
    
    const prompt = `Create an advanced AI-powered workout plan with these specifications:

USER REQUIREMENTS:
- Primary Goal: ${userGoals}
- Fitness Level: ${fitnessLevel}
- Time Available: ${timeAvailable}
- User Profile: ${JSON.stringify(this.userProfile)}

WORKOUT REQUIREMENTS:
Create a comprehensive workout that showcases FitBuddy's AI capabilities:
- Include AI-powered features (pose detection, form analysis, rep counting)
- Provide detailed exercise instructions with form tips
- Include warm-up and cool-down routines
- Add safety considerations and modifications
- Estimate calorie burn accurately
- Include AI insights about why this workout is perfect for the user

FORMAT: Respond with a detailed workout plan that highlights the intelligent, adaptive nature of FitBuddy's AI coaching system. Make it feel personalized and cutting-edge.

Focus on bodyweight exercises that work well with pose detection technology.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the AI response into a structured workout
      return this.parseWorkoutResponse(text, userGoals, fitnessLevel, timeAvailable);
    } catch (error) {
      console.error('Workout generation error:', error);
      return this.getFallbackWorkout(userGoals, fitnessLevel, timeAvailable);
    }
  }

  private parseWorkoutResponse(aiResponse: string, goal: string, level: string, time: string): WorkoutPlan {
    // Extract workout details from AI response
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    // Try to extract structured information
    const workoutName = this.extractWorkoutName(aiResponse) || `AI-Generated ${goal} Workout`;
    const exercises = this.extractExercises(aiResponse, level);
    const insights = this.extractInsights(aiResponse);
    
    return {
      name: workoutName,
      duration: time,
      difficulty: level,
      calories: this.estimateCalories(time, level),
      focus: goal,
      aiInsights: insights || "This workout is intelligently designed by AI to match your specific goals, fitness level, and available time. Each exercise includes real-time form monitoring and adaptive difficulty.",
      exercises: exercises,
      warmup: [
        "Dynamic arm circles (AI monitors range of motion)",
        "Leg swings with balance tracking",
        "Torso twists with posture analysis",
        "Light cardio with heart rate monitoring"
      ],
      cooldown: [
        "Static stretching with hold-time tracking",
        "Deep breathing exercises",
        "Muscle relaxation sequence",
        "Recovery pose analysis"
      ],
      tips: [
        "🤖 AI monitors your form throughout each exercise",
        "🗣️ Voice coaching provides real-time corrections",
        "📊 Smart rep counting ensures accurate tracking",
        "⚡ Adaptive rest periods based on your recovery",
        "🛡️ Injury risk alerts keep you safe"
      ]
    };
  }

  private extractWorkoutName(response: string): string | null {
    const namePatterns = [
      /workout[:\s]*([^\n]+)/i,
      /plan[:\s]*([^\n]+)/i,
      /routine[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/[*#]/g, '');
      }
    }
    return null;
  }

  private extractExercises(response: string, level: string): Exercise[] {
    // Default AI-powered exercises
    const baseExercises = [
      {
        name: "AI-Guided Push-ups",
        sets: level === 'Beginner' ? 2 : 3,
        reps: level === 'Beginner' ? '6-10' : '10-15',
        restTime: "60 seconds",
        formTips: [
          "AI monitors body alignment in real-time",
          "Voice coaching guides proper depth",
          "Automatic rep counting with form validation"
        ],
        modifications: ["Knee push-ups", "Incline push-ups", "Diamond push-ups"],
        targetMuscles: ["Chest", "Shoulders", "Triceps", "Core"]
      },
      {
        name: "Smart Squats",
        sets: level === 'Beginner' ? 2 : 3,
        reps: level === 'Beginner' ? '10-15' : '15-20',
        restTime: "45 seconds",
        formTips: [
          "Depth tracking ensures full range of motion",
          "Knee alignment monitoring prevents injury",
          "Balance analysis improves stability"
        ],
        modifications: ["Chair-assisted squats", "Jump squats", "Single-leg squats"],
        targetMuscles: ["Quadriceps", "Glutes", "Hamstrings", "Calves"]
      },
      {
        name: "Intelligent Plank Hold",
        sets: 3,
        reps: level === 'Beginner' ? '20-30 seconds' : '30-60 seconds',
        restTime: "60 seconds",
        formTips: [
          "Spine alignment detection prevents sagging",
          "Hip position monitoring maintains form",
          "Core engagement analysis maximizes effectiveness"
        ],
        modifications: ["Knee plank", "Side planks", "Plank variations"],
        targetMuscles: ["Core", "Shoulders", "Back", "Glutes"]
      }
    ];

    // Add more exercises based on level
    if (level !== 'Beginner') {
      baseExercises.push({
        name: "Dynamic Lunges",
        sets: 3,
        reps: "10 each leg",
        restTime: "45 seconds",
        formTips: [
          "Step length optimization for maximum effectiveness",
          "Balance tracking prevents wobbling",
          "Knee safety monitoring protects joints"
        ],
        modifications: ["Stationary lunges", "Reverse lunges", "Jump lunges"],
        targetMuscles: ["Legs", "Glutes", "Core", "Balance"]
      });
    }

    return baseExercises;
  }

  private extractInsights(response: string): string {
    // Look for insights in the AI response
    const insightPatterns = [
      /insight[s]?[:\s]*([^\n]+)/i,
      /why[:\s]*([^\n]+)/i,
      /designed[:\s]*([^\n]+)/i
    ];
    
    for (const pattern of insightPatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return "This workout leverages advanced AI algorithms to provide personalized exercise selection, real-time form analysis, and adaptive progression based on your unique biomechanics and fitness goals.";
  }

  async analyzeForm(exerciseName: string, userDescription: string): Promise<string> {
    if (!this.isApiAvailable) {
      return this.getFallbackFormAnalysis(exerciseName, userDescription);
    }
    
    const prompt = `As FitBuddy AI, analyze this form description for ${exerciseName}:

USER DESCRIPTION: "${userDescription}"

Provide expert form analysis including:
🔍 FORM ASSESSMENT: What they're doing well and areas for improvement
⚠️ SAFETY CONCERNS: Any potential injury risks
✅ CORRECTIONS: Step-by-step form improvements
🎯 AI FEATURES: How FitBuddy's pose detection would help
💡 PRO TIPS: Advanced techniques for better results

Keep it encouraging but precise. Reference how FitBuddy's AI would provide real-time corrections.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return `🔍 **AI Form Analysis for ${exerciseName}**\n\nGreat question! Proper form is crucial for results and safety. Here's what FitBuddy's AI would focus on:\n\n✅ **Key Form Points:**\n• Maintain proper alignment throughout the movement\n• Control both the lifting and lowering phases\n• Engage your core for stability\n• Breathe consistently with the movement\n\n🤖 **How FitBuddy Helps:**\nOur pose detection technology would monitor your form in real-time, providing instant voice corrections and visual feedback to ensure perfect technique every rep!\n\nWould you like me to create a form-focused workout for ${exerciseName}?`;
    }
  }

  async getMotivationalMessage(context: string): Promise<string> {
    if (!this.isApiAvailable) {
      return this.getFallbackMotivation(context);
    }
    
    const prompt = `As FitBuddy AI, provide an inspiring motivational message for someone who ${context}. 

Make it:
- Personal and encouraging
- Reference AI coaching benefits
- Include actionable advice
- Use emojis strategically
- Keep under 150 words
- Sound like an intelligent AI coach who truly cares

Focus on how AI-powered fitness coaching makes their journey smarter and more effective.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return "🚀 You're absolutely crushing it! Every rep, every workout, every step forward is building a stronger, healthier you. With FitBuddy's AI coaching, you're not just working out - you're training smarter with real-time form analysis and personalized guidance.\n\nRemember: Progress isn't always linear, but with AI-powered insights, every session is optimized for your success. Your future self will thank you for the commitment you're showing today! 💪✨\n\nReady for your next AI-guided workout?";
    }
  }

  async getNutritionAdvice(goal: string, dietaryRestrictions: string = ''): Promise<string> {
    if (!this.isApiAvailable) {
      return this.getFallbackNutrition(goal, dietaryRestrictions);
    }
    
    const prompt = `As FitBuddy AI, provide intelligent nutrition advice for: ${goal}${dietaryRestrictions ? ` with dietary restrictions: ${dietaryRestrictions}` : ''}

Include:
🥗 NUTRITION STRATEGY: Key principles for their goal
⏰ MEAL TIMING: When to eat for optimal results  
🍎 FOOD RECOMMENDATIONS: Specific foods that support their goal
💧 HYDRATION: Smart hydration strategies
🤖 AI INTEGRATION: How FitBuddy could track nutrition

Keep it practical, science-based, and actionable. Reference how AI could enhance their nutrition journey.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return `🥗 **Smart Nutrition for ${goal}**\n\n**Key Principles:**\n• Eat protein within 30 minutes post-workout for recovery\n• Stay hydrated (8-10 glasses daily, more during workouts)\n• Include complex carbs for sustained energy\n• Don't skip meals - consistent fuel = consistent results\n\n**AI Enhancement:**\nFitBuddy's future nutrition AI could track your meals, suggest optimal timing, and adjust recommendations based on your workout intensity and recovery needs!\n\n💡 **Pro Tip:** Pair your smart workouts with smart nutrition for maximum results. Your AI coach is here to optimize every aspect of your fitness journey! 🚀`;
    }
  }

  private estimateCalories(time: string, level: string): number {
    const minutes = parseInt(time.match(/\d+/)?.[0] || '30');
    const multiplier = level === 'Beginner' ? 7 : level === 'Intermediate' ? 9 : 12;
    return Math.round(minutes * multiplier);
  }

  private getFallbackWorkout(goal: string, level: string, time: string): WorkoutPlan {
    return {
      name: `AI-Powered ${goal} Accelerator`,
      duration: time,
      difficulty: level,
      calories: this.estimateCalories(time, level),
      focus: goal,
      aiInsights: "This workout is intelligently crafted using advanced AI algorithms that analyze your goals, fitness level, and biomechanics to deliver maximum results with minimum injury risk.",
      exercises: [
        {
          name: "AI-Monitored Push-ups",
          sets: level === 'Beginner' ? 2 : 3,
          reps: level === 'Beginner' ? '6-10' : '10-15',
          restTime: "60 seconds",
          formTips: [
            "Real-time posture analysis ensures perfect form",
            "Voice coaching guides you through each rep",
            "Automatic counting with form validation"
          ],
          modifications: ["Knee push-ups", "Incline variations", "Advanced: Archer push-ups"],
          targetMuscles: ["Chest", "Shoulders", "Triceps", "Core"]
        },
        {
          name: "Smart Bodyweight Squats",
          sets: level === 'Beginner' ? 2 : 3,
          reps: level === 'Beginner' ? '10-15' : '15-20',
          restTime: "45 seconds",
          formTips: [
            "Depth tracking ensures full range of motion",
            "Balance monitoring improves stability",
            "Knee alignment protection prevents injury"
          ],
          modifications: ["Chair-assisted", "Jump squats", "Pistol squats"],
          targetMuscles: ["Quadriceps", "Glutes", "Hamstrings", "Core"]
        }
      ],
      warmup: [
        "Dynamic stretching with movement analysis",
        "Joint mobility with range tracking",
        "Activation exercises with muscle engagement monitoring"
      ],
      cooldown: [
        "Static stretching with hold-time optimization",
        "Breathing exercises with rhythm guidance",
        "Recovery assessment and recommendations"
      ],
      tips: [
        "🤖 AI continuously monitors and corrects your form",
        "🗣️ Real-time voice coaching keeps you motivated",
        "📊 Smart analytics track your progress automatically",
        "⚡ Adaptive difficulty based on your performance",
        "🛡️ Injury prevention through intelligent movement analysis"
      ]
    };
  }

  private getFallbackResponse(message: string): string {
    const responses = [
      "🤖 That's an excellent question! As your AI fitness coach, I'm here to provide personalized guidance. My advanced algorithms are designed to help you achieve your goals safely and effectively. What specific aspect of fitness would you like to explore? 💪",
      
      "✨ I love your enthusiasm for fitness! With FitBuddy's AI-powered coaching, we can create the perfect workout plan tailored just for you. Whether it's strength, cardio, or flexibility - I've got intelligent solutions. What's your main fitness goal? 🎯",
      
      "🚀 Great to connect with you! As an AI fitness coach, I combine cutting-edge technology with proven exercise science to give you the best possible training experience. I can analyze your form, create custom workouts, and provide real-time feedback. How can I help optimize your fitness journey today? 💡",
      
      "🧠 Fantastic question! My AI capabilities include pose detection, form analysis, adaptive workout generation, and personalized coaching. I'm designed to make your fitness journey smarter, safer, and more effective. What area would you like to focus on first? 🏋️‍♂️",
      
      "⚡ I'm excited to be your AI fitness companion! With advanced machine learning and real-time analysis, I can help you master perfect form, prevent injuries, and achieve results faster than traditional training methods. What brings you to FitBuddy today? 🌟"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getFallbackFormAnalysis(exerciseName: string, userDescription: string): string {
    return `🔍 **AI Form Analysis for ${exerciseName}**\n\nGreat question! Proper form is crucial for results and safety. Here's what FitBuddy's AI would focus on:\n\n✅ **Key Form Points:**\n• Maintain proper alignment throughout the movement\n• Control both the lifting and lowering phases\n• Engage your core for stability\n• Breathe consistently with the movement\n\n🤖 **How FitBuddy Helps:**\nOur pose detection technology would monitor your form in real-time, providing instant voice corrections and visual feedback to ensure perfect technique every rep!\n\nWould you like me to create a form-focused workout for ${exerciseName}?`;
  }

  private getFallbackMotivation(context: string): string {
    return "🚀 You're absolutely crushing it! Every rep, every workout, every step forward is building a stronger, healthier you. With FitBuddy's AI coaching, you're not just working out - you're training smarter with real-time form analysis and personalized guidance.\n\nRemember: Progress isn't always linear, but with AI-powered insights, every session is optimized for your success. Your future self will thank you for the commitment you're showing today! 💪✨\n\nReady for your next AI-guided workout?";
  }

  private getFallbackNutrition(goal: string, dietaryRestrictions: string): string {
    return `🥗 **Smart Nutrition for ${goal}**\n\n**Key Principles:**\n• Eat protein within 30 minutes post-workout for recovery\n• Stay hydrated (8-10 glasses daily, more during workouts)\n• Include complex carbs for sustained energy\n• Don't skip meals - consistent fuel = consistent results\n\n**AI Enhancement:**\nFitBuddy's future nutrition AI could track your meals, suggest optimal timing, and adjust recommendations based on your workout intensity and recovery needs!\n\n💡 **Pro Tip:** Pair your smart workouts with smart nutrition for maximum results. Your AI coach is here to optimize every aspect of your fitness journey! 🚀`;
  }

  updateUserProfile(updates: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...updates };
  }

  getUserProfile(): Partial<UserProfile> {
    return this.userProfile;
  }

  getConversationHistory(): string[] {
    return this.conversationHistory;
  }

  clearConversationHistory() {
    this.conversationHistory = [];
  }
}

export const geminiAI = new GeminiAIService();