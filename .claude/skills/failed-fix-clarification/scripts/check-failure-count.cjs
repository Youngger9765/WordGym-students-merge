#!/usr/bin/env node
// check-failure-count.cjs - Count failure attempts via GitHub labels

const { execSync } = require('child_process');

const issueNum = process.argv[2];
if (!issueNum) {
  console.error('Usage: check-failure-count.cjs <issue-number>');
  process.exit(1);
}

try {
  // Get issue labels
  const labelsJson = execSync(`gh issue view ${issueNum} --json labels`, { encoding: 'utf-8' });
  const { labels } = JSON.parse(labelsJson);

  // Count client-feedback labels
  let failureCount = 0;
  labels.forEach(label => {
    if (label.name === 'client-feedback-1') failureCount = Math.max(failureCount, 1);
    if (label.name === 'client-feedback-2') failureCount = Math.max(failureCount, 2);
    if (label.name === 'client-feedback-3+') failureCount = 3;
  });

  // Determine escalation level
  let escalationLevel = 'NORMAL';
  let action = 'Continue with fix';
  let shouldBlock = false;

  if (failureCount >= 2) {
    escalationLevel = 'CRITICAL';
    action = 'STOP - Ask for clarification';
    shouldBlock = true;
  } else if (failureCount === 1) {
    escalationLevel = 'WARNING';
    action = 'Be careful with next attempt';
  }

  const result = { failureCount, escalationLevel, action, shouldBlock };
  console.log(JSON.stringify(result, null, 2));
  process.exit(shouldBlock ? 1 : 0);

} catch (error) {
  console.error({ error: error.message, failureCount: 0, shouldBlock: false });
  process.exit(0);
}
