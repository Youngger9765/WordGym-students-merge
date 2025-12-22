import React, { useState, useMemo } from 'react';
import { VocabularyWord } from '../../types';
import { makeCloze } from '../../utils/quizHelpers';
import { speak } from '../../utils/speechUtils';
import { Button } from '../ui/Button';
import QuizCompletionScreen from './QuizCompletionScreen';
import { useFavorites } from '../../hooks/useFavorites';
import { useQuizHistory } from '../../hooks/useQuizHistory';
import { useHashRoute } from '../../hooks/useHashRoute';

interface MultipleChoiceQuizProps {
  words: VocabularyWord[];
  onRestart?: () => void;
}

const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({ words, onRestart }) => {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { add: addRecord, history } = useQuizHistory();
  const { hash } = useHashRoute();

  const data = words;
  const pool = words; // Use words directly from props (already filtered by QuizPage)
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
  const handleRestartClick = onRestart || (() => {
    window.location.hash = '#/quiz';
  });
  // Check if we should show completion screen directly
  // Only show completion if we have _restart parameter or if this is a return from word detail
  const shouldShowCompletion = (() => {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const hasRestart = params.has('_restart');

    // If _restart parameter exists, never show completion (user wants to restart)
    if (hasRestart) {
      return false;
    }

    // Otherwise check if we just completed and are returning
    try {
      const completedState = JSON.parse(sessionStorage.getItem('quiz_completed_state') || 'null');
      const returnPath = JSON.parse(sessionStorage.getItem('quiz_return_path') || 'null');

      // Only show completion if:
      // 1. We have a completion state for this quiz type
      // 2. It's recent (within 1 hour)
      // 3. We're returning from a word detail page
      if (completedState &&
          completedState.type === 'multiple-choice' &&
          completedState.timestamp &&
          Date.now() - completedState.timestamp < 3600000 &&
          returnPath &&
          Date.now() - returnPath.timestamp < 60000) { // Within 1 minute
        return true;
      }
    } catch {}
    return false;
  })();

  const validPool = useMemo(() =>
    pool.filter(w => w.example_sentence && w.example_sentence.trim()),
    [pool]
  );

  // Shuffle questions - use all selected words (no limit)
  const shuffledPool = useMemo(() => {
    const shuffled = [...validPool].sort(() => Math.random() - 0.5);
    return shuffled; // Use all words from selected range
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

    // Get current word's POS
    const currentPOS = (currentWord.posTags && currentWord.posTags.length > 0)
      ? currentWord.posTags[0]
      : currentWord.pos;

    // Step 1: Get same POS words from the same pool (current quiz range)
    const samePOSInPool = pool.filter(w => {
      const wordPOS = (w.posTags && w.posTags.length > 0)
        ? w.posTags[0]
        : w.pos;

      return wordPOS && currentPOS &&
        wordPOS === currentPOS &&
        w.english_word !== correctAnswer;
    });

    const allDistractors: string[] = [];

    // Add random words from same POS in pool
    const shuffledSamePOS = [...samePOSInPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffledSamePOS.length); i++) {
      allDistractors.push(shuffledSamePOS[i].english_word);
    }

    // Step 2: If not enough, add random words from pool (any POS)
    if (allDistractors.length < 3) {
      const otherWords = pool.filter(w =>
        w.english_word !== correctAnswer &&
        !allDistractors.includes(w.english_word)
      );
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(3 - allDistractors.length, shuffledOthers.length); i++) {
        allDistractors.push(shuffledOthers[i].english_word);
      }
    }

    // Step 3: Fallback strategies to ensure exactly 3 distractors
    const fallbackOptions = [
      'apple', 'banana', 'computer', 'develop', 'education',
      'family', 'government', 'history', 'important', 'justice',
      'knowledge', 'language', 'mountain', 'nature', 'organization'
    ];

    while (allDistractors.length < 3) {
      // Try to find unused fallback words
      const unusedFallbacks = fallbackOptions.filter(fb =>
        fb !== correctAnswer.toLowerCase() &&
        !allDistractors.some(d => d.toLowerCase() === fb)
      );

      if (unusedFallbacks.length > 0) {
        const randomFallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        allDistractors.push(randomFallback);
      } else {
        // Last resort: generate synthetic options
        allDistractors.push(`option_${allDistractors.length + 1}`);
      }
    }

    // Ensure exactly 3 unique distractors
    const uniqueDistractors = [...new Set(allDistractors.slice(0, 3))];

    // If we still don't have 3 after deduplication, pad with fallbacks
    while (uniqueDistractors.length < 3) {
      const syntheticOption = `word_${uniqueDistractors.length + 1}`;
      if (!uniqueDistractors.includes(syntheticOption) && syntheticOption !== correctAnswer) {
        uniqueDistractors.push(syntheticOption);
      }
    }

    // Build final options: ALWAYS exactly 4 options (3 distractors + 1 correct)
    const finalOptions: string[] = [...uniqueDistractors.slice(0, 3)];

    // Insert correct answer at the predetermined position
    const adjustedPosition = Math.min(correctPosition, 3); // Position must be 0-3
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
        correctWords: correctWords.map(a => ({
          wordId: a.wordId,
          word: a.word,
          correctAnswer: a.correctAnswer,
          userAnswer: a.userAnswer,
          question: a.question,
          chinese_definition: a.wordDefinition,
          sentenceTranslation: a.sentenceTranslation
        })),
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
          correctWords={latest.correctWords || []}
          learningWords={[]}
          favoritesApi={favoritesApi}
          onRestart={handleRestartClick}
          data={data}
        />
      );
    }

    // Fallback
    const wrongAnswers = answers.filter(a => !a.isCorrect);
    const correctAnswers = answers.filter(a => a.isCorrect);
    const correctCount = score;
    const wrongCount = wrongAnswers.length;
    const totalCount = shuffledPool.length;

    return (
      <QuizCompletionScreen
        type="multiple-choice"
        totalQuestions={totalCount}
        correct={correctCount}
        wrong={wrongCount}
        learning={0}
        wrongWords={wrongAnswers}
        correctWords={correctAnswers}
        learningWords={[]}
        favoritesApi={favoritesApi}
        onRestart={handleRestartClick}
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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">實力驗收</h1>
      {/* Quiz Mode Selection Buttons */}
      <div className="mb-4 flex gap-3">
        <button
          className="flex-1 px-8 py-3 rounded-xl bg-indigo-600 text-white text-lg font-medium transition"
        >
          選擇題
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(hash.split('?')[1] || '');
            params.set('type', 'flashcard');
            window.location.hash = `#/quiz?${params.toString()}`;
          }}
          className="flex-1 px-8 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-50 transition"
        >
          閃卡
        </button>
        <button
          onClick={() => window.location.hash = '#/quiz-history'}
          className="flex-1 px-8 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-200 transition"
        >
          查看歷史記錄
        </button>
      </div>

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
                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option.replace(/\s*\([a-z\.\/]+\)\s*/gi, '').trim()}
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
