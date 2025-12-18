import React from 'react';
import { VocabularyWord } from '../../types';
import { useFavorites } from '../../hooks/useFavorites';
import { LazyWordCard } from '../cards/LazyWordCard';

interface FavoritesPageProps {
  words: VocabularyWord[];
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ words }) => {
  const { favorites, clearFavorites } = useFavorites();

  const favoriteWords = words.filter(word => favorites.has(word.id));

  const handleWordClick = (word: VocabularyWord) => {
    // TODO: Navigate to word detail page or implement detailed view
    console.log('Word clicked:', word);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Favorite Words</h1>
        {favoriteWords.length > 0 && (
          <button
            onClick={clearFavorites}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear All Favorites
          </button>
        )}
      </div>

      {favoriteWords.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No favorite words yet. Start adding words to your favorites!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteWords.map((word, index) => (
            <LazyWordCard
              key={word.id}
              word={word}
              index={index}
              accentColor="red"
              onClick={() => handleWordClick(word)}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Total Favorite Words: {favorites.size}
        </p>
      </div>
    </div>
  );
};