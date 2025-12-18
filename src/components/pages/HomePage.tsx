import React, { useState } from 'react';
import { VocabularyWord, FilterOptions } from '../../types';
import { useDataset } from '../../hooks/useDataset';
import { useFilters } from '../../hooks/useFilters';
import { LazyWordCard } from '../cards/LazyWordCard';
import { useFavorites } from '../../hooks/useFavorites';

const LearningModes = {
  ALL_WORDS: 'All Words',
  FAVORITES: 'Favorites',
  LEARNING: 'Learning'
};

export const HomePage: React.FC = () => {
  const { data: words } = useDataset();
  const { favorites } = useFavorites();
  const [learningMode, setLearningMode] = useState<string>(LearningModes.ALL_WORDS);

  const filterOptions: FilterOptions = {
    searchTerm: '',
    posFilter: 'all',
    levelFilter: '',
    themeFilter: ''
  };

  const { filteredWords } = useFilters(words, filterOptions);

  const getFilteredWords = () => {
    switch (learningMode) {
      case LearningModes.FAVORITES:
        return filteredWords.filter(word => favorites.has(word.id));
      case LearningModes.LEARNING:
        // TODO: Implement learning mode logic based on study history
        return filteredWords;
      default:
        return filteredWords;
    }
  };

  const handleWordClick = (word: VocabularyWord) => {
    // TODO: Navigate to word detail page or implement detailed view
    console.log('Word clicked:', word);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex space-x-2">
        {Object.values(LearningModes).map(mode => (
          <button
            key={mode}
            className={`px-4 py-2 rounded ${
              learningMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setLearningMode(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search words..."
          className="border p-2 rounded"
        />
        <select
          className="border p-2 rounded"
        >
          <option value="all">All Parts of Speech</option>
          <option value="noun">Noun</option>
          <option value="verb">Verb</option>
        </select>
        <select
          className="border p-2 rounded"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredWords().map((word, index) => (
          <LazyWordCard
            key={word.id}
            word={word}
            index={index}
            accentColor="blue"
            onClick={() => handleWordClick(word)}
          />
        ))}
      </div>
    </div>
  );
};