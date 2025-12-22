import React, { useMemo } from 'react';
import { VocabularyWord, UserSettings } from '../../types';
import { useHashRoute } from '../../hooks/useHashRoute';
import { VersionService } from '../../services/VersionService';
import MultipleChoiceQuiz from '../quiz/MultipleChoiceQuiz';
import FlashcardQuiz from '../quiz/FlashcardQuiz';

interface QuizPageProps {
  words: VocabularyWord[];
  userSettings: UserSettings | null;
}

export const QuizPage: React.FC<QuizPageProps> = ({ words, userSettings }) => {
  const { hash, push } = useHashRoute();

  // Parse URL params
  const params = useMemo(() => {
    return new URLSearchParams(hash.split('?')[1] || '');
  }, [hash]);

  const quizType = params.get('type') || 'selection';
  const restartKey = `${quizType}-${params.get('_restart') || '0'}`;

  // Filter words by version first
  const versionFilteredWords = useMemo(() => {
    if (!userSettings) return words;

    const normalizedUserStage = VersionService.normalizeStage(userSettings.stage || '');

    return words.filter(word => {
      // Stage filter
      const normalizedWordStage = VersionService.normalizeStage(word.stage || '');
      return normalizedWordStage === normalizedUserStage;
    });
  }, [words, userSettings]);

  // Parse word IDs from URL params
  const quizWords = useMemo(() => {
    const wordIdsParam = params.get('words');

    if (!wordIdsParam) {
      return []; // Default to 0 questions - user must select range first
    }

    // When specific word IDs are provided (e.g., from favorites), don't apply version filter
    // because favorites can contain words from any version
    const wordIds = wordIdsParam.split(',').map(id => parseInt(id, 10));
    return words.filter(w => wordIds.includes(w.id));
  }, [params, words, versionFilteredWords]);

  const validQuizWords = useMemo(() => {
    // Filter words that have example sentences for multiple choice quiz
    return quizWords.filter(w => w.example_sentence && w.example_sentence.trim());
  }, [quizWords]);

  const handleStartMultipleChoice = () => {
    const currentParams = new URLSearchParams(hash.split('?')[1] || '');
    currentParams.set('type', 'multiple-choice');
    currentParams.delete('_restart'); // Remove restart flag if exists
    push(`#/quiz?${currentParams.toString()}`);
  };

  const handleStartFlashcard = () => {
    const currentParams = new URLSearchParams(hash.split('?')[1] || '');
    currentParams.set('type', 'flashcard');
    currentParams.delete('_restart'); // Remove restart flag if exists
    push(`#/quiz?${currentParams.toString()}`);
  };

  const handleViewHistory = () => {
    push('#/quiz-history');
  };

  const handleRestart = () => {
    sessionStorage.removeItem('quiz_completed_state');
    sessionStorage.removeItem('quiz_return_path');
    const currentParams = new URLSearchParams(hash.split('?')[1] || '');
    currentParams.set('_restart', Date.now().toString());
    push(`#/quiz?${currentParams.toString()}`);
  };

  if (quizWords.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200">
          <svg
            className="mx-auto h-16 w-16 text-orange-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-gray-800 text-lg font-semibold mb-2">請先選擇題目範圍</p>
          <p className="text-gray-600 mb-6">請先到「單字卡」選擇題目範圍</p>
          <button
            onClick={() => window.location.hash = '#/'}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition shadow-md hover:shadow-lg"
          >
            前往單字卡
          </button>
        </div>
      </div>
    );
  }

  // Render quiz based on type
  if (quizType === 'multiple-choice') {
    return (
      <MultipleChoiceQuiz
        key={`multiple-choice-${restartKey}`}
        words={quizWords}
        onRestart={handleRestart}
      />
    );
  }

  if (quizType === 'flashcard') {
    return (
      <FlashcardQuiz
        key={`flashcard-${restartKey}`}
        words={quizWords}
        onRestart={handleRestart}
      />
    );
  }

  // Selection screen
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-lg border-t-4 border-indigo-600 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">實力驗收</h1>
        <p className="text-center text-gray-600 mb-8">
          你已選擇練習 <span className="font-bold text-indigo-600">{quizWords.length}</span> 題
        </p>

        <div className="space-y-4">
          {/* Multiple Choice Button */}
          <button
            onClick={handleStartMultipleChoice}
            disabled={validQuizWords.length === 0}
            className={`w-full py-6 px-6 rounded-2xl text-white font-bold text-xl transition shadow-lg ${
              validQuizWords.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'
            }`}
          >
            選擇題
            {validQuizWords.length === 0 && (
              <span className="block text-sm font-normal mt-1">
                （需要有例句的單字）
              </span>
            )}
          </button>

          {/* Flashcard Button */}
          <button
            onClick={handleStartFlashcard}
            className="w-full py-6 px-6 rounded-2xl bg-white border-2 border-indigo-600 text-indigo-600 font-bold text-xl hover:bg-indigo-50 transition shadow-md hover:shadow-lg"
          >
            閃卡
          </button>

          {/* Quiz History Button */}
          <button
            onClick={handleViewHistory}
            className="w-full py-6 px-6 rounded-2xl bg-gray-100 border-2 border-gray-300 text-gray-700 font-bold text-xl hover:bg-gray-200 transition shadow-md hover:shadow-lg"
          >
            查看歷史記錄
          </button>
        </div>
      </div>
    </div>
  );
};
