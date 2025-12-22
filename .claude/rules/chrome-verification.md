---
paths: "**/*.{ts,tsx,css,html}"
---

# Chrome Verification Workflow

## Mandatory Before/After Evidence

### When to Use Chrome Verification
- All UI-related issues (layout, display, styling)
- Quiz functionality changes
- Word detail pages modifications
- Navigation and routing changes
- Any visual/interactive features

### Verification Process
1. **BEFORE fix**: Take screenshot of current state
2. **Implement fix**: Make code changes
3. **Deploy**: Ensure changes are deployed to production
4. **AFTER fix**: Take screenshot of fixed state
5. **Compare**: Document differences with evidence
6. **Label**: Only add `chrome-verified` when actually verified via Chrome

### Chrome Verification Template
```markdown
## Chrome 驗證結果
在 Chrome 實際測試 [功能名稱]，[結果描述]：
- ✅ [驗證項目1]
- ✅ [驗證項目2]
- ✅ [驗證項目3]

### 驗證環境
- 生產站點: https://youngger9765.github.io/WordGym-students-merge/
- 測試路徑: [具體測試路徑]
```

### Critical Rules
- ❌ NEVER add `chrome-verified` label without actual Chrome testing
- ❌ NEVER assume code changes work without visual confirmation
- ✅ ALWAYS provide screenshot evidence in issue comments
- ✅ ALWAYS test on production URL, not localhost
