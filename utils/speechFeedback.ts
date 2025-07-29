import { Platform } from 'react-native';

export class SpeechFeedback {
  private static instance: SpeechFeedback;
  private isEnabled = true;
  
  static getInstance(): SpeechFeedback {
    if (!SpeechFeedback.instance) {
      SpeechFeedback.instance = new SpeechFeedback();
    }
    return SpeechFeedback.instance;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  speak(text: string): void {
    if (!this.isEnabled) return;

    if (Platform.OS === 'web') {
      // Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      // For native platforms, would use expo-speech
      console.log('Speech feedback:', text);
    }
  }

  // Provide contextual feedback based on form score
  provideFormFeedback(score: number, exerciseType: string): void {
    let feedback = '';
    
    if (score >= 90) {
      feedback = 'Excellent form! Keep it up!';
    } else if (score >= 80) {
      feedback = 'Good form, minor adjustments needed';
    } else if (score >= 70) {
      feedback = 'Focus on your form';
    } else {
      feedback = 'Check your positioning';
    }

    this.speak(feedback);
  }

  announceRep(repCount: number): void {
    if (repCount % 5 === 0) {
      this.speak(`${repCount} reps completed! Great job!`);
    }
  }

  announceWorkoutComplete(reps: number, score: number): void {
    this.speak(`Workout complete! ${reps} reps with ${score}% average form score. Well done!`);
  }
}