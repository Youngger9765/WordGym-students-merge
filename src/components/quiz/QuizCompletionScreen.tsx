import React from 'react';
import { useHashRoute } from '../../hooks/useHashRoute';
import { QuizCompletionProps } from '../../types/quiz';

const QuizCompletionScreen: React.FC<QuizCompletionProps> = ({
  type,
  stats,
  words,
  onRestart
}) => {
  const { push } = useHashRoute();
  const { correct, learning, mastered, totalQuestions } = stats;

  const addToFavorites = () => {
    // TODO: Implement adding wrong/learning words to favorites
    const wordsToAdd = words.filter(() =>
      stats.wrong > 0 || stats.learning > 0
    );
    console.log('Words to add to favorites:', wordsToAdd);
  };

  const percentageCorrect = (correct / totalQuestions) * 100;

  return (
    <div className="quiz-completion-screen p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">
        {type === 'multiple_choice' ? '選擇題測驗結束' : '閃卡測驗結束'}
      </h2>

      <div className="stats grid grid-cols-2 gap-4 mb-6">
        <div className="stat-box bg-green-100 p-4 rounded">
          <h3 className="text-lg font-semibold text-green-800">正確答案</h3>
          <p className="text-2xl font-bold text-green-600">{correct} / {totalQuestions}</p>
        </div>
        <div className="stat-box bg-blue-100 p-4 rounded">
          <h3 className="text-lg font-semibold text-blue-800">正確率</h3>
          <p className="text-2xl font-bold text-blue-600">{percentageCorrect.toFixed(1)}%</p>
        </div>
      </div>

      <div className="breakdown grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="text-lg font-semibold text-yellow-800">學習中的詞</h3>
          <p className="text-2xl font-bold text-yellow-600">{learning}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="text-lg font-semibold text-purple-800">已掌握的詞</h3>
          <p className="text-2xl font-bold text-purple-600">{mastered}</p>
        </div>
      </div>

      <div className="actions grid grid-cols-3 gap-4">
        <button
          onClick={onRestart}
          className="btn bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          再測一次
        </button>
        <button
          onClick={addToFavorites}
          className="btn bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition"
        >
          加入重點訓練
        </button>
        <button
          onClick={() => push('#/quiz')}
          className="btn bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          返回設定
        </button>
      </div>
    </div>
  );
};

export default QuizCompletionScreen;