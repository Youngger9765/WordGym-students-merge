import { VocabularyWord, QuizDifficulty } from './index';

export interface QuizRecord {
  id?: string;
  quizType: 'multiple_choice' | 'flashcard';
  totalQuestions: number;
  correctAnswers: number;
  timestamp: number;
  date?: number;
  words: string[];
  difficulty: QuizDifficulty;
  score: number;
  wrong: number;
  learning: number;
  mastered: number;
  correct?: number;
}

export interface QuizConfiguration {
  type: 'multiple_choice' | 'flashcard';
  difficulty: QuizDifficulty;
  category?: 'textbook' | 'theme' | 'all';
}

export interface QuizCompletionStats {
  correct: number;
  wrong: number;
  learning: number;
  mastered: number;
  totalQuestions: number;
}

export interface QuizCompletionProps {
  type: 'multiple_choice' | 'flashcard';
  stats: QuizCompletionStats;
  words: VocabularyWord[];
  onRestart: () => void;
  onClose?: () => void;
}

export const QuizTypes = {
  multiple_choice: '選擇題測驗',
  flashcard: '閃卡測驗',
  writing: '寫作測驗'
};