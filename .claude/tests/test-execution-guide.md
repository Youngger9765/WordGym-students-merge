# 测试执行指南

**目标**: 运行 AFTER 测试（启用 requirements-parser skill），验证改进效果

---

## ✅ 已完成的准备工作

1. ✅ **测试集已创建**: `test-requirements-parser.json`
   - 3 个 Negative cases (#4, #19, #9)
   - 3 个 Positive cases (#5, #6, #7)

2. ✅ **BEFORE 基线已记录**: `baseline-results-BEFORE.json`
   - Negative: 0/3 (0%)
   - Positive: 3/3 (100%)
   - 总成功率: 50%

3. ✅ **Skill 已创建**: `.claude/skills/requirements-parser.md`

4. ✅ **自动触发已配置**: `.claude/config/skill-rules.json`
   - 关键词: "issue", "客戶", "反饋", "fix", "client-feedback" 等
   - 优先级: Critical
   - 强制激活: true

---

## 🔬 AFTER 测试执行方法

### 方法 1: 人工模拟测试（推荐用于实验验证）

由于我们需要验证 requirements-parser 的效果，最可靠的方法是：

#### Step 1: 准备测试环境

```bash
# 1. 确认 requirements-parser.md 存在
ls -la .claude/skills/requirements-parser.md

# 2. 确认配置已更新
cat .claude/config/skill-rules.json | grep -A 10 "requirements-parser"

# 3. 打开测试集
cat .claude/tests/test-requirements-parser.json
```

#### Step 2: 逐个测试用例

对于每个测试用例，执行以下步骤：

**测试 NEG-001 (Issue #4)**:
```
1. 输入: 模拟收到客户反馈
   "單字卡順序仍有錯誤
    正確順序：
    1. 單字（音標、詞性、tag）
    2. 影片
    3. 詞性與關聯字..."

2. 期望行为: requirements-parser 自动触发

3. 验证输出:
   ✅ 提取到 4 个明确要求？
   ✅ 没有误判为模糊需求？
   ✅ 建议"可以直接实施"？

4. 评分: PASS/FAIL
```

**测试 NEG-002 (Issue #19)**:
```
1. 输入:
   "你改壞了，請回到上一個版本"

2. 期望行为: requirements-parser 识别模糊需求

3. 验证输出:
   ✅ 识别"上一個版本"是模糊需求？
   ✅ 提供澄清选项（A/B/C）？
   ✅ 建议"发布澄清评论，等待回复"？

4. 评分: PASS/FAIL
```

**测试 NEG-003 (Issue #9)**:
```
1. 输入:
   "看起來沒有改
    目前預設是全部單字，希望能改為：
    加上說明：請先到「單字卡」選擇題目範圍
    user在單字卡選擇範圍後，才能作答"

2. 期望行为: requirements-parser 提取所有要求

3. 验证输出:
   ✅ 提取到"預設0題"？
   ✅ 提取到"顯示說明"？
   ✅ 提取到"必須先選擇"逻辑？

4. 评分: PASS/FAIL
```

**测试 POS-001 (Issue #5)** - 回归检测:
```
1. 输入:
   "選擇題的選項必須要有四個"

2. 期望行为: requirements-parser 正确处理明确需求

3. 验证输出:
   ✅ 正确提取"4个选项"？
   ❌ 没有误判为模糊（"至少4个 vs 恰好4个"）？
   ✅ 建议直接实施（不要求澄清）？

4. 评分: PASS/FAIL
   ⚠️ 如果 FAIL = 回归 (T→F)
```

**测试 POS-002 (Issue #6)** - 回归检测:
```
1. 输入:
   "重點訓練裡的測驗，建議累積到五題以上才能測驗"

2. 期望行为: requirements-parser 正确理解数量指标

3. 验证输出:
   ✅ 正确理解"五題以上" = >=5？
   ❌ 没有误判为模糊（">5 vs >=5"）？
   ✅ 建议直接实施？

4. 评分: PASS/FAIL
   ⚠️ 如果 FAIL = 回归 (T→F)
```

**测试 POS-003 (Issue #7)** - 回归检测:
```
1. 输入:
   "歷史紀錄的時間錯誤"

2. 期望行为: requirements-parser 正确处理 Bug 描述

3. 验证输出:
   ✅ 正确提取"修复时间错误"？
   ❌ 没有要求澄清时间格式？
   ✅ 建议直接修复？

4. 评分: PASS/FAIL
   ⚠️ 如果 FAIL = 回归 (T→F)
```

#### Step 3: 记录结果

将每个测试的结果记录到 `baseline-results-AFTER.json`：

```json
{
  "case_id": "NEG-001",
  "status": "PASS/FAIL",
  "ai_actual_output": {
    "明确要求": [...],
    "模糊需求": [...],
    "建议行动": "..."
  },
  "scoring": {
    "明确要求提取": "4/4",
    "模糊需求识别": "0/0",
    "overall": "PASS"
  }
}
```

---

### 方法 2: 真实环境测试（长期验证）

在真实项目中应用 requirements-parser：

```bash
# 1. 等待新的 issue 或客户反馈

# 2. 当收到反馈时，hook 会自动触发 requirements-parser

# 3. 观察 AI 的行为：
   - 是否提取了明确要求？
   - 是否识别了模糊需求？
   - 是否要求澄清（当需要时）？

# 4. 记录结果并对比 BEFORE baseline
```

---

## 📊 结果计算

### TT TF FT FF 矩阵

```python
# 根据 BEFORE 和 AFTER 结果计算

for case in test_cases:
    before = baseline_BEFORE[case_id]
    after = baseline_AFTER[case_id]

    if before == "PASS" and after == "PASS":
        TT += 1  # ✅ 成功保持成功
    elif before == "PASS" and after == "FAIL":
        TF += 1  # ❌ 回归！成功变失败
    elif before == "FAIL" and after == "PASS":
        FT += 1  # ✅ 改进！失败变成功
    elif before == "FAIL" and after == "FAIL":
        FF += 1  # ⚠️ 仍然失败

# 计算指标
FT_rate = FT / (FT + FF)  # 目标: >=80%
TF_rate = TF / (TT + TF)  # 目标: <=10%
net_improvement = FT - TF  # 目标: >0
quality_score = (FT + TT - TF - FF) / 6  # 目标: >=0.7
```

### 评估标准

```yaml
PASS 标准:
  - FT率 >= 80% (至少 2/3 失败案例变成功)
  - TF率 <= 10% (最多 0-1 个成功案例回归)
  - 净改进 > 0 (FT > TF)
  - 质量分数 >= 0.7

理想目标:
  - FT率 = 100% (3/3)
  - TF率 = 0% (0/3)
  - 净改进 = +3
  - 质量分数 = 1.0
```

---

## 📝 测试记录模板

### AFTER 测试记录

```markdown
## AFTER 测试执行记录

**日期**: 2025-12-26
**测试者**: [Your Name]
**环境**: Claude Sonnet 4.5 + requirements-parser skill

### 测试结果

#### NEG-001 (Issue #4)
- Input: [客户反馈原文]
- AI Output:
  ```
  明确要求: [...]
  模糊需求: [...]
  建议行动: [...]
  ```
- 评分: PASS/FAIL
- 原因: [...]

#### NEG-002 (Issue #19)
- Input: [...]
- AI Output: [...]
- 评分: PASS/FAIL
- 原因: [...]

[... 其他测试用例 ...]

### TT TF FT FF 矩阵

|  | AFTER PASS | AFTER FAIL |
|---|---|---|
| **BEFORE PASS** | TT = X | TF = Y |
| **BEFORE FAIL** | FT = Z | FF = W |

### 指标计算

- FT率: Z / (Z + W) = ___%
- TF率: Y / (X + Y) = ___%
- 净改进: Z - Y = ___
- 质量分数: (Z + X - Y - W) / 6 = ___

### 通过/失败

- [ ] FT率 >= 80%
- [ ] TF率 <= 10%
- [ ] 净改进 > 0
- [ ] 质量分数 >= 0.7

**最终评估**: PASS / FAIL

### 改进建议

[如果有 TF（回归），分析原因并提出改进建议]
```

---

## 🎯 下一步行动

1. **立即执行**: 运行 6 个测试用例
2. **记录结果**: 填写 AFTER 测试记录
3. **计算指标**: TT TF FT FF 矩阵
4. **生成报告**: 对比 BEFORE vs AFTER
5. **更新实验日志**: 记录实验结果

---

**准备好开始 AFTER 测试了吗？**

我可以：
1. 逐个运行测试用例（我作为启用了 requirements-parser 的 AI）
2. 记录每个测试的输出
3. 生成完整的 AFTER 结果报告

**开始吗？** 🚀
