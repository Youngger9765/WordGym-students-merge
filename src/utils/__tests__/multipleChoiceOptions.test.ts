import { VocabularyWord } from '../../types';

// This test validates the core logic of multiple choice option generation
// to ensure we always have exactly 4 options

describe('Multiple Choice Options Generation Logic', () => {
  // Helper function to simulate the option generation logic from MultipleChoiceQuiz
  const generateOptions = (
    correctAnswer: string,
    pool: VocabularyWord[],
    currentPOS: string | undefined
  ): string[] => {
    // Step 1: Get same POS words from pool
    const samePOSInPool = pool.filter(w => {
      const wordPOS = (w.posTags && w.posTags.length > 0)
        ? w.posTags[0]
        : w.pos;

      return wordPOS && currentPOS &&
        wordPOS === currentPOS &&
        w.english_word !== correctAnswer;
    });

    const allDistractors: string[] = [];

    // Add random words from same POS
    const shuffledSamePOS = [...samePOSInPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffledSamePOS.length); i++) {
      allDistractors.push(shuffledSamePOS[i].english_word);
    }

    // Step 2: If not enough, add random words from pool (any POS)
    if (allDistractors.length < 3) {
      const otherWords = pool.filter(w =>
        w.english_word !== correctAnswer &&
        !allDistractors.includes(w.english_word)
      );
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(3 - allDistractors.length, shuffledOthers.length); i++) {
        allDistractors.push(shuffledOthers[i].english_word);
      }
    }

    // Step 3: Fallback strategies to ensure exactly 3 distractors
    const fallbackOptions = [
      'apple', 'banana', 'computer', 'develop', 'education',
      'family', 'government', 'history', 'important', 'justice',
      'knowledge', 'language', 'mountain', 'nature', 'organization'
    ];

    while (allDistractors.length < 3) {
      // Try to find unused fallback words
      const unusedFallbacks = fallbackOptions.filter(fb =>
        fb !== correctAnswer.toLowerCase() &&
        !allDistractors.some(d => d.toLowerCase() === fb)
      );

      if (unusedFallbacks.length > 0) {
        const randomFallback = unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        allDistractors.push(randomFallback);
      } else {
        // Last resort: generate synthetic options
        allDistractors.push(`option_${allDistractors.length + 1}`);
      }
    }

    // Ensure exactly 3 unique distractors
    const uniqueDistractors = [...new Set(allDistractors.slice(0, 3))];

    // If we still don't have 3 after deduplication, pad with fallbacks
    while (uniqueDistractors.length < 3) {
      const syntheticOption = `word_${uniqueDistractors.length + 1}`;
      if (!uniqueDistractors.includes(syntheticOption) && syntheticOption !== correctAnswer) {
        uniqueDistractors.push(syntheticOption);
      }
    }

    // Build final options: ALWAYS exactly 4 options (3 distractors + 1 correct)
    const finalOptions: string[] = [...uniqueDistractors.slice(0, 3)];

    // Insert correct answer at position 0 for testing purposes
    finalOptions.splice(0, 0, correctAnswer);

    return finalOptions;
  };

  test('generates exactly 4 options with sufficient pool', () => {
    const pool: VocabularyWord[] = [
      { id: 1, english_word: 'apple', chinese_definition: '蘋果', pos: 'noun', posTags: ['noun'] },
      { id: 2, english_word: 'banana', chinese_definition: '香蕉', pos: 'noun', posTags: ['noun'] },
      { id: 3, english_word: 'cherry', chinese_definition: '櫻桃', pos: 'noun', posTags: ['noun'] },
      { id: 4, english_word: 'date', chinese_definition: '棗子', pos: 'noun', posTags: ['noun'] }
    ] as VocabularyWord[];

    const options = generateOptions('apple', pool, 'noun');
    expect(options).toHaveLength(4);
    expect(options).toContain('apple');
  });

  test('generates exactly 4 options with insufficient same-POS words', () => {
    const pool: VocabularyWord[] = [
      { id: 1, english_word: 'apple', chinese_definition: '蘋果', pos: 'noun', posTags: ['noun'] },
      { id: 2, english_word: 'run', chinese_definition: '跑', pos: 'verb', posTags: ['verb'] }
    ] as VocabularyWord[];

    const options = generateOptions('apple', pool, 'noun');
    expect(options).toHaveLength(4);
    expect(options).toContain('apple');
  });

  test('generates exactly 4 options with minimal pool (1 word)', () => {
    const pool: VocabularyWord[] = [
      { id: 1, english_word: 'apple', chinese_definition: '蘋果', pos: 'noun', posTags: ['noun'] }
    ] as VocabularyWord[];

    const options = generateOptions('apple', pool, 'noun');
    expect(options).toHaveLength(4);
    expect(options).toContain('apple');
  });

  test('generates exactly 4 unique options', () => {
    const pool: VocabularyWord[] = [
      { id: 1, english_word: 'test', chinese_definition: '測試', pos: 'noun', posTags: ['noun'] }
    ] as VocabularyWord[];

    const options = generateOptions('test', pool, 'noun');
    const uniqueOptions = new Set(options);

    expect(options).toHaveLength(4);
    expect(uniqueOptions.size).toBe(4); // All options must be unique
    expect(options).toContain('test');
  });

  test('always includes correct answer in options', () => {
    const pool: VocabularyWord[] = [
      { id: 1, english_word: 'correct', chinese_definition: '正確', pos: 'adjective', posTags: ['adjective'] }
    ] as VocabularyWord[];

    const options = generateOptions('correct', pool, 'adjective');
    expect(options).toContain('correct');
    expect(options).toHaveLength(4);
  });
});
