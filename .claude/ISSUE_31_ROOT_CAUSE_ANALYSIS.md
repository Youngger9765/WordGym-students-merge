# Issue #31 深度根因分析与修复方案

**分析日期**: 2025-12-31
**问题**: 国中、高中资料混在一起
**当前状态**: 声称已修复，但客户反馈仍有问题
**分析等级**: CRITICAL

---

## 问题陈述

### 客户反馈
> "与前次错误一样，国中、高中的资料混在一起"
> "当资料stage是高中时，就不可以出现国中的范围"

### 预期行为
```
用户选择 "国中" → 显示 国中 词汇
用户选择 "高中" → 显示 高中 词汇
不允许混合显示
```

---

## 5 Whys根因分析

### Why 1: 为什么国中、高中资料混在一起？

**症状**: 用户选择国中时，显示的词汇中包含高中词汇

**答案**: 原始过滤逻辑允许没有stage字段的词汇通过任何过滤

**代码证据** (提交8691673):
```typescript
filtered = filtered.filter(word => {
  const hasMatchingStage = word.stage === userSettings.stage;
  const hasNoStage = !word.stage;
  return hasMatchingStage || hasNoStage;  // ← BUG: || hasNoStage
});
```

### Why 2: 为什么允许没有stage的词通过？

**答案**: 可能是考虑到数据完整性 - 不想丢失数据

**但这导致**:
```
用户选择"国中" → 返回:
  - 国中词汇: ✓
  - 无stage词汇: ✓ (不应该！)

用户选择"高中" → 返回:
  - 高中词汇: ✓
  - 无stage词汇: ✓ (同样的词出现两次！)
```

### Why 3: 为什么有那么多没有stage的词汇？

**数据统计**:
```
总词汇数: 6513
├─ 国中 (stage="国中"): 2183 (34%)
├─ 高中 (stage="高中"): 1093 (17%)
└─ 空stage (stage=""): 3237 (49%) ← 这太多了！
```

**答案**:
1. 原始数据源不完整
2. 数据导入过程中丢失了分类信息
3. 或者这些词原本就没有分类

### Why 4: 这3237个词应该怎么处理？

**关键问题** - 这需要明确定义：

选项A: **它们应该属于某个级别**
```
例: 这3237个词原本应该是国中词，但导入时丢失了标记
处理方式: 手工修复vocabulary.json，为它们添加正确的stage
```

选项B: **它们应该对所有用户可见（无stage限制）**
```
例: 这些词是基础词汇，不分国中/高中
处理方式: 修改过滤逻辑，无stage的词对所有level都显示
```

选项C: **它们应该被排除**
```
例: 这些词是重复、错误或不相关的数据
处理方式: 从vocabulary.json中删除它们
```

### Why 5: 提交ab8e161做了什么？

**提交内容**:
```typescript
// 提交 ab8e161 的修改
filtered = filtered.filter(word => {
  if (!word.stage) return false;  // ← 排除无stage词
  const normalizedWordStage = VersionService.normalizeStage(word.stage);
  return normalizedWordStage === normalizedUserStage;
});
```

**选择了选项C**: **排除无stage的词**

**结果**:
- ✅ 国中、高中不再混合
- ❌ **丢失了3237个词汇（49%的数据！）**
- ❌ 用户看不到这些词

**但没有验证**:
- 这3237个词是否真的应该被排除
- 用户体验是否变差
- 是否有数据完整性问题

---

## 问题的真正根源

### Root Cause 1: 数据源本身不完整

**证据**:
```
查看vocabulary.json:
- 66513个词中，有49%没有stage信息
- 这不是一个小错误，这是系统性问题
```

**应该问的问题**:
- 这3237个词来自何处？
- 原始CSV中是否有stage信息？
- 是在转换时丢失的吗？

### Root Cause 2: 在应用层而非源头修复

**错误的修复层级**:
```
数据源:        ← 应该在这里修复！
  └─ vocabulary.json: 3237个词缺少stage

应用层:
  └─ filterUtils.ts: 排除无stage词 ← 不应该在这里修复！
```

**为什么错误**:
- 应用层修复是应急方案，不是真正解决问题
- 导致数据丢失
- 后续如果改变过滤逻辑，问题仍然存在
- 其他使用这些词的地方（搜索、统计等）仍会有问题

### Root Cause 3: 缺少验证和测试

**验证缺失**:
- ❌ 没有测试来验证过滤逻辑
- ❌ 没有数据验证来检查数据质量
- ❌ 没有Chrome验证来确认用户体验

**如果有测试**:
```typescript
test('filterUtils stage separation', () => {
  const data = [
    { word: 'apple', stage: '国中' },
    { word: 'book', stage: '高中' },
    { word: 'cat', stage: '' }  // 无stage词
  ];

  const result = getFilteredWords(
    data,
    { stage: 'junior', version: '康轩' },
    'textbook',
    {},
    'all'
  );

  // 测试会发现：无stage词被意外排除
  expect(result.length).toBe(1); // 只有apple

  // 如果3237个词都这样排除，测试会显示:
  // 期望: 3200个国中词 + 2500个基础词 = 5700个
  // 实际: 2183个国中词 (遗漏了基础词)
});
```

---

## 证实修复失败的线索

### 线索1: 客户反馈一致

客户说: "与前次错误一样，国中、高中的资料混在一起"

这意味着:
- 修复前: 混合显示
- 修复后: **仍然混合显示** (修复无效)

### 线索2: 没有数据变化验证

如果真的修复成功，应该有:
```
修复前: 用户看到 X个词 (国中+高中+无stage混合)
修复后: 用户看到 Y个词

Y应该明显小于X (因为排除了无stage词)
```

但提交中没有:
- ❌ 词数对比
- ❌ 数据变化分析
- ❌ 用户影响评估

### 线索3: 代码"看起来"对但实际无效

即使代码逻辑看起来正确:
```typescript
const normalizedUserStage = VersionService.normalizeStage(userSettings.stage);
return normalizedWordStage === normalizedUserStage;
```

也可能因为:
- 🤔 userSettings.stage的值有问题？
- 🤔 normalizeStage的映射有问题？
- 🤔 vocabulary.json中的stage值有问题？
- 🤔 过滤逻辑的其他部分有问题？

**未经验证，无法确定。**

---

## 实际问题的三个可能情景

### 情景1: 修复没有部署到生产环境

**可能性**: Medium

**如何确认**:
```bash
# 访问生产环境
https://youngger9765.github.io/WordGym-students-merge/

# 检查是否是最新代码
# 方式1: 打开浏览器DevTools → Network → 选中JS文件
#        检查Last-Modified时间是否是最近的

# 方式2: 在Console中执行
location.pathname  # 检查当前URL
```

### 情景2: 过滤逻辑之外还有其他地方混合数据

**可能性**: High

**可能的地方**:
1. 组件初始化时的数据混合
2. useDataset hook中的处理
3. 其他地方调用的过滤函数有不同的逻辑
4. 缓存问题导致旧数据显示

**如何排查**:
```bash
# 在生产环境Console中检查
window.app?.state?.filteredWords  # 看实际显示的词

# 在VS Code中全局搜索
grep -r "stage.*filter\|filter.*stage" src/
```

### 情景3: normalizeStage映射有问题

**可能性**: Medium

**查看VersionService**:
```typescript
private static stageMapping: Record<string, string> = {
  '高中': 'high',
  '国中': 'junior',
  '国小': 'beginner',
  'senior': 'high',
  'junior': 'junior',
  'beginner': 'beginner'
};
```

**问题可能**:
- 数据中的stage值 vs userSettings.stage值不匹配？
- 例如: 数据中是"高中"，但userSettings是"senior"？

**检查**:
```typescript
// 在filterUtils.ts中添加临时日志
console.log('User stage:', userSettings.stage, '→', VersionService.normalizeStage(userSettings.stage));
console.log('Word samples:', filtered.slice(0, 3).map(w => ({
  word: w.english_word,
  stage: w.stage,
  normalized: VersionService.normalizeStage(w.stage)
})));
```

---

## 正确的修复方案

### 方案A: 修复源数据（推荐）

**步骤1: 分析这3237个无stage词的来源**
```bash
# 在词汇JSON中找出所有stage为空的词
cat src/data/vocabulary.json | jq '.[] | select(.stage == "") | {english_word, textbook_index, exam_tags, theme_index}' | head -50
```

**步骤2: 根据其他字段推断应该的stage**
```
如果一个词有textbook_index:
  - 如果在康轩翰林南一: stage应该是"国中"
  - 如果在龙腾三民: stage应该是"高中"

如果一个词有exam_tags:
  - 如果有"会考": stage应该是"国中"
  - 如果有"学测": stage应该是"高中"
```

**步骤3: 修复vocabulary.json**
```python
# 在数据导入脚本中添加
def assign_stage(word):
    if word.get('stage'):
        return word['stage']

    # 根据textbook推断
    if word.get('textbook_index'):
        for item in word['textbook_index']:
            if item['version'] in ['康轩', '翰林', '南一']:
                return '国中'
            elif item['version'] in ['龙腾', '三民']:
                return '高中'

    # 根据exam推断
    if word.get('exam_tags'):
        for tag in word['exam_tags']:
            if '会考' in tag:
                return '国中'
            elif '学测' in tag:
                return '高中'

    # 默认值
    return '国中'  # 或其他合理的默认值
```

**步骤4: 验证修复**
```bash
# 修复后检查分布
cat src/data/vocabulary.json | jq 'group_by(.stage) | map({stage: .[0].stage, count: length})'

# 应该看到:
# [
#   { "stage": "国中", "count": ~4500 },
#   { "stage": "高中", "count": ~1500 },
#   { "stage": "", "count": 0 }
# ]
```

**优点**:
- ✅ 根本解决问题
- ✅ 不丢失数据
- ✅ 其他功能也能受益
- ✅ 数据质量提高

**缺点**:
- 需要修改源数据
- 需要验证推断的正确性

### 方案B: 如果3237个词确实不应该存在

**步骤1: 确认这些词应该删除**
```bash
cat src/data/vocabulary.json | jq '.[] | select(.stage == "") | {english_word, textbook_index, exam_tags}' | head -20
```

**步骤2: 从vocabulary.json中删除它们**
```bash
cat src/data/vocabulary.json | jq 'map(select(.stage != ""))' > src/data/vocabulary.json.cleaned
mv src/data/vocabulary.json.cleaned src/data/vocabulary.json
```

**步骤3: 验证**
```bash
npm run build
npm run preview
# 检查是否有功能损坏
```

**缺点**:
- ✅ 简单快速
- ❌ 丢失49%的数据
- ❌ 用户可能看不到某些词

### 方案C: 允许无stage词对所有用户可见

**修改filterUtils.ts**:
```typescript
// 如果stage为空，认为是"基础词汇"，对所有用户可见
const matchStage = word.stage === '' ||
                   normalizedWordStage === normalizedUserStage;
```

**优点**:
- ✅ 保留所有数据
- ✅ 不需要修改源数据

**缺点**:
- ❌ 无stage词对所有用户都显示（可能不是设计意图）
- ❌ 不解决数据质量问题

---

## 诊断步骤（立即执行）

### Step 1: 确认问题仍然存在

```bash
# 访问生产环境
open https://youngger9765.github.io/WordGym-students-merge/

# 在浏览器Console中执行以下代码:
// 如果是React应用，找到状态存储
console.log('Current words:', window.app?.words?.length);

// 选择"国中"后
console.log('After selecting 国中:');
console.log('Word count:', filteredWords?.length);
console.log('Stages:', new Set(filteredWords?.map(w => w.stage)));

// 选择"高中"后
console.log('After selecting 高中:');
console.log('Word count:', filteredWords?.length);
console.log('Stages:', new Set(filteredWords?.map(w => w.stage)));
```

### Step 2: 检查修改是否部署

```bash
# 在项目根目录执行
git log --oneline -1  # 查看本地最新提交

# 比较GitHub上的main分支
# https://github.com/youngger9765/WordGym-students-merge/commits/main

# 确认ab8e161已被合并到main
```

### Step 3: 验证filterUtils逻辑

```bash
# 添加临时日志到filterUtils.ts
console.log('Stage filter input:');
console.log('- User stage:', userSettings.stage);
console.log('- Normalized:', VersionService.normalizeStage(userSettings.stage));
console.log('- Data before filter:', data.length);
console.log('- Data after filter:', filtered.length);

# 重新构建
npm run build

# 在生产环境测试
# 查看浏览器console输出
```

### Step 4: 检查数据一致性

```bash
# 在src/data/vocabulary.json中查看
cat src/data/vocabulary.json | jq 'group_by(.stage) | map({stage: .[0].stage, count: length})'

# 确认数据分布
# 应该显示有多少国中/高中/空stage词
```

---

## 建议的修复计划

### 立即（今天）

1. **确认问题**
   - 访问生产环境验证
   - 运行诊断Step 1-4
   - 确认修复是否部署

2. **临时解决方案**
   - 如果是方案C可行，快速修复
   - 恢复`|| hasNoStage`逻辑
   - 重新部署

### 短期（本周）

1. **分析3237个词的来源**
   - 是否应该有stage？
   - 应该分配什么stage？

2. **编写测试**
   - `src/utils/__tests__/filterUtils.test.ts`
   - 测试stage分离逻辑
   - 测试数据边界情况

3. **实施永久修复**
   - 执行方案A（修复源数据）
   - 或方案B（删除无效数据）
   - 或方案C（允许无stage词）

### 中期（下一次迭代）

1. **数据质量检查**
   - 审查所有词的数据完整性
   - 建立数据验证规则
   - 防止未来出现类似问题

2. **测试覆盖**
   - 为所有过滤函数添加测试
   - 测试数据边界情况
   - 建立CI/CD测试

---

## 防止类似问题再发生

### 1. 添加数据验证

```typescript
// 在程序启动时验证数据质量
function validateVocabularyData(data: VocabularyWord[]): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const stageStats = groupBy(data, w => w.stage || 'empty');

  // 警告: 超过20%的数据没有stage
  if (stageStats['empty']?.length > data.length * 0.2) {
    warnings.push(
      `${stageStats['empty'].length} words (${
        (stageStats['empty'].length / data.length * 100).toFixed(1)
      }%) have no stage - possible data quality issue`
    );
  }

  return { errors, warnings };
}
```

### 2. 编写数据测试

```typescript
test('vocabulary data quality', () => {
  const { errors, warnings } = validateVocabularyData(vocabularyData);

  expect(errors).toHaveLength(0);  // 严格错误必须为0

  // 可以有警告，但应该被注意
  if (warnings.length > 0) {
    console.warn('Data quality warnings:', warnings);
  }
});
```

### 3. 强制Chrome验证

对于这类问题的修复，一定要：
- [ ] 修复前截屏：显示国中/高中混合
- [ ] 修复后截屏：显示数据分离结果
- [ ] 对比：从不同角度验证修复有效

### 4. 定期审计过滤逻辑

```bash
# 定期检查是否有"许可所有"的逻辑
grep -r "||" src/utils/filterUtils.ts
grep -r "hasNo\|allows.*all" src/

# 这类逻辑容易导致数据混合
```

---

## 结论

**Issue #31的真正问题**:
1. ❌ 源数据中有49%的词缺少stage分类
2. ❌ 修复时选择了排除这些词，而非补充stage信息
3. ❌ 没有验证修复的实际效果
4. ❌ 没有测试覆盖来防止回归

**修复应该**:
1. 根本上完善vocabulary.json的数据
2. 添加测试防止相同问题再发生
3. 强制生产环境Chrome验证
4. 建立数据质量检查

**责任在于**:
- 不是filterUtils逻辑本身
- 而是工作流程：缺少验证、缺少测试、缺少数据质量检查

---

*分析完成 | 立即行动: 执行诊断步骤，确认问题*
