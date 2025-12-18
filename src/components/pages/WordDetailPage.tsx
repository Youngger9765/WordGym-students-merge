import React from 'react';
import { VocabularyWord } from '../../types';
import { useSpeech } from '../../hooks/useSpeech';
import { useFavorites } from '../../hooks/useFavorites';
import SpeakerButton from '../ui/SpeakerButton';

interface WordDetailPageProps {
  word: VocabularyWord;
}

export const WordDetailPage: React.FC<WordDetailPageProps> = ({ word }) => {
  const { speak } = useSpeech();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const handleToggleFavorite = () => {
    isFavorite(word.id) ? removeFavorite(word.id) : addFavorite(word.id);
  };

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{word.english_word}</h1>
          <p className="text-gray-600">{word.kk_phonetic}</p>
        </div>
        <div className="flex space-x-2">
          <SpeakerButton onClick={() => speak(word.english_word)} />
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded ${
              isFavorite(word.id)
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isFavorite(word.id) ? '❤️ Remove' : '🤍 Add to Favorites'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Definition</h2>
          <p>{word.chinese_definition}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Part of Speech</h2>
          <p>{word.posTags?.[0] || 'Not specified'}</p>
        </div>
      </div>

      {word.example_sentence && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Example</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p className="italic">{word.example_sentence}</p>
            {word.example_translation && (
              <p className="text-gray-600 mt-2">
                {word.example_translation}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2">Related Words</h2>
        {/* TODO: Implement related words feature */}
        <p className="text-gray-500">No related words found</p>
      </div>
    </div>
  );
};