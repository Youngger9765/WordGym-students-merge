import { expectType } from 'tsd';
import { VocabularyWord, POSType, FilterOptions, StudySession } from '../vocabulary';

describe('Vocabulary Types', () => {
  it('should validate VocabularyWord type', () => {
    const word: VocabularyWord = {
      id: '1',
      english_word: 'test',
      chinese_translation: '测试',
      kk_phonetic: '/test/',
      level: 'beginner',
      posTags: ['noun'],
      themes: ['general'],
      example_sentence: 'This is a test.',
      example_translation: '这是一个测试。'
    };
    expectType<VocabularyWord>(word);
  });

  it('should validate POSType', () => {
    const pos: POSType = 'noun';
    expectType<POSType>(pos);
  });

  it('should validate FilterOptions', () => {
    const filter: FilterOptions = {
      searchTerm: 'test',
      posFilter: 'noun',
      levelFilter: 'beginner',
      themeFilter: 'general'
    };
    expectType<FilterOptions>(filter);
  });

  it('should validate StudySession', () => {
    const session: StudySession = {
      wordId: '1',
      timestamp: Date.now(),
      correct: true
    };
    expectType<StudySession>(session);
  });
});