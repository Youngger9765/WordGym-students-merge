import { VocabularyWord } from '../types';

export const generateDisractors = (
  correctWord: VocabularyWord,
  allWords: VocabularyWord[],
  numOptions: number = 3
): string[] => {
  // Filter words with the same part of speech
  const samePosWords = allWords
    .filter(word =>
      word.pos === correctWord.pos &&
      word.id !== correctWord.id
    )
    .sort(() => 0.5 - Math.random());

  // If not enough words with same POS, use any words
  const fallbackWords = allWords
    .filter(word => word.id !== correctWord.id)
    .sort(() => 0.5 - Math.random());

  const candidates = samePosWords.length >= numOptions
    ? samePosWords
    : [...samePosWords, ...fallbackWords];

  // Generate distractors, preferring similar words
  const distractors = candidates
    .slice(0, numOptions)
    .map(word => word.chinese_definition);

  // Shuffle options and ensure no duplicates
  return [...new Set(distractors)];
};

export const generateSentenceCloze = (word: VocabularyWord): string => {
  // Prefer example sentences from the first language example
  const examples = word.languageExamples || [];

  if (examples.length === 0) {
    return `在哪裡放置 ${word.english} ?`;
  }

  const example = examples[0];
  const clozeExample = example.replace(
    new RegExp(word.english, 'gi'),
    '_____'
  );

  return clozeExample;
};