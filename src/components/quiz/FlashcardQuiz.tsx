import React, { useState } from 'react';
import { VocabularyWord } from '../../types';
import { useQuizHistory } from '../../hooks/useQuizHistory';

interface FlashcardQuizProps {
  words: VocabularyWord[];
}

export const FlashcardQuiz: React.FC<FlashcardQuizProps> = ({ words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const { addQuizRecord } = useQuizHistory();

  const currentWord = words[currentIndex];

  const handleSelfJudgment = (wasCorrect: boolean) => {
    if (wasCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setShowResult(true);
      addQuizRecord({
        quizType: 'flashcard',
        totalQuestions: words.length,
        correctAnswers: score + (wasCorrect ? 1 : 0),
        timestamp: Date.now()
      });
    }
  };

  if (showResult) {
    return (
      <div className="text-center p-6">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-lg">
          You scored {score} out of {words.length}
        </p>
        <button
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded"
          // TODO: Implement reset or return to quiz config
        >
          Return to Quiz Configuration
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold">
          {`Flashcard ${currentIndex + 1} of ${words.length}`}
        </h2>
      </div>

      <div
        className={`flashcard-container ${isFlipped ? 'is-flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flashcard">
          <div className="flashcard-front bg-white shadow rounded-lg p-6 text-center cursor-pointer">
            <h3 className="text-2xl font-bold">{currentWord.english_word}</h3>
            <p className="text-gray-500 mt-2">{currentWord.kk_phonetic}</p>
          </div>
          <div className="flashcard-back bg-gray-100 shadow rounded-lg p-6 text-center cursor-pointer">
            <h3 className="text-2xl font-bold">{currentWord.chinese_definition}</h3>
            <p className="text-gray-500 mt-2">{currentWord.example_sentence}</p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => handleSelfJudgment(true)}
            className="bg-green-500 text-white px-6 py-2 rounded"
          >
            I knew it
          </button>
          <button
            onClick={() => handleSelfJudgment(false)}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            I didn't know
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p>Score: {score} / {words.length}</p>
      </div>
    </div>
  );
};