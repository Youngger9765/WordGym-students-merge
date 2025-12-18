import { expectType } from 'tsd';
import { FilterOptions, POSType } from '../vocabulary';

describe('Filter Types', () => {
  it('should validate FilterOptions', () => {
    const filter: FilterOptions = {
      searchTerm: 'test word',
      posFilter: 'noun',
      levelFilter: 'beginner',
      themeFilter: 'academic'
    };
    expectType<FilterOptions>(filter);

    const allPosFilter: FilterOptions = {
      searchTerm: '',
      posFilter: 'all',
      levelFilter: '',
      themeFilter: ''
    };
    expectType<FilterOptions>(allPosFilter);
  });

  it('should validate POSType', () => {
    const validPos: POSType[] = [
      'noun',
      'verb',
      'adjective',
      'adverb',
      'pronoun',
      'preposition',
      'conjunction',
      'other'
    ];

    validPos.forEach(pos => {
      expectType<POSType>(pos);
    });
  });
});