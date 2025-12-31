import React from 'react';
import { VocabularyWord, POS_LABEL, POSType } from '../../types';
import { useFavorites } from '../../hooks/useFavorites';

interface FavoritesPageProps {
  words: VocabularyWord[];
  onStartQuiz?: (words: VocabularyWord[]) => void;
  isLoading?: boolean;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ words, onStartQuiz, isLoading = false }) => {
  const { favorites, clearFavorites, removeFavorite } = useFavorites();

  const favoriteWords = words.filter(word => favorites.has(word.id));

  const handleStartQuiz = () => {
    if (onStartQuiz && favoriteWords.length > 0) {
      onStartQuiz(favoriteWords);
    } else if (favoriteWords.length > 0) {
      // Navigate to quiz page with favorite word IDs
      const wordIds = favoriteWords.map(w => w.id).join(',');
      window.location.hash = `#/quiz?words=${wordIds}`;
    }
  };

  const handleRemoveWord = (wordId: number) => {
    removeFavorite(wordId);
  };

  // Show loading state if data is still loading and favorites exist
  const showLoading = isLoading || (words.length === 0 && favorites.size > 0);

  if (showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.history.back()}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm font-medium transition duration-150 min-h-[44px] flex items-center"
              >
                ← 返回
              </button>
            </div>
          </div>

          {/* Loading state */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-pulse">
              <div className="inline-block h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">載入中...</p>
              <p className="text-sm text-gray-500 mt-2">正在載入重點訓練單字</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm font-medium transition duration-150 min-h-[44px] flex items-center"
            >
              ← 返回
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-sm text-gray-500 mb-2">
            點擊重點訓練，可以在這邊複習單字，或是進行測驗
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              重點訓練 ({favoriteWords.length})
            </h1>
            <div className="flex gap-2">
              {favoriteWords.length > 0 && (
                <>
                  <button
                    onClick={handleStartQuiz}
                    disabled={favoriteWords.length < 5}
                    className={`px-6 py-2 rounded-lg font-medium transition duration-150 min-h-[44px] ${
                      favoriteWords.length < 5
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    開始測驗
                  </button>
                  <button
                    onClick={clearFavorites}
                    className="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition duration-150 min-h-[44px]"
                  >
                    全部清除
                  </button>
                </>
              )}
            </div>
          </div>
          {favoriteWords.length > 0 && favoriteWords.length < 5 && (
            <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">提醒：</span>建議累積至少 5 題再進行測驗，以確保測驗選項充足（目前 {favoriteWords.length} 題）
              </p>
            </div>
          )}
        </div>

        {/* Word cards */}
        {favoriteWords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">重點訓練（0）</h2>
            <p className="text-gray-600 mb-6">
              目前沒有加入重點訓練的單字喔！<br />
              請在「單字卡區」收藏不熟的單字，我們就會為你自動匯入，幫助你精準複習！
            </p>
            <button
              onClick={() => window.location.hash = '#/'}
              className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition duration-150"
            >
              立即前往單字卡
            </button>
            <div>
              <img
                src="https://github.com/user-attachments/assets/22a99160-2944-4600-b8c5-a1152624fb5c"
                alt="背單字女孩插圖"
                className="mx-auto max-w-md w-full"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteWords.map((word) => (
              <div
                key={word.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {word.english_word}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {word.posTags && word.posTags.length > 0 ? (
                      word.posTags.map((pos, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {POS_LABEL[pos as POSType] || pos}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        other
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveWord(word.id)}
                    className="mt-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};