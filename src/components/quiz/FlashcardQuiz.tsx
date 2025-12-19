import React, { useState, useMemo } from 'react';
import { useHashRoute } from '../../hooks/useHashRoute';
import { useQuizHistory } from '../../hooks/useQuizHistory';
import { VocabularyWord, QuizDifficulty } from '../../types';
import QuizCompletionScreen from './QuizCompletionScreen';

interface FlashcardQuizProps {
  words: VocabularyWord[];
}

const FlashcardQuiz: React.FC<FlashcardQuizProps> = ({ words }) => {
  const { hash, push } = useHashRoute();
  const { addQuizRecord } = useQuizHistory();

  // Extract word IDs from hash
  const wordIds = useMemo(() => {
    const queryString = hash.split('?')[1];
    if (!queryString) return [];
    const params = new URLSearchParams(queryString);
    const idsParam = params.get('wordIds');
    if (!idsParam) return [];
    return idsParam.split(',').map(Number);
  }, [hash]);

  // Filter words based on IDs
  const quizWords = useMemo(() =>
    wordIds.length > 0
      ? words.filter(word => wordIds.includes(word.id))
      : words
  , [words, wordIds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);

  const [learning, setLearning] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [skippedWords, setSkippedWords] = useState<VocabularyWord[]>([]);

  const currentWord = quizWords[currentIndex] || {} as VocabularyWord;

  const handleCardInteraction = (known: boolean) => {
    if (known) {
      setMastered(prev => prev + 1);
    } else {
      setLearning(prev => prev + 1);
      setSkippedWords(prev => [...prev, currentWord]);
    }

    // Move to next word
    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Complete quiz
      const quizRecord = {
        quizType: 'flashcard' as const,
        totalQuestions: quizWords.length,
        correctAnswers: mastered,
        timestamp: Date.now(),
        words: wordIds.map(String),
        difficulty: quizWords.length > 15
          ? 'hard'
          : quizWords.length > 10
            ? 'medium'
            : 'easy' as QuizDifficulty,
        score: (mastered / quizWords.length) * 100,
        wrong: learning,
        learning,
        mastered
      };

      addQuizRecord(quizRecord);
      setQuizEnded(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setLearning(0);
    setMastered(0);
    setSkippedWords([]);
    setIsFlipped(false);
    setQuizEnded(false);
  };

  if (quizWords.length === 0) {
    return <div>No words available for quiz</div>;
  }

  if (quizEnded) {
    return (
      <QuizCompletionScreen
        type="flashcard"
        stats={{
          correct: mastered,
          wrong: 0,
          learning,
          mastered,
          totalQuestions: quizWords.length
        }}
        words={skippedWords}
        onRestart={restartQuiz}
        onClose={() => push('#/quiz')}
      />
    );
  }

  return (
    <div className="flashcard-quiz container mx-auto p-6 max-w-md">
      <div className="progress mb-4 text-center">
        Card {currentIndex + 1} / {quizWords.length}
      </div>

      <div
        className={`flashcard relative w-full h-96 transition-transform duration-500 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`absolute w-full h-full bg-white border rounded-lg shadow-lg p-6 flex items-center justify-center text-2xl text-center transition-transform duration-500
            ${!isFlipped ? 'rotate-y-0' : 'rotate-y-180 hidden'}
          `}
        >
          {currentWord.english}
        </div>

        <div
          className={`absolute w-full h-full bg-blue-100 border rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-lg text-center transition-transform duration-500
            ${isFlipped ? 'rotate-y-0' : 'rotate-y-180 hidden'}
          `}
        >
          <div className="mb-4">
            <p className="font-bold text-xl">{currentWord.chinese_definition}</p>
            {currentWord.languageExamples && currentWord.languageExamples.length > 0 && (
              <p className="mt-2 italic text-gray-600">
                {currentWord.languageExamples[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="quiz-actions mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => handleCardInteraction(false)}
            className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            不熟 (Learning)
          </button>
          <button
            onClick={() => handleCardInteraction(true)}
            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            記得 (Mastered)
          </button>
        </div>
      )}

      <style>{`
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .hidden {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default FlashcardQuiz;