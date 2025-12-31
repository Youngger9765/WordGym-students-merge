# Data Diagnosis Skill

## Purpose
在修改資料過濾邏輯前，強制檢查資料完整性，避免「代碼正確但丟失資料」的問題。

## Auto-Activation

觸發條件：
- 修改 `filterUtils.ts`
- 修改 `useDataset` hook
- 案主反饋「資料混在一起」、「資料不見了」
- Issue 包含「篩選」、「分類」、「stage」關鍵字

---

## Workflow

### Step 1: 資料統計

使用 jq 分析 src/data/vocabulary.json：

```bash
# 總數
cat src/data/vocabulary.json | jq 'length'

# Stage 分佈
cat src/data/vocabulary.json | jq '[.[] | .stage] | group_by(.) | map({stage: (if .[0] == "" or .[0] == null then "(empty)" else .[0] end), count: length}) | sort_by(.count) | reverse'

# 缺失值比例
cat src/data/vocabulary.json | jq '[.[] | select(.stage == "" or .stage == null)] | length' | awk -v total=$(cat src/data/vocabulary.json | jq 'length') '{printf "%.1f%%", ($1/total)*100}'
```

### Step 2: 缺失值檢查

如果發現 **>10% 的資料缺失關鍵欄位**：

**❌ 不要直接排除資料**

**✅ 必須詢問案主**：

```markdown
## 資料完整性問題

發現 vocabulary.json 中有 {COUNT} 個詞彙（{PERCENTAGE}%）缺少 {FIELD} 欄位。

### 處理選項

**選項 A**: 補充缺失的欄位資訊（推薦）
- 分析詞彙來源，補充正確的 {FIELD}
- 保留所有資料

**選項 B**: 設為預設值
- 將缺失值設為 {DEFAULT_VALUE}
- 保留所有資料

**選項 C**: 排除缺失資料
- 過濾時排除這些詞彙
- ⚠️ 將丟失 {COUNT} 個詞彙

請問您希望採用哪個選項？
```

**等待案主回覆後才繼續實施**

### Step 3: 實施修復

根據案主決定：
- 選項 A → 分析並補充資料
- 選項 B → 設定預設值
- 選項 C → 實施過濾邏輯

### Step 4: 驗證修復

修復後再次統計：
```bash
# 確認資料完整性
cat src/data/vocabulary.json | jq '[.[] | select(.stage == "" or .stage == null)] | length'
# 應該是 0（選項A）或維持原樣（選項B/C）
```

---

## Success Criteria

- ✅ 修復前有完整的資料統計
- ✅ 缺失值 >10% 時有詢問案主
- ✅ 根據案主決策實施
- ✅ 修復後有驗證統計

---

**Version**: v1.0
**Created**: 2025-12-31
**Related**: Issue #31 (49% 資料缺 stage)
