import { QuizRecord, QuizAnswer } from '../types';

/**
 * Create a QuizRecord from quiz answers
 */
export function createQuizRecord(
  type: 'multiple-choice' | 'flashcard',
  answers: QuizAnswer[],
  mode: string | null = null
): QuizRecord {
  const correct = answers.filter(a => a.isCorrect).length;
  const wrong = answers.filter(a => !a.isCorrect).length;

  return {
    id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    type,
    totalQuestions: answers.length,
    correct,
    wrong,
    learning: 0, // Not used in new implementation
    wrongWords: answers
      .filter(a => !a.isCorrect)
      .map(a => ({
        wordId: a.wordId,
        word: a.word,
        correctAnswer: a.correctAnswer,
        userAnswer: a.userAnswer,
        question: a.question,
        chinese_definition: a.wordDefinition,
        sentenceTranslation: a.sentenceTranslation,
        userAnswerDefinition: a.userAnswerDefinition
      })),
    learningWords: [],
    correctWords: answers.filter(a => a.isCorrect).map(a => a.wordId),
    duration: 0, // Can be calculated if needed
    mode
  };
}

/**
 * Get accuracy percentage from QuizRecord
 */
export function getQuizAccuracy(record: QuizRecord): number {
  if (record.totalQuestions === 0) return 0;
  return (record.correct / record.totalQuestions) * 100;
}

/**
 * Get timestamp from QuizRecord
 */
export function getQuizTimestamp(record: QuizRecord): string {
  return record.date;
}

/**
 * Get quiz type display name
 */
export function getQuizTypeLabel(type: 'multiple-choice' | 'flashcard'): string {
  return type === 'multiple-choice' ? '选择题' : '闪卡';
}
