import { extractAvailableVersions } from '../versionExtraction';
import { VocabularyWord } from '../../types';

describe('extractAvailableVersions', () => {
  const mockData: VocabularyWord[] = [
    { id: 1, textbook_index: [{ version: '高中 龍騰', vol: '1', lesson: '1' }], stage: 'high', english_word: 'test1', chinese_definition: '測試1', english: 'test1' },
    { id: 2, textbook_index: [{ version: '高中 三民', vol: '1', lesson: '1' }], stage: 'high', english_word: 'test2', chinese_definition: '測試2', english: 'test2' },
    { id: 3, textbook_index: [{ version: '國中 康軒', vol: '1', lesson: '1' }], stage: 'junior', english_word: 'test3', chinese_definition: '測試3', english: 'test3' },
    { id: 4, textbook_index: [{ version: '國中 翰林', vol: '1', lesson: '1' }], stage: 'junior', english_word: 'test4', chinese_definition: '測試4', english: 'test4' },
    { id: 5, textbook_index: [{ version: '國中 康軒', vol: '1', lesson: '1' }], stage: 'junior', english_word: 'test5', chinese_definition: '測試5', english: 'test5' }
  ];

  it('should extract unique versions for each stage', () => {
    const result = extractAvailableVersions(mockData);

    expect(result.high).toEqual(['龍騰', '三民']);
    expect(result.junior).toEqual(['康軒', '翰林']);
    expect(result.beginner).toEqual([]);
  });

  it('should return an empty array for an empty dataset', () => {
    const result = extractAvailableVersions([]);

    expect(result.high).toEqual([]);
    expect(result.junior).toEqual([]);
    expect(result.beginner).toEqual([]);
  });
});