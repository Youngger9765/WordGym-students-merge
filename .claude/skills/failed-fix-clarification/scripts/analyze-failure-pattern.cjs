#!/usr/bin/env node
// analyze-failure-pattern.cjs - Analyze what was tried and why it failed

const { execSync } = require('child_process');

const issueNum = process.argv[2];
if (!issueNum) {
  console.error('Usage: analyze-failure-pattern.cjs <issue-number>');
  process.exit(1);
}

try {
  // Get commits related to issue
  const commits = execSync(`git log --oneline --all --grep="#${issueNum}" | head -5`, { encoding: 'utf-8' });
  const commitLines = commits.trim().split('\n').filter(Boolean);

  // Get issue comments to extract client feedback
  const commentsJson = execSync(`gh issue view ${issueNum} --json comments`, { encoding: 'utf-8' });
  const { comments } = JSON.parse(commentsJson);

  const attempts = [];
  commitLines.forEach((line, idx) => {
    const hash = line.split(' ')[0];
    const message = line.substring(8);

    // Find corresponding feedback
    const feedback = comments[idx]?.body || 'Unknown feedback';

    attempts.push({
      attempt: idx + 1,
      commit: hash,
      approach: message,
      feedback: feedback.slice(0, 100)
    });
  });

  // Detect if fixing in multiple places (symptom vs root cause)
  const filesChanged = execSync(`git log --name-only --grep="#${issueNum}" | grep -E "\\.(tsx?|jsx?)$" | sort -u`, { encoding: 'utf-8' });
  const fileCount = filesChanged.trim().split('\n').filter(Boolean).length;

  const pattern = {
    attempts,
    filesChangedCount: fileCount,
    likelySymptomFix: fileCount >= 3,
    suggestion: fileCount >= 3 ? 'Fix at source, not in 3+ downstream locations' : 'Continue with current approach'
  };

  console.log(JSON.stringify(pattern, null, 2));
  process.exit(0);

} catch (error) {
  console.error({ error: error.message });
  process.exit(1);
}
