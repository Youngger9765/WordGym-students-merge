import { VocabularyWord } from './index';

export interface QuizRecord {
  id: string;
  quizType: 'multiple_choice' | 'flashcard' | 'writing';
  totalQuestions: number;
  correctAnswers: number;
  timestamp: number;
  words?: string[]; // Optional list of word IDs used in the quiz
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  word: VocabularyWord;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
}

export interface QuizConfiguration {
  type: 'multiple_choice' | 'flashcard' | 'writing';
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
  pos?: string;
}

export interface QuizProgress {
  currentQuestionIndex: number;
  score: number;
  completed: boolean;
  startTime?: number;
  endTime?: number;
}