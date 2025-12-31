import React, { useMemo } from 'react';
import { VocabularyWord, UserSettings } from '../../types';
import { useHashRoute } from '../../hooks/useHashRoute';
import { useFilteredWordIds } from '../../hooks/useFilteredWordIds';
import { VersionService } from '../../services/VersionService';
import MultipleChoiceQuiz from '../quiz/MultipleChoiceQuiz';
import FlashcardQuiz from '../quiz/FlashcardQuiz';

interface QuizPageProps {
  words: VocabularyWord[];
  userSettings: UserSettings | null;
}

export const QuizPage: React.FC<QuizPageProps> = ({ words, userSettings }) => {
  const { hash, push } = useHashRoute();
  const { filteredWordIds } = useFilteredWordIds();

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

  // Parse word IDs from URL params OR use global filtered word IDs
  const quizWords = useMemo(() => {
    const wordIdsParam = params.get('words');

    // Priority 1: URL params (from explicit "測驗此範圍" button click)
    if (wordIdsParam) {
      const wordIds = wordIdsParam.split(',').map(id => parseInt(id, 10));
      return words.filter(w => wordIds.includes(w.id));
    }

    // Priority 2: Global filtered word IDs (from HomePage filter state)
    if (filteredWordIds && filteredWordIds.length > 0) {
      return words.filter(w => filteredWordIds.includes(w.id));
    }

    // Priority 3: Empty (show prompt to select range)
    return [];
  }, [params, words, filteredWordIds, versionFilteredWords]);

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
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">實力驗收（0）</h2>
          <p className="text-gray-600 mb-6">
            你還沒有選擇挑戰範圍喔！<br />
            請先在「單字卡」熟悉內容，累積足夠實力後再來這裡進行挑戰！
          </p>
          <button
            onClick={() => window.location.hash = '#/'}
            className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition duration-150"
          >
            立即前往單字卡
          </button>
          <div>
            <img
              src="https://github.com/user-attachments/assets/e05d58f4-64fb-4fa7-89ea-65aaabdcc804"
              alt="健身男孩插圖"
              className="mx-auto max-w-md w-full"
            />
          </div>
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
