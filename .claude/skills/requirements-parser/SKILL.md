# requirements-parser

**Purpose**: Parse client requirements, identify ambiguities, prevent AI misinterpretation

**Auto-triggers**: `issue`, `客戶`, `反饋`, `需求`, `要求`, `修復`, `bug`

---

## Execution Workflow

```
Client Feedback
    ↓
Extract Explicit Requirements → extract-requirements.cjs
    ↓
Identify Ambiguities → identify-ambiguity.cjs
    ↓
Generate Summary → generate-summary.cjs
    ↓
IF ambiguous → Ask clarification
IF clear → Proceed with implementation
```

---

## Core Process

### 1. Extract Requirements
```bash
echo "客戶要加篩選功能" | ./.claude/skills/requirements-parser/scripts/extract-requirements.cjs
```

**Output**: JSON with explicit/implicit requirements and assumptions

### 2. Identify Ambiguity
```bash
echo "客戶要加篩選功能" | ./.claude/skills/requirements-parser/scripts/identify-ambiguity.cjs
```

**Output**: Ambiguity score (HIGH/MEDIUM/LOW) with specific issues

### 3. Generate Summary
```bash
echo "客戶要加篩選功能" | ./.claude/skills/requirements-parser/scripts/generate-summary.cjs
```

**Output**: One-line summary + recommended action

---

## Decision Logic

```
IF ambiguityScore = HIGH or MEDIUM THEN
  - Stop implementation
  - Ask clarification questions
  - Wait for client response

IF ambiguityScore = LOW THEN
  - Proceed with implementation
  - Use extracted requirements as checklist
```

---

## Example: Clear Requirements (Issue #4)

**Input**: "單字卡順序：1.單字 2.影片 3.詞性與關聯字 4.匯出內容"

**Output**:
```json
{
  "ambiguityScore": "LOW",
  "explicit": [
    "单字区块在最上方",
    "影片区块在单字下方",
    "词性与关联字在影片下方",
    "汇出内容在最下方"
  ],
  "recommendation": "Proceed with implementation"
}
```

## Example: Ambiguous Requirements (Issue #19)

**Input**: "請回到上一個版本，正反面寬度一樣"

**Output**:
```json
{
  "ambiguityScore": "HIGH",
  "vagueKeywords": ["上一個版本", "寬度一樣"],
  "missingDetails": ["Which version?", "Specific width value?"],
  "recommendation": "Clarify before implementation"
}
```

---

## Integration

- Part of git-issue-pr-flow (Plan phase)
- Works with failed-fix-clarification skill
- Feeds into debugging workflow

---

**Version**: v2.0 (AMP-style)
**Last Updated**: 2025-12-31
