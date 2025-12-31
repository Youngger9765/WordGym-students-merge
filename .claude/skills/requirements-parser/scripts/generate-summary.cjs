#!/usr/bin/env node
// generate-summary.cjs - Combine extraction + ambiguity analysis

const { execSync } = require('child_process');
const fs = require('fs');

const input = process.argv.slice(2).join(' ') || fs.readFileSync(0, 'utf-8').trim();
const scriptDir = __dirname;

// Run extraction
const extraction = JSON.parse(
  execSync(`echo "${input}" | node ${scriptDir}/extract-requirements.cjs`, { encoding: 'utf-8' })
);

// Run ambiguity detection
const ambiguity = JSON.parse(
  execSync(`echo "${input}" | node ${scriptDir}/identify-ambiguity.cjs`, { encoding: 'utf-8' })
);

// Generate one-line summary
function generateOneLiner(text, explicit) {
  if (explicit.length === 0) {
    return text.slice(0, 50) + (text.length > 50 ? '...' : '');
  }
  const first = explicit[0];
  const more = explicit.length > 1 ? ` (+ ${explicit.length - 1} more)` : '';
  return first.slice(0, 40) + more;
}

const summary = {
  oneLiner: generateOneLiner(input, extraction.explicit),
  ambiguityScore: ambiguity.ambiguityScore,
  requirementsCount: extraction.explicit.length,
  action: ambiguity.recommendation,
  details: {
    explicit: extraction.explicit,
    vagueKeywords: ambiguity.vagueKeywords,
    missingDetails: ambiguity.missingDetails
  }
};

console.log(JSON.stringify(summary, null, 2));
process.exit(0);
