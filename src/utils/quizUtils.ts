import { QuizRecord, QuizAnswer } from '../types';

/**
 * Create a QuizRecord from quiz answers
 */
export function createQuizRecord(
  type: 'multiple_choice' | 'flashcard',
  answers: QuizAnswer[],
  _mode: string | null = null
): Omit<QuizRecord, 'id'> {
  const correct = answers.filter(a => a.isCorrect).length;
  const wrong = answers.filter(a => !a.isCorrect).length;

  return {
    quizType: type,
    totalQuestions: answers.length,
    correctAnswers: correct,
    timestamp: Date.now(),
    words: answers.map(a => String(a.wordId || 0)),
    difficulty: answers.length > 15 ? 'hard' : answers.length > 10 ? 'medium' : 'easy',
    score: (correct / answers.length) * 100,
    wrong,
    learning: 0,
    mastered: correct
  };
}

/**
 * Get accuracy percentage from QuizRecord
 */
export function getQuizAccuracy(record: QuizRecord): number {
  if (record.totalQuestions === 0) return 0;
  return ((record.correctAnswers ?? 0) / record.totalQuestions) * 100;
}

/**
 * Get timestamp from QuizRecord
 */
export function getQuizTimestamp(record: QuizRecord): number {
  return record.timestamp;
}

/**
 * Get quiz type display name
 */
export function getQuizTypeLabel(type: 'multiple_choice' | 'flashcard'): string {
  return type === 'multiple_choice' ? '选择题' : '闪卡';
}
