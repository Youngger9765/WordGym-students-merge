import React, { useState } from 'react';
import { QuizRecord } from '../../types/quiz';
import { useQuizHistory } from '../../hooks/useQuizHistory';

import { formatDate } from '../../utils/dateUtils';

const renderQuizType = (type: QuizRecord['quizType']) => {
  const typeLabels = {
    'multiple_choice': '選擇題',
    'flashcard': '閃卡',
    'writing': '寫作'
  };
  return typeLabels[type];
};

const QuizHistoryPage: React.FC = () => {
  const { history, clearHistory, deleteRecord } = useQuizHistory();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const handleDeleteRecord = (recordId: string) => {
    const confirmDelete = window.confirm('確定要刪除這筆測驗記錄？');
    if (confirmDelete) {
      deleteRecord(recordId);
    }
  };

  const handleClearHistory = () => {
    const confirmClear = window.confirm('確定要清除所有測驗記錄？');
    if (confirmClear) {
      clearHistory();
    }
  };

  const toggleRecordDetails = (recordId: string) => {
    setSelectedRecord(prev => prev === recordId ? null : recordId);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">測驗歷史</h1>

      {history.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>尚無測驗記錄。開始測驗以追蹤進度！</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {history.map((session) => (
              <div
                key={session.id}
                className="bg-white shadow rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold mr-2">
                      {renderQuizType(session.quizType)}測驗
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(session.timestamp)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleRecordDetails(session.id || '')}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      {selectedRecord === session.id ? '隱藏' : '詳情'}
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(session.id || '')}
                      className="text-red-500 hover:text-red-600"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                {selectedRecord === session.id && (
                  <div className="mt-4 bg-gray-100 rounded p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold">總題數</h4>
                        <p>{session.totalQuestions}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">正確答案</h4>
                        <p>{session.correctAnswers}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">學習中</h4>
                        <p>{session.learning || 0}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">已掌握</h4>
                        <p>{session.mastered || 0}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">正確率</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{width: `${session.score}%`}}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {session.score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleClearHistory}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              清除所有記錄
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizHistoryPage;