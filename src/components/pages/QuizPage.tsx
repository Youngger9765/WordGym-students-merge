import React, { useState } from 'react';
import { QuizConfiguration } from '../../types/quiz';
import { VocabularyWord } from '../../types';
import { useHashRoute } from '../../hooks/useHashRoute';

interface QuizPageProps {
  words: VocabularyWord[];
}

export const QuizPage: React.FC<QuizPageProps> = ({ words }) => {
  const { push } = useHashRoute();

  const [quizType, setQuizType] = useState<QuizConfiguration['type']>('multiple_choice');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<QuizConfiguration['difficulty']>('medium');

  const startQuiz = () => {
    // Filter and shuffle words based on difficulty
    words
      .filter(word => {
        switch (difficulty) {
          case 'easy':
            return true;  // All words
          case 'medium':
            return word.level === 'intermediate';
          case 'hard':
            return word.level === 'advanced';
        }
      })
      .sort(() => 0.5 - Math.random())
      .slice(0, numberOfQuestions);

    // Navigate to specific quiz route
    switch (quizType) {
      case 'multiple_choice':
        push(`#/multiple-choice-quiz?difficulty=${difficulty}&count=${numberOfQuestions}`);
        break;
      case 'flashcard':
        push(`#/flashcard-quiz?difficulty=${difficulty}&count=${numberOfQuestions}`);
        break;
      case 'writing':
        // TODO: Implement writing quiz route
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Quiz Configuration</h1>

      <div className="mb-4">
        <label className="block text-lg font-semibold mb-2">Quiz Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['multiple_choice', 'flashcard', 'writing'] as QuizConfiguration['type'][]).map(type => (
            <button
              key={type}
              className={`p-2 rounded ${
                quizType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setQuizType(type)}
            >
              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-lg font-semibold mb-2">Number of Questions</label>
        <input
          type="range"
          min={5}
          max={30}
          value={numberOfQuestions}
          onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-center">{numberOfQuestions} Questions</p>
      </div>

      <div className="mb-4">
        <label className="block text-lg font-semibold mb-2">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'medium', 'hard'] as QuizConfiguration['difficulty'][]).map(level => (
            <button
              key={level}
              className={`p-2 rounded ${
                difficulty === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setDifficulty(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={startQuiz}
        className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 transition"
      >
        Start {quizType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Quiz
      </button>
    </div>
  );
};