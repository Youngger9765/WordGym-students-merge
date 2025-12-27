# Failed Fix Clarification Skill

## Purpose
Proactively stop AI from making blind third attempts and force client clarification after 2 failed fixes.

## Auto-Activation

Triggers on:
- ✅ "client-feedback-2" (label detection)
- ✅ "第二次失敗", "second failure", "又失敗"
- ✅ "你改壞了", "改錯了", "還是不對"
- ✅ Manual: `/clarify-fix <issue-number>`

---

## 🛑 CRITICAL RULE

**After 2 failed fix attempts, you MUST:**
1. **STOP** - Do NOT attempt a 3rd fix
2. **ASK** - Post clarification comment to client
3. **WAIT** - For explicit client response
4. **ONLY THEN** - Proceed with 3rd attempt

---

## Quick Workflow Checklist

**When this skill activates, execute this process:**

```
Failed Fix Clarification Process:
- [ ] Step 1: Identify the 2 failed attempts (commits/approaches)
- [ ] Step 2: Analyze what each attempt tried to fix
- [ ] Step 3: Draft 3 specific clarification questions
- [ ] Step 4: Post clarification comment to GitHub Issue
- [ ] Step 5: Add client-feedback-2 label (if not already added)
- [ ] Step 6: STOP and WAIT for client response
```

---

## Step 1: Identify Failed Attempts

### Check Git History
```bash
# Find commits related to the issue
git log --oneline --all --grep="#<NUM>"

# Or check specific file history
git log --oneline --all -- path/to/file.tsx
```

### Document the Attempts
For each failed attempt, record:
- Commit hash
- What approach was used (e.g., "max-width: 600px")
- Why it failed (client feedback quote)

**Example (Issue #19)**:
```
Attempt 1 (713a353):
- Approach: max-width: 600px + min-width: 320px
- Failed because: "句子斷行" (sentences breaking)

Attempt 2 (f0340e7):
- Approach: max-width: 900px (removed min-width)
- Failed because: "你改壞了，正反面的寬度還是不一樣"
```

---

## Step 2: Analyze What Was Tried

### Root Cause Analysis
For each attempt, understand:
1. What problem was it trying to solve?
2. What CSS/code changes were made?
3. Why did the client reject it?

### Identify Ambiguities
Look for vague client feedback:
- "不對" (not right) - What specifically is wrong?
- "改壞了" (you broke it) - Broke what exactly?
- "上一個版本" (previous version) - Which version?

---

## Step 3: Draft Clarification Questions

### Question Template

**MUST ask 3 types of questions:**

#### Question 1: Terminology Clarification
**Purpose**: Understand vague terms used by client

Example:
```markdown
### 問題1：「上一個版本」的具體含義
目前有三個版本的設計：
- **原始設計 (65f497b)**: [describe what it does]
- **第一次嘗試 (713a353)**: [describe what it does]
- **第二次嘗試 (f0340e7)**: [describe what it does]

您說的「上一個版本」是指哪一個？
```

#### Question 2: Expected Behavior
**Purpose**: Get concrete specification of what the client wants

Example:
```markdown
### 問題2：卡片寬度行為
卡片應該如何表現？
- A. 響應式寬度（隨屏幕寬度自動調整）
- B. 固定寬度（例如 600px 或 900px）
- C. 其他方式（請說明）
```

#### Question 3: Specific Problem
**Purpose**: Understand the exact issue the client is experiencing

Example:
```markdown
### 問題3：具體問題點
目前的問題是否與以下有關？
- 正面和反面卡片寬度不一致
- 卡片在某些屏幕尺寸上看起來不對稱
- 卡片內容超出邊界
- 其他（請說明）
```

---

## Step 4: Post Clarification Comment

### Comment Template

Use this exact structure:

```markdown
## 客戶反饋：需要釐清設計要求

感謝您的反饋：「[quote client's feedback]」。我已經嘗試了兩次修復，但都沒有滿足需求。

在提出第三次修復前，我需要釐清幾個問題以確保準確理解您的要求：

### 問題1：[Terminology Clarification]
[Question with options A/B/C]

### 問題2：[Expected Behavior]
[Question with concrete examples]

### 問題3：[Specific Problem]
[Question about the exact issue]

### 背景信息

**已嘗試的修復方法**：
1. **第一次嘗試** (Commit: [hash])
   - 方法：[describe approach]
   - 結果：[client feedback quote]

2. **第二次嘗試** (Commit: [hash])
   - 方法：[describe approach]
   - 結果：[client feedback quote]

請提供具體的反饋，這樣我能確保第三次修復方向正確。感謝！

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Post to GitHub

```bash
# Post the clarification comment
gh issue comment <NUM> --body "$(cat <<'EOF'
[Your clarification comment content]
EOF
)"
```

---

## Step 5: Add Label

```bash
# If not already added
gh issue edit <NUM> --add-label "client-feedback-2"

# Verify
gh issue view <NUM> --json labels --jq '.labels[].name'
```

**Purpose of label**:
- 🔴 Signals 2nd failed attempt
- 🛑 Triggers this skill auto-activation
- 📊 Tracks issue complexity

---

## Step 6: STOP and WAIT

### What NOT to Do

❌ **DO NOT**:
- Make a 3rd code change attempt
- Guess what the client meant
- Try a "slight variation" of previous attempts
- Assume you understand the requirements
- Use phrases like "let me try one more thing"

### What to Do

✅ **DO**:
- Post the clarification comment
- Add the label
- Tell the user: "Waiting for client clarification on Issue #X before proceeding"
- Work on OTHER issues if available
- Resume ONLY after client provides clear response

### Example Response

```
✅ Posted clarification comment to Issue #19
🔴 Added client-feedback-2 label
⏸️ WAITING for client response before attempting 3rd fix

I will NOT proceed with implementation until client clarifies:
1. What "上一個版本" means
2. Expected card width behavior
3. Specific problem being experienced
```

---

## Success Criteria

This skill is successful when:
- ✅ Client responds with clear, specific requirements
- ✅ You understand exactly what needs to be fixed
- ✅ 3rd attempt succeeds because it's based on clear requirements
- ✅ No 4th attempt needed

---

## Integration with git-issue-pr-flow

When this skill activates during PDCA workflow:

**PDCA Plan Phase**:
- Instead of planning a 3rd fix, plan clarification questions
- Document the 2 failed attempts
- Identify ambiguities

**PDCA Do Phase**:
- Execute = Post clarification comment
- NOT = Write code

**PDCA Check Phase**:
- Wait for client response
- Verify understanding

**PDCA Act Phase**:
- ONLY after clarification, proceed with properly planned fix

---

## Real-World Example: Issue #19

### Context
- **Issue**: Flashcard front/back width inconsistency
- **Attempt 1**: Set `max-width: 600px` → Client: "句子斷行"
- **Attempt 2**: Set `max-width: 900px` → Client: "你改壞了"

### Skill Activation
Detected `client-feedback-2` trigger → Skill activated

### Actions Taken
1. ✅ Analyzed 2 commits (713a353, f0340e7)
2. ✅ Identified ambiguities ("上一個版本", "正反面寬度")
3. ✅ Drafted 3 clarification questions
4. ✅ Posted comment to Issue #19
5. ✅ Added `client-feedback-2` label
6. ✅ STOPPED - No 3rd attempt

### Outcome
⏸️ Waiting for client to clarify which version to restore

---

## Why This Skill Matters

**Without this skill**:
- AI makes 3rd blind guess → fails again → client frustrated
- Wastes time on random attempts
- Damages client trust in AI capabilities

**With this skill**:
- AI shows professional problem-solving
- Gets clear requirements before proceeding
- 3rd attempt has high success rate
- Client appreciates being consulted

---

## Related Skills

- **debugging**: 5-step systematic debugging workflow
- **requirements-clarification**: CARIO framework for requirement gathering
- **prd-workflow**: PRD-driven development

---

## Version History

**v1.0** (2025-12-26):
- Initial creation
- Triggered by Issue #19 (flashcard width)
- Integrated with git-issue-pr-flow agent
- Auto-activation keywords configured

---

**Skill Version**: v1.0
**Last Updated**: 2025-12-26
**Project**: WordGym-students-merge
**Related Issues**: #19
