#!/usr/bin/env node
// extract-requirements.cjs - Parse text into explicit/implicit requirements

const input = process.argv.slice(2).join(' ') || require('fs').readFileSync(0, 'utf-8');

function extractRequirements(text) {
  const explicit = [];
  const implicit = [];
  const assumptions = [];

  // Detect numbered lists (1. 2. 3. or 一、二、三)
  const numberedPattern = /(?:^|\n)\s*(?:\d+[\.\)、]|[一二三四五六七八九十]+[\.\)、])\s*(.+?)(?=\n|$)/g;
  let match;
  while ((match = numberedPattern.exec(text)) !== null) {
    explicit.push(match[1].trim());
  }

  // Detect bullet points (- or •)
  const bulletPattern = /(?:^|\n)\s*[-•]\s*(.+?)(?=\n|$)/g;
  while ((match = bulletPattern.exec(text)) !== null) {
    explicit.push(match[1].trim());
  }

  // Detect explicit requirement keywords
  const explicitKeywords = ['必須', '要', '需要', '應該', '请', '要求'];
  const sentences = text.split(/[。\n]/);
  sentences.forEach(s => {
    if (explicitKeywords.some(kw => s.includes(kw))) {
      const cleaned = s.trim().replace(/^[\-•\d+\.、\)]\s*/, '');
      if (cleaned && !explicit.includes(cleaned)) {
        explicit.push(cleaned);
      }
    }
  });

  // Detect implicit requirements (negations, comparisons)
  const implicitKeywords = ['不要', '不應', '避免', '不能'];
  sentences.forEach(s => {
    if (implicitKeywords.some(kw => s.includes(kw))) {
      implicit.push(s.trim());
    }
  });

  return { explicit, implicit, assumptions };
}

const result = extractRequirements(input.trim());
console.log(JSON.stringify(result, null, 2));
process.exit(0);
