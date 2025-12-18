import React from 'react';
import { QuizRecord } from '../../types/quiz';
import { useQuizHistory } from '../../hooks/useQuizHistory';

export const QuizHistoryPage: React.FC = () => {
  const { history: quizSessions } = useQuizHistory();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderQuizType = (type: QuizRecord['quizType']) => {
    const typeLabels = {
      'multiple_choice': 'Multiple Choice',
      'flashcard': 'Flashcard',
      'writing': 'Writing'
    };
    return typeLabels[type];
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Quiz History</h1>

      {quizSessions.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No quiz sessions yet. Start a quiz to track your progress!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white shadow rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">
                  {renderQuizType(session.quizType)} Quiz
                </span>
                <span className="text-gray-500 text-sm">
                  {formatDate(session.timestamp)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-lg font-bold text-green-600">
                    {session.correctAnswers}
                  </span>
                  <p className="text-xs text-gray-500">Correct</p>
                </div>
                <div>
                  <span className="text-lg font-bold text-red-600">
                    {session.totalQuestions - session.correctAnswers}
                  </span>
                  <p className="text-xs text-gray-500">Incorrect</p>
                </div>
                <div>
                  <span className="text-lg font-bold">
                    {Math.round((session.correctAnswers / session.totalQuestions) * 100)}%
                  </span>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};