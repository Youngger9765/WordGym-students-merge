#!/usr/bin/env node
// identify-ambiguity.cjs - Detect vague requirements and missing details

const input = process.argv.slice(2).join(' ') || require('fs').readFileSync(0, 'utf-8');

function identifyAmbiguity(text) {
  const vagueKeywords = [];
  const missingDetails = [];

  // Vague reference keywords
  const vaguePatterns = [
    { pattern: /上一個版本|之前那樣|原本|以前/g, issue: '上一個版本' },
    { pattern: /改回來|恢復|復原/g, issue: '改回來' },
    { pattern: /一樣|相同|類似/g, issue: '寬度一樣' },
    { pattern: /改進|優化|調整/g, issue: '改進' },
    { pattern: /修復|修正|改好/g, issue: '修復' },
    { pattern: /不對|錯了|壞了/g, issue: '改壞了' }
  ];

  vaguePatterns.forEach(({ pattern, issue }) => {
    if (pattern.test(text) && !vagueKeywords.includes(issue)) {
      vagueKeywords.push(issue);
    }
  });

  // Missing specifics checks
  if (text.match(/寬度|width/) && !text.match(/\d+px|%/)) {
    missingDetails.push('Specific width value');
  }
  if (text.match(/位置|position/) && !text.match(/上|下|左|右|top|bottom/)) {
    missingDetails.push('UI position');
  }
  if (text.match(/格式|format/) && !text.match(/JSON|CSV|XML/)) {
    missingDetails.push('Data format');
  }

  // Ambiguity scoring
  let score = 'LOW';
  if (vagueKeywords.length >= 2 || missingDetails.length >= 2) {
    score = 'HIGH';
  } else if (vagueKeywords.length === 1 || missingDetails.length === 1) {
    score = 'MEDIUM';
  }

  return {
    ambiguityScore: score,
    vagueKeywords,
    missingDetails,
    recommendation: score === 'LOW' ? 'Proceed with implementation' : 'Clarify before implementation'
  };
}

const result = identifyAmbiguity(input.trim());
console.log(JSON.stringify(result, null, 2));
process.exit(0);
