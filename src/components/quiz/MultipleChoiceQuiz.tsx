import React, { useState, useCallback } from 'react';
import { VocabularyWord } from '../../types';
import { useQuizHistory } from '../../hooks/useQuizHistory';

interface MultipleChoiceQuizProps {
  words: VocabularyWord[];
}

export const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({ words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { addQuizRecord } = useQuizHistory();

  const currentWord = words[currentIndex];

  const generateOptions = useCallback(() => {
    const correctAnswer = currentWord.chinese_definition;
    if (!correctAnswer) return [];

    const otherWords = words.filter(w => w.id !== currentWord.id && w.chinese_definition);
    const wrongOptions = otherWords
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.chinese_definition!)
      .filter((def): def is string => def !== undefined);

    const allOptions = [...wrongOptions, correctAnswer];
    return allOptions.sort(() => 0.5 - Math.random());
  }, [currentWord, words]);

  const options = generateOptions();

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);

    if (answer === currentWord.chinese_definition) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
        addQuizRecord({
          quizType: 'multiple_choice',
          totalQuestions: words.length,
          correctAnswers: score + (selectedAnswer === currentWord.chinese_definition ? 1 : 0),
          timestamp: Date.now()
        });
      }
    }, 1000);
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
          {`Question ${currentIndex + 1} of ${words.length}`}
        </h2>
        <p className="text-2xl font-bold mt-2">{currentWord.english_word}</p>
      </div>

      <div className="space-y-4 mt-6">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={selectedAnswer !== null}
            className={`w-full p-3 rounded text-left transition ${
              selectedAnswer === option
                ? option === currentWord.chinese_definition
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-gray-200 hover:bg-blue-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p>Score: {score} / {words.length}</p>
      </div>
    </div>
  );
};