# Root Cause Analysis - 5 Whys Methodology

## Mandatory Before Implementation

When fixing bugs or implementing features, apply 5 Whys analysis BEFORE writing code.

### The 5 Whys Process

1. **State the problem**: Clearly describe what's wrong
2. **Ask "Why?" 5 times**: Drill down to root cause
3. **Identify true root cause**: Source vs symptom
4. **Verify solution scope**: Fixing in 3+ places = wrong approach
5. **Implement at source**: Fix root cause, not symptoms

### Example: Issue #15/16 (POS Annotations)

```
Problem: Quiz options show "(adj.)" and "[C]" annotations

Why? → MultipleChoiceQuiz displays raw english_word field
Why? → useDataset doesn't clean the field
Why? → vocabulary.json contains dirty data
Why? → csv_to_json.py doesn't strip annotations
Why? → No cleaning logic exists at source

Root Cause: CSV converter lacks data cleaning
Solution: Add clean_english_word() to csv_to_json.py ✅
```

### Red Flags - Wrong Approach Indicators

❌ **Fixing same issue in 3+ places**
- Symptom: Adding `.replace()` in Quiz, Detail, Card components
- Root cause: Source data is dirty

❌ **"代碼能跑就行" mentality**
- Symptom: Tests pass, ship it
- Root cause: No verification of actual user experience

❌ **Assuming code logic = actual behavior**
- Symptom: "Code looks right, should work"
- Root cause: Didn't verify via Chrome

### Correct Approach Pattern

✅ **Source-level fixes**
- Fix data at conversion (csv_to_json.py)
- Fix data at API response
- Fix data at database schema

✅ **Question "why am I fixing this here?"**
- If answer is "because other places also need it", you're fixing symptoms

✅ **Human validation for architecture**
- User spotted source data problem
- AI was fixing downstream symptoms
- Lesson: Seek human insight for systemic issues

## Integration with git-issue-pr-flow

Before creating PR:
1. Apply 5 Whys analysis
2. Document root cause in PR description
3. Verify fix is at correct layer (source vs downstream)
4. Include "Root Cause Analysis" section in PR
