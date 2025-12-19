import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useHashRoute } from '../../hooks/useHashRoute';
import { useQuizHistory } from '../../hooks/useQuizHistory';
import { generateDisractors } from '../../utils/quizHelpers';
import { VocabularyWord, QuizDifficulty } from '../../types';
import QuizCompletionScreen from './QuizCompletionScreen';

interface MultipleChoiceQuizProps {
  words: VocabularyWord[];
}

const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({ words }) => {
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [_isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizEnded, setQuizEnded] = useState(false);

  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [learning, setLearning] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [wrongWords, setWrongWords] = useState<VocabularyWord[]>([]);

  const currentWord = quizWords[currentIndex] || {} as VocabularyWord;

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  const generateQuizData = useCallback((word: VocabularyWord) => {
    const clozeQuestion = word.english;
    const distractors = generateDisractors(word, quizWords)
      .map(distractor => distractor);
    const allOptions = [word.chinese_definition, ...distractors];

    return {
      question: clozeQuestion,
      options: allOptions.sort(() => 0.5 - Math.random()),
      correctAnswer: word.chinese_definition
    };
  }, [quizWords]);

  useEffect(() => {
    if (currentWord) {
      const { question, options } = generateQuizData(currentWord);
      setQuestion(question);
      setOptions(options);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [currentWord, generateQuizData]);

  const handleAnswer = (selectedOption: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(selectedOption);
    const newIsCorrect = selectedOption === currentWord.chinese_definition;
    setIsCorrect(newIsCorrect);

    if (newIsCorrect) {
      setCorrect(prev => prev + 1);
      setMastered(prev => prev + 1);
    } else {
      setWrong(prev => prev + 1);
      setLearning(prev => prev + 1);
      setWrongWords(prev => [...prev, currentWord]);
    }

    // Automatically move to next question after a delay
    setTimeout(() => {
      nextQuestion();
    }, 1000);
  };

  const nextQuestion = () => {
    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Quiz completed
      const quizRecord = {
        quizType: 'multiple_choice' as const,
        totalQuestions: quizWords.length,
        correctAnswers: correct,
        timestamp: Date.now(),
        words: wordIds.map(String),
        difficulty: quizWords.length > 15
          ? 'hard'
          : quizWords.length > 10
            ? 'medium'
            : 'easy' as QuizDifficulty,
        score: (correct / quizWords.length) * 100,
        wrong,
        learning,
        mastered
      };

      addQuizRecord(quizRecord);
      setQuizEnded(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setCorrect(0);
    setWrong(0);
    setLearning(0);
    setMastered(0);
    setWrongWords([]);
    setQuizEnded(false);
  };

  if (quizWords.length === 0) {
    return <div>No words available for quiz</div>;
  }

  if (quizEnded) {
    return (
      <QuizCompletionScreen
        type="multiple_choice"
        stats={{
          correct,
          wrong,
          learning,
          mastered,
          totalQuestions: quizWords.length
        }}
        words={wrongWords}
        onRestart={restartQuiz}
        onClose={() => push('#/quiz')}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold">
          {`Question ${currentIndex + 1} of ${quizWords.length}`}
        </h2>
        <p className="text-2xl font-bold mt-2">{question}</p>
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
        <p>Score: {correct} / {quizWords.length}</p>
      </div>
    </div>
  );
};

export default MultipleChoiceQuiz;