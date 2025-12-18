import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QuizRecord } from '../types/quiz';

const LS_KEY = 'mvp_vocab_quiz_history_v1';

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save quiz history:', e);
    }
  }, [history]);

  const addQuizRecord = (record: Omit<QuizRecord, 'id'>) => {
    const newRecord: QuizRecord = {
      ...record,
      id: uuidv4()
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteRecord = (recordId: string) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));
  };

  return {
    history,
    addQuizRecord,
    clearHistory,
    deleteRecord
  };
}