# 领域文档

工程类技能在探索本仓库代码前，应如何消费这里的领域文档。

## 探索之前先读这些

- 仓库根目录的 **`GLOSSARY.md`**
- **`docs/adr/`**：读与即将改动的区域相关的 ADR

本仓库是单 context 布局，不存在 `GLOSSARY-MAP.md`，也不需要逐个 context 去找。

workspace 级 / 跨项目的术语与决策仍放仓库根 `GLOSSARY.md` 与 `docs/adr/`。
单个脚本项目可以在项目内 `docs/adr/` 与 `docs/GLOSSARY.md` 记录只对该项目
成立的决策与术语（编号从 0001 起），并在项目 `CLAUDE.md` 或项目 `docs/` 里
说明入口。

如果这些文件不存在，**静默跳过**。不要点出它们缺失，也不要主动提议先创建。
`/domain-modeling` 技能（经由 `/grill-with-docs` 与
`/improve-codebase-architecture` 触达）会在术语或决策真正定下来时按需创建。

## 文件结构

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-<slug>.md
│   └── 0002-<slug>.md
└── src/
```

## 使用 glossary 的词汇

当你的产出要命名某个领域概念时（issue 标题、重构提案、假设、测试名），
使用 `GLOSSARY.md` 里定义的词。不要漂移到 glossary 明确回避的同义词。

需要的概念还不在 glossary 里，这本身是个信号：要么你在生造项目不用的词
（重新考虑），要么确实存在空缺（留给 `/domain-modeling` 记录）。

## 标出 ADR 冲突

如果你的产出与现有 ADR 相矛盾，明确说出来，而不是悄悄推翻：

> _与 ADR-0007（事件溯源的订单）冲突，但值得重开，因为……_
