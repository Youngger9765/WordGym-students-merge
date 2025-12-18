import { expectType } from 'tsd';
import { useFavorites } from '../../hooks/useFavorites'; // Adjust import path

describe('Hooks Types', () => {
  it('should validate useFavorites hook return', () => {
    const {
      favorites,
      addFavorite,
      removeFavorite,
      clearFavorites,
      isFavorite
    } = useFavorites();

    expectType<Set<string>>(favorites);
    expectType<(wordId: string) => void>(addFavorite);
    expectType<(wordId: string) => void>(removeFavorite);
    expectType<() => void>(clearFavorites);
    expectType<(wordId: string) => boolean>(isFavorite);
  });
});