import React, { useState, useMemo } from 'react';
import { VocabularyWord } from '../../types';
import { makeCloze } from '../../utils/quizHelpers';
import { speak } from '../../utils/speechUtils';
import { Button } from '../ui/Button';
import QuizCompletionScreen from './QuizCompletionScreen';
import { useFavorites } from '../../hooks/useFavorites';
import { useQuizHistory } from '../../hooks/useQuizHistory';

interface MultipleChoiceQuizProps {
  words: VocabularyWord[];
}

const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({ words }) => {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { add: addRecord, history } = useQuizHistory();

  const data = words;
  const pool = words;
  const favoritesApi = {
    favorites: Array.from(favorites),
    toggle: (id: number) => {
      if (favorites.has(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    }
  };
  const quizHistoryApi = {
    add: addRecord,
    getAll: () => history
  };
  const onRestart = () => {
    window.location.hash = '#/quiz';
  };
  // Check if we should show completion screen directly
  const shouldShowCompletion = (() => {
    try {
      const completedState = JSON.parse(sessionStorage.getItem('quiz_completed_state') || 'null');
      if (completedState && completedState.type === 'multiple-choice' && completedState.timestamp && Date.now() - completedState.timestamp < 3600000) {
        return true;
      }
    } catch {}
    return false;
  })();

  const validPool = useMemo(() =>
    pool.filter(w => w.example_sentence && w.example_sentence.trim()),
    [pool]
  );

  // Shuffle questions
  const shuffledPool = useMemo(() => {
    return [...validPool].sort(() => Math.random() - 0.5);
  }, [validPool]);

  // Pre-assign correct answer positions (0=A, 1=B, 2=C, 3=D) to ensure even distribution
  const correctAnswerPositions = useMemo(() => {
    const total = shuffledPool.length;
    if (total === 0) return [];

    const baseCount = Math.floor(total / 4);
    const remainder = total % 4;

    const positions = [];
    for (let i = 0; i < 4; i++) {
      const count = baseCount + (i < remainder ? 1 : 0);
      for (let j = 0; j < count; j++) {
        positions.push(i);
      }
    }

    return positions.sort(() => Math.random() - 0.5);
  }, [shuffledPool.length]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime] = useState(() => Date.now());
  const [isFinished, setIsFinished] = useState(shouldShowCompletion);

  const question = useMemo(() => {
    if (shuffledPool.length === 0 || idx >= shuffledPool.length) return null;

    const currentWord = shuffledPool[idx];
    const correctAnswer = currentWord.english_word;
    const correctPosition = correctAnswerPositions[idx];

    const sameTheme = shuffledPool.filter(w =>
      w.theme === currentWord.theme &&
      w.english_word !== correctAnswer
    );

    const distractors: string[] = [];
    const shuffled = [...sameTheme].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      distractors.push(shuffled[i].english_word);
    }

    while (distractors.length < 3 && distractors.length < shuffledPool.length - 1) {
      const random = shuffledPool[Math.floor(Math.random() * shuffledPool.length)];
      if (random.english_word !== correctAnswer && !distractors.includes(random.english_word)) {
        distractors.push(random.english_word);
      }
    }

    const allDistractors = [...distractors];

    // Stage 1: Add from same theme
    const sameThemeRemaining = sameTheme.filter(w => !allDistractors.includes(w.english_word));
    for (let i = 0; i < Math.min(3 - allDistractors.length, sameThemeRemaining.length); i++) {
      allDistractors.push(sameThemeRemaining[i].english_word);
    }

    // Stage 2: Add from same POS in all data
    if (allDistractors.length < 3) {
      const samePOS = data.filter(w =>
        w.pos === currentWord.pos &&
        w.english_word !== correctAnswer &&
        !allDistractors.includes(w.english_word) &&
        w.example_sentence && w.example_sentence.trim()
      );
      const shuffledSamePOS = [...samePOS].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(3 - allDistractors.length, shuffledSamePOS.length); i++) {
        allDistractors.push(shuffledSamePOS[i].english_word);
      }
    }

    // Stage 3: Add from all available data
    if (allDistractors.length < 3) {
      const allAvailable = data.filter(w =>
        w.english_word !== correctAnswer &&
        !allDistractors.includes(w.english_word) &&
        w.example_sentence && w.example_sentence.trim()
      );
      const shuffledAll = [...allAvailable].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(3 - allDistractors.length, shuffledAll.length); i++) {
        const word = shuffledAll[i].english_word;
        if (word) {
          allDistractors.push(word);
        }
      }
    }

    // Build final options: always 4 options
    const finalOptions: string[] = [];
    for (let i = 0; i < Math.min(3, allDistractors.length); i++) {
      finalOptions.push(allDistractors[i]);
    }

    const adjustedPosition = Math.min(correctPosition, finalOptions.length);
    finalOptions.splice(adjustedPosition, 0, correctAnswer);

    const clozedSentence = makeCloze(currentWord.example_sentence || '', correctAnswer);

    return {
      word: currentWord,
      sentence: clozedSentence,
      translation: currentWord.example_translation,
      correctAnswer,
      options: finalOptions
    };
  }, [shuffledPool, idx, correctAnswerPositions, data]);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question) return;
    setShowResult(true);
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    let userAnswerDefinition = '';
    if (selectedAnswer && !isCorrect) {
      const foundWord = data.find(w => w.english_word && w.english_word.toLowerCase() === selectedAnswer.toLowerCase());
      if (foundWord && foundWord.chinese_definition) {
        userAnswerDefinition = foundWord.chinese_definition;
      } else {
        const foundInPool = pool.find(w => w.english_word && w.english_word.toLowerCase() === selectedAnswer.toLowerCase());
        if (foundInPool && foundInPool.chinese_definition) {
          userAnswerDefinition = foundInPool.chinese_definition;
        }
      }
    }

    setAnswers(prev => [...prev, {
      wordId: question.word.id,
      word: question.word.english_word,
      correctAnswer: question.correctAnswer,
      userAnswer: selectedAnswer,
      isCorrect,
      question: question.sentence,
      translation: question.translation,
      wordDefinition: question.word.chinese_definition,
      sentenceTranslation: question.translation,
      userAnswerDefinition: userAnswerDefinition
    }]);
  };

  const handleNext = () => {
    if (idx < shuffledPool.length - 1) {
      setIdx(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);
      const wrongWords = answers.filter(a => !a.isCorrect);
      const correctWords = answers.filter(a => a.isCorrect);

      quizHistoryApi.add({
        type: 'multiple-choice',
        totalQuestions: shuffledPool.length,
        correct: score + (selectedAnswer === question?.correctAnswer ? 1 : 0),
        wrong: wrongWords.length + (selectedAnswer === question?.correctAnswer ? 0 : 1),
        learning: 0,
        wrongWords: wrongWords.map(a => ({
          wordId: a.wordId,
          word: a.word,
          correctAnswer: a.correctAnswer,
          userAnswer: a.userAnswer,
          question: a.question,
          chinese_definition: a.wordDefinition,
          sentenceTranslation: a.sentenceTranslation,
          userAnswerDefinition: a.userAnswerDefinition
        })),
        correctWords: correctWords.map(a => a.wordId),
        duration,
        mode: null
      });

      sessionStorage.setItem('quiz_completed_state', JSON.stringify({
        type: 'multiple-choice',
        timestamp: Date.now()
      }));

      setIsFinished(true);
    }
  };

  // Show completion screen
  if (isFinished) {
    const history = quizHistoryApi.getAll();
    const latest = history[0];

    if (latest && latest.type === 'multiple-choice') {
      return (
        <QuizCompletionScreen
          type="multiple-choice"
          totalQuestions={latest.totalQuestions}
          correct={latest.correct}
          wrong={latest.wrong}
          learning={0}
          wrongWords={latest.wrongWords || []}
          learningWords={[]}
          favoritesApi={favoritesApi}
          onRestart={onRestart}
          data={data}
        />
      );
    }

    // Fallback
    const wrongWords = answers.filter(a => !a.isCorrect);
    const correctCount = score;
    const wrongCount = wrongWords.length;
    const totalCount = shuffledPool.length;

    return (
      <QuizCompletionScreen
        type="multiple-choice"
        totalQuestions={totalCount}
        correct={correctCount}
        wrong={wrongCount}
        learning={0}
        wrongWords={wrongWords}
        learningWords={[]}
        favoritesApi={favoritesApi}
        onRestart={onRestart}
        data={data}
      />
    );
  }

  if (shuffledPool.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-2xl">
        <p className="text-gray-600">沒有可用的題目（需要有例句的單字）</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          第 {idx + 1} 題 / {shuffledPool.length} 題
        </div>
        <div className="text-lg font-semibold text-indigo-600">
          得分：{score} / {idx + (showResult ? 1 : 0)}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-3">
          請選出句中最適合的單字：
        </p>

        <p className="text-lg mb-6 leading-relaxed">
          {question.sentence}
        </p>

        {showResult && question.translation && (
          <p className="text-sm text-gray-500 mb-6 italic">
            {question.translation}
          </p>
        )}

        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              let bgColor = 'bg-white border-gray-300';
              if (showCorrect) bgColor = 'bg-green-100 border-green-500';
              else if (showWrong) bgColor = 'bg-red-100 border-red-500';
              else if (isSelected) bgColor = 'bg-indigo-50 border-indigo-500';

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(option)}
                  disabled={showResult}
                  className={`${bgColor} border-2 rounded-xl p-4 text-left transition hover:shadow-md disabled:cursor-not-allowed`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option}
                  {showCorrect && <span className="ml-2">✓</span>}
                  {showWrong && <span className="ml-2">✗</span>}
                </button>
              );
            })}
          </div>
        </div>

        {showResult && (
          <div className={`p-4 rounded-xl mb-4 ${
            selectedAnswer === question.correctAnswer
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className="font-medium mb-2">
              {selectedAnswer === question.correctAnswer ? '✓ 答對了！' : '✗ 答錯了'}
            </p>
            <p className="text-sm">
              正確答案：<span className="font-semibold">{question.correctAnswer}</span>
            </p>
            {question.word.chinese_definition && (
              <p className="text-sm text-gray-600">
                中文：{question.word.chinese_definition}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer}>
              提交答案
            </Button>
          ) : (
            <>
              <Button onClick={handleNext}>
                下一題
              </Button>
              <button
                onClick={() => speak(question.correctAnswer)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
                title="發音"
              >
                聽發音
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceQuiz;
