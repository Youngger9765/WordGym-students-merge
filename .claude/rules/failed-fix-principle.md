# Failed Fix Principle - Stop and Ask for Clarification

## Rule: After 2 Failed Fix Attempts, STOP and ASK the Client

### Principle
When implementing a fix has failed twice with different approaches, STOP immediately and ask the client for clarification instead of attempting a third guess.

### Why This Matters
- **Prevents wasted effort**: Random attempts are unlikely to succeed
- **Shows professionalism**: Demonstrates thoughtful problem-solving vs. trial-and-error
- **Gets better results**: Client feedback clarifies ambiguous requirements
- **Saves time**: One clarification question beats three failed attempts

### The Process

#### Attempt 1 (Fails)
- Try the most logical fix based on current understanding
- If client says "不對", proceed to Attempt 2

#### Attempt 2 (Fails)
- Try a different approach based on the feedback
- If client says "你改壞了", proceed to clarification

#### Clarification (Before Attempt 3)
- Post a comment asking specific questions:
  1. What does the client's feedback mean specifically?
  2. What are the different options/versions?
  3. What is the expected behavior?
- Provide context: show the previous designs, explain what each one does
- Wait for client response before coding

#### Attempt 3+ (After Clarification)
- Only proceed if you have clear understanding of requirements
- Base the fix on client's explicit feedback, not guesses

### Real Example: Issue #19 (Flashcard Width)

**Commit 65f497b** (Original)
```css
.flashcard {
  perspective: 1000px;
  margin-bottom: 100px;
  /* No width constraints */
}
```

**Attempt 1: Commit 713a353** (Failed)
```css
.flashcard {
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
```
Client feedback: "卡片看起来太窄了"

**Attempt 2: Commit f0340e7** (Failed)
```css
.flashcard {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
```
Client feedback: "你改壞了，改回上一個版本"

**STOP HERE** ❌ DO NOT attempt Attempt 3

**Post Clarification Comment** ✅
Ask:
- "上一個版本" means which design?
- Should width be responsive or fixed?
- Is the issue about width, or content alignment?

**Wait for Response**, then proceed with correct fix

### Integration with git-issue-pr-flow

When using git-issue-pr-flow for issue management:

1. **PDCA Plan Phase**: Understand requirements clearly
2. **Do Phase**: Implement fix based on understanding
3. **Check Phase**: Get client feedback
4. **Act Phase - Attempt 1**: If failed, implement alternative
5. **Act Phase - Attempt 2**: If still failed, STOP and ask for clarification
6. **Clarification**: Post comment with specific questions
7. **Plan Phase (Renewed)**: Based on client response, plan correct fix

### Documentation Template

When posting clarification comments, use this structure:

```markdown
## 釐清設計要求

感謝您的反饋。在嘗試第三次修復前，我需要確認以下問題：

### 問題1：[具體問題描述]
[提供不同選項 A/B/C]

### 問題2：[預期行為]
[提供具體示例]

### 背景信息
- 已嘗試的方法：[列表]
- 相關提交：[commit 哈希]

請提供具體反饋，這樣能確保第三次修復正確。
```

### Red Flags for Needing Clarification

Stop and ask if:
- Client feedback is vague ("不對", "改壞了", "看起來怪怪的")
- You've tried 2+ different approaches
- You're not sure what the client actually wants
- There are multiple possible interpretations
- The issue affects more than one location

### Remember

> "A good question is worth 3 failed attempts."
> - Better to ask once than code blindly.

---

**Created**: 2025-12-26
**Related Issues**: #19 (Flashcard Width)
**Agent**: git-issue-pr-flow
