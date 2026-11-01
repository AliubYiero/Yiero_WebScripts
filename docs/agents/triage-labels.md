# Triage 标签

技能内部用五个固定的 triage 角色说话。本文件把角色映射到本仓库实际使用的
标签字符串。

| mattpocock/skills 中的标签 | 本仓库使用的标签 | 含义                        |
| -------------------------- | ---------------- | --------------------------- |
| `needs-triage`             | `needs-triage`   | 维护者需要评估该 issue      |
| `needs-info`               | `needs-info`     | 等待报告者补充信息          |
| `ready-for-agent`          | `ready-for-agent`| 描述完整，可以交给 AFK agent|
| `ready-for-human`          | `ready-for-human`| 需要人类实现                |
| `wontfix`                  | `wontfix`        | 不予处理                    |

本仓库用本地 markdown 作为 issue tracker，没有 GitHub label。以上字符串写进
issue 文件靠上的 `Status:` 行即可。

当技能提到某个角色（例如「打上 AFK-ready 的 triage 标签」），使用上表对应的
字符串。

需要换词汇时，改「本仓库使用的标签」这一列即可。
