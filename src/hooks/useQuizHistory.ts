import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QuizRecord, LS } from '../types';

const MAX_RECORDS = 30;

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LS.quizHistory);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, MAX_RECORDS) : [];
      }
    } catch (e) {
      console.error('Failed to parse quiz history:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      const recordsToSave = history.slice(0, MAX_RECORDS);
      localStorage.setItem(LS.quizHistory, JSON.stringify(recordsToSave));
    } catch (e) {
      console.error('Failed to save quiz history:', e);
    }
  }, [history]);

  const add = useCallback((record: Omit<QuizRecord, 'id' | 'date' | 'timestamp'>) => {
    const now = Date.now();
    const newRecord: QuizRecord = {
      ...record,
      id: uuidv4(),
      date: new Date(now).toISOString(),
      timestamp: now
    };
    setHistory(prev => [newRecord, ...prev].slice(0, MAX_RECORDS));
  }, []);

  const getAll = useCallback(() => {
    return history;
  }, [history]);

  const remove = useCallback((recordId: string) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    add,
    getAll,
    remove,
    clearAll,
    // Legacy support
    history,
    addQuizRecord: add,
    clearHistory: clearAll,
    deleteRecord: remove
  };
}