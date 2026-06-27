# PDF 制作规格书

> 卡片创作实验室 · 2026-06-27  
> 适用卡包：人生发展卡包 / AI创业决策卡包

---

## 1. 产品概述

基于「日课一问」题库，生成 A6 标准卡片 PDF 和 A4 打印 PDF。支持封面、目录、卡片正文三页头结构，满足在线阅读和实体打印两种场景。

### 输出物

| 产物 | 用途 | 生成脚本 |
|------|------|---------|
| A6 完整版 HTML + PDF | 在线阅读 / 单张打印 | `scripts/generate-pdf-html.py` |
| A4 打印版 HTML + PDF | 批量打印 8 张/页 | `scripts/generate-a4-print.py` |
| AI创业决策卡包 HTML + PDF | 主题卡包 | `scripts/generate-ai-startup-pdf.py` |

---

## 2. 视觉设计规范

### 2.1 主色调

| 变量 | 色值 | 用途 |
|------|------|------|
| `--brand` | `#3C9D4E` | 豆瓣绿——标题、装饰线、链接 |
| `--brand-dark` | `#2E7D38` | 领域标签 |
| `--ink` | `#1a1a1a` | 主标题文字 |
| `--ink-soft` | `#5c5852` | 延伸反思文字 |
| `--ink-faint` | `#b0aba5` | 编号、出处、辅助文字 |
| `--paper` | `#ffffff` | 卡片背景（纯白） |
| `--brand-soft` | `rgba(60,157,78,.10)` | 领域标签底色 |

### 2.2 卡片规格

| 属性 | A6 完整版 | A4 打印版 |
|------|----------|----------|
| 页面尺寸 | 105 × 148 mm (A6) | 297 × 210 mm (A4 横版) |
| 卡片背景 | 纯白 `#fff` | 暖白 `#faf8f5` |
| 外框 | 1.5px 豆瓣绿细线 | 无 |
| 顶部装饰 | 豆瓣绿渐变线 | 无 |
| 内边距 | 10mm-9mm | 2.5mm-2mm |

### 2.3 文字排版

| 元素 | A6 完整版 | A4 打印版 |
|------|----------|----------|
| 问题层 | 17pt Bold | 7.5pt Bold |
| 分割线 | 14mm 豆瓣绿 | 7mm 豆瓣绿 |
| 延伸层 | 10pt Light × 1.8 | 5.5pt Light × 1.5 |
| 品牌名 | 7pt | 5pt |
| 卡片编号 | 6.5pt | 4.5pt |
| 领域标签 | 6.5pt | 4.5pt |
| 底部出处 | 5.5pt | 无 |

### 2.4 目录页排版

| 元素 | 字号 |
|------|------|
| 标题 | 11pt Bold, 居中 |
| 简介 | 9pt Light × 1.9 行距 |
| 编排逻辑 | 8pt × 1.8 行距 |
| 分类表头 | 7pt Medium |
| 分类表格 | 7.5pt × 2.4 行距, 分类名加粗 |
| 比例条 | 3.5px 高, 圆角, 豆瓣绿 20% 透明 |
| 总数 | 7.5pt, 数字加粗绿色 |

### 2.5 封面

- **白底** + 豆瓣绿细框 + 顶部装饰线
- 标题：30pt Bold 豆瓣绿, 宽字距
- 副标题：9pt Light, 宽字距
- 领域列表：7pt, 两行排列
- 出品信息：6pt, 底部居中

---

## 3. 卡包编排规则

### 3.1 三页头结构

```
第 1 页  封面    卡包名 + 副标题 + 总数量 + 领域 + 出品信息
第 2 页  目录    简介（2-3 句） + 编排逻辑 + 分类统计表 + 总数
第 3 页~ 卡片    从 001 开始，每页一张
```

### 3.2 目录页内容规范

- **简介**：量身定制，说明主题、目标读者、核心用途
- **编排逻辑**：分类方式、递进关系、使用方法
- **分类统计**：动态读取数据，附可视化比例条
- **分类不固定**：按卡包实际内容和性质设计

### 3.3 数据源

- 输入：`questions.json`（JSON 数组，每条含 id / question / extension / domain）
- 过滤：排除 `_instructions` 项
- 分类：自动从 `domain` 字段提取，按字母排序
- 支持自定义分类（如 AI创业卡包按 ID 范围划分四阶段）

---

## 4. 内容质量标准

### 4.1 问题层（question）

| 标准 | 要求 |
|------|------|
| 字数 | 28-47 字，平均 35 字 |
| 句式 | 开放疑问句，禁止二选一 |
| 标点 | 以 `？` 结尾，禁用 `——` 破折号 |
| 独立性 | 不引用任何来源 |

### 4.2 扩展层（extension）

| 标准 | 要求 |
|------|------|
| 字数 | 60-120 字，平均 ~100 字 |
| 结构 | 3 个延伸小问，连续不分行 |
| 角度 | 个人经验 / 理论原则 / 批判反思 |
| 标点 | 禁用 `——` 破折号 |
| 说明 | 术语需自然嵌入解释 |

### 4.3 禁用项

- ❌ 选择题句式（「是A还是B」）
- ❌ 破折号 `——`
- ❌ 来源引用（「文章说」「书中提到」）
- ❌ 未解释的专业术语
- ❌ 学术腔（「从第一性原理看」「基于XX框架」）

---

## 5. 生成流程

### 5.1 A6 完整版

```bash
python scripts/generate-pdf-html.py
# 输出: downloads/日课一问_完整版.html (420 张卡片 + 封面 + 目录)
# 然后手动打印为 PDF，或:
chrome --headless --print-to-pdf=output.pdf --no-pdf-header-footer index.html
```

### 5.2 A4 打印版

```bash
python scripts/generate-a4-print.py
# 输出: downloads/日课一问_A4打印版.html + .pdf
# 每页 4 列 × 2 行 = 8 张卡片, A7 比例 (74×105mm)
```

### 5.3 AI创业决策卡包

```bash
python scripts/generate-ai-startup-pdf.py
# 输入: downloads/questions-AI-Native-Startup.json
# 输出: downloads/AI-Native-Startup.html + .pdf
# 100 张卡片, 四阶段分类
```

### 5.4 PDF 生成依赖

- Chrome/Chromium 浏览器（用于 headless `--print-to-pdf`）
- Python 3.x + 标准库（json, collections）

---

## 6. 脚本清单

| 脚本 | 用途 |
|------|------|
| `scripts/generate-pdf-html.py` | A6 完整版 HTML 生成 |
| `scripts/generate-a4-print.py` | A4 打印版 HTML + PDF |
| `scripts/generate-ai-startup-pdf.py` | AI创业决策卡包 HTML + PDF |
| `scripts/audit-questions.py` | 好问题标准审计 |
| `scripts/fix-jargon.py` | 术语解释嵌入 |
| `scripts/fix-length.py` | 问题/扩展字数修整 |
| `scripts/fix-extension-structure.py` | 扩展层 3 小问结构修剪 |
| `scripts/fix-extension-length.py` | 扩展层字数控制 |
| `scripts/fix-question-length.py` | 主问题 ≥28 字扩展 |
| `scripts/fix-choice-questions.py` | 选择题句式消除 |
| `scripts/fix-remove-dashes.py` | 破折号移除 |
| `scripts/fix-ai-startup-extensions.py` | AI卡包扩展层修剪 |

---

## 7. 版本历史

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-06-25 | v2.5 | 420 题好问题标准审计, 术语解释嵌入 |
| 2026-06-25 | v2.6 | 字数 100% 命中标准 (Q≥28, E≤120) |
| 2026-06-25 | v2.7 | 卡包视觉升级: 纯白底+绿细框+白底封面 |
| 2026-06-25 | v2.8 | 目录页新增: 简介+分类统计+比例条 |
| 2026-06-26 | v2.9 | 好问题 skill 修订: 禁用选择题+破折号 |
| 2026-06-26 | v2.10 | 420 题 419 破折号移除, 重命名「人生发展卡包」 |
| 2026-06-26 | v2.11 | AI创业卡包 140 破折号移除, 12 张去重替换 |
