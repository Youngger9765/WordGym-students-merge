# failed-fix-clarification

**Purpose**: Stop AI from blind 3rd attempts, force clarification after 2 failed fixes

**Auto-triggers**: `client-feedback-2`, `第二次失敗`, `又失敗`, `你改壞了`

---

## Critical Rule

```
After 2 failed fixes:
1. STOP - Do NOT attempt 3rd fix
2. ASK - Post clarification to client
3. WAIT - For explicit response
4. THEN - Proceed with informed fix
```

---

## Execution Workflow

```
Detect 2nd Failure
    ↓
Check Failure Count → check-failure-count.cjs
    ↓
Analyze Pattern → analyze-failure-pattern.cjs
    ↓
Generate Questions → generate-clarification-request.cjs
    ↓
Post to GitHub Issue
    ↓
STOP and WAIT
```

---

## Scripts

### 1. Check Failure Count
```bash
./.claude/skills/failed-fix-clarification/scripts/check-failure-count.cjs 19
```

**Output**: Failure count, escalation level, should block

### 2. Analyze Failure Pattern
```bash
./.claude/skills/failed-fix-clarification/scripts/analyze-failure-pattern.cjs 19
```

**Output**: What was tried, why it failed, alternative approach

### 3. Generate Clarification Request
```bash
./.claude/skills/failed-fix-clarification/scripts/generate-clarification-request.cjs 19
```

**Output**: Formatted clarification comment for GitHub

---

## Example: Issue #19 (Flashcard Width)

**Failure Pattern**:
- Attempt 1: `max-width: 600px` → "句子斷行"
- Attempt 2: `max-width: 900px` → "你改壞了"

**Clarification Questions Generated**:
1. What does "上一個版本" mean? (3 options)
2. What is the expected card width behavior?
3. What specific problem are you experiencing?

**Outcome**: Client clarifies → 3rd attempt succeeds

---

## Integration

- Part of PDCA workflow (Check phase)
- Works with requirements-parser skill
- Prevents escalation to client-feedback-3+

---

**Version**: v2.0 (AMP-style)
**Last Updated**: 2025-12-31
