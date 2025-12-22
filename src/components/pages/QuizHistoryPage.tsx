import React, { useState } from 'react';
import { useQuizHistory } from '../../hooks/useQuizHistory';
import { formatDate } from '../../utils/dateUtils';

const renderQuizType = (type: string) => {
  const typeLabels: Record<string, string> = {
    'multiple-choice': '選擇題測驗',
    'flashcard': '閃卡測驗',
    'writing': '寫作測驗'
  };
  return typeLabels[type] || '測驗';
};

const QuizHistoryPage: React.FC = () => {
  const { history, clearHistory, deleteRecord } = useQuizHistory();
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const handleDeleteRecord = (recordId: string) => {
    const confirmDelete = window.confirm('確定要刪除這筆測驗記錄？');
    if (confirmDelete) {
      deleteRecord(recordId);
      if (expandedRecord === recordId) {
        setExpandedRecord(null);
      }
    }
  };

  const handleClearHistory = () => {
    const confirmClear = window.confirm('確定要清除所有測驗記錄？');
    if (confirmClear) {
      clearHistory();
      setExpandedRecord(null);
    }
  };

  const toggleRecordDetails = (recordId: string) => {
    setExpandedRecord(prev => prev === recordId ? null : recordId);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">測驗歷史記錄</h1>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-6 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition font-medium"
          >
            清除所有記錄
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        點擊查看歷史記錄，可以看到練習的歷程，記錄在user本機端，最多記錄30筆，user可自行刪除記錄
      </p>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-gray-600 text-lg mb-4">尚無測驗記錄</p>
          <p className="text-gray-500 text-sm">開始測驗以追蹤進度！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedRecord === record.id;
            const correctRate = record.totalQuestions > 0
              ? Math.round((record.correct / record.totalQuestions) * 100)
              : 0;

            return (
              <div
                key={record.id}
                className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Record Header */}
                <div className="flex justify-between items-center p-4 hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg mb-1">
                      {formatDate(record.timestamp || (record.date ? new Date(record.date).getTime() : Date.now()))}
                    </div>
                    <div className="text-sm text-gray-600">
                      {renderQuizType(record.type)} | {record.correct}/{record.totalQuestions} 正確 ({correctRate}%)
                      {record.learning > 0 && ` | 學習中：${record.learning} 題`}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleRecordDetails(record.id || '')}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
                    >
                      {isExpanded ? '收起詳情' : '查看詳情'}
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id || '')}
                      className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition font-medium"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">總題數</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {record.totalQuestions} 題
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">正確</div>
                        <div className="text-2xl font-bold text-green-600">
                          {record.correct} 題
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">錯誤</div>
                        <div className="text-2xl font-bold text-rose-600">
                          {record.wrong || 0} 題
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">學習中</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {record.learning} 題
                        </div>
                      </div>
                    </div>

                    {record.duration !== undefined && (
                      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                        <div className="text-gray-500 text-sm mb-1">測驗時間</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {record.duration}秒
                        </div>
                      </div>
                    )}

                    {/* Learning Words Section */}
                    {record.learningWords && record.learningWords.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="font-semibold text-orange-900 mb-3">
                          學習中單字：
                        </div>
                        <div className="space-y-2">
                          {record.learningWords.map((w, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg p-3 border border-orange-200"
                            >
                              <div className="font-medium text-gray-900">
                                {idx + 1}. {w.word}
                              </div>
                              {w.wordId && (
                                <a
                                  href={`#/word/${w.wordId}`}
                                  className="text-indigo-600 hover:underline text-sm mt-1 inline-block"
                                >
                                  查看單字詳情 →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizHistoryPage;
