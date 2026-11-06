# 0006 用 sctl mcp 给 agent 长期接管浏览器

- Status: accepted
- Date: 2026-11-07

## Context

仓库已经有一套隔离的浏览器环境：独立 profile、独立 sctl
daemon、sctl Browser 页面通道，入口是 `pnpm browser:*`。但它面向
「一次验证」：`browser:attach` 接上页面、跑一段 Playwright、截个
图就断开。agent 在对话里要反复看页面、点按钮、读 console 时，每次
都得临时写一个脚本，既慢又容易把上一次的状态丢掉。

agent 真正需要的是一个长期可用的 stdio 服务：列标签、读页面、拿
稳定的元素 ref、点击/填表、截图、看网络与控制台。sctl 0.2.0 自带
`sctl mcp`，正好提供这些工具，进程链是
`AI client → sctl mcp → sctl serve → sctl Browser`。

但把 `sctl mcp` 直接写进客户端配置有三个坑：

1. `sctl mcp` 不会自动起 daemon；`sctl serve` 没起时只报连接失败。
2. `SCTL_DATA_DIR` 必须和 `sctl serve` 完全一致，配错会报「控制
   通道鉴权失败」；很多客户端还会清掉/覆盖环境变量。
3. 仓库的命令都是 `tsx script/browser/cli.ts`，而 DSH 沙箱里
   tsx 会触发 esbuild 的 `spawn EPERM`。MCP 客户端不能依赖
   `pnpm browser:*` 来启动服务。

另外，DSH desktop 的 profile 由 Electron 管理，没有 MCP 设置页；
加 MCP 只能改 `cordis.patch.yml` 后完全重启。

## Decision

**不自研 MCP server，复用 `sctl mcp`；仓库只加一层零构建桥
`script/browser/mcp-bridge.mjs`。**

桥只做四件事：

- 按仓库规则解析 `.browser-harness`、`sctl-data`、sctl 可执行文件
  与监听地址，强制 `SCTL_DATA_DIR` 与 `sctl serve` 一致；
- 启动时用 `sctl status -o json` 的 `daemonVersion` 判断 daemon，
  不可达就 detached 拉起 `sctl serve`，写 `serve.pid` / `serve.log`；
- 用 `stdio: 'inherit'` 起 `sctl mcp --name <标签>`，转发
  SIGINT/SIGTERM，退出码透传，stdout 只留给 MCP 协议；
- 提供 `--print-config dsh|json` 与 `--check`，让配置生成和排障都
  不需要经过 tsx。

**入口命令收进根 `package.json`：**

```
pnpm browser:mcp            # node script/browser/mcp-bridge.mjs
pnpm browser:mcp:check      # 确保 daemon 可达并打印状态
pnpm browser:mcp:config     # 打印 DSH 的 cordis.patch.yml 片段
pnpm browser:mcp:config:json # 打印通用 mcpServers JSON
```

**DSH 用 stdio 接桥，不直接把 sctl 写进客户端配置。** profile 的
`cordis.patch.yml` 追加一条 `@deepseek-ai/dsh-mcp-client`：

```yaml
- insert:
    - id: mcp-sctl-browser
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: sctl
        transport: stdio
        command: 'C:\Program Files\nodejs\node.exe'
        args:
          - 'D:\...\script\browser\mcp-bridge.mjs'
        cwd: 'D:\...\WebScripts'
        toolCallTimeoutMs: 120000
        failOnStartupError: true
```

工具名由 DSH 生成为 `mcp__sctl__<tool>`。`--name` 只是审计标签，
不隔离会话；需要并行时各自 `tabs_open` 开标签。

**文档把 MCP 作为 agent 接管浏览器的首选方式，但保留
`browser:attach`。** Playwright 直连仍适合一次性脚本、CI 和调试
CDP 本身；MCP 适合对话里的反复操作。两条路径共用同一个 daemon 和
数据目录，不能同时占用 CDP endpoint。

## Consequences

- 首次配置要改 DSH profile 并**完全重启**，旧会话看不到新工具；
  这是 DSH 在会话启动时固定工具表的限制，不是桥的问题。
- 桥是纯 Node ESM，`.mjs` 不进 `tsc` 的编译范围，测试用
  `node:test`，根 `test` 末尾追加一条。
- 工具面由 sctl 决定，sctl 升级可能增删工具或改参数；桥不复制
  页面逻辑，只做启动与路径适配，升级时要复核 `sctl mcp` 文档。
- 页面工具会 attach debugger，浏览器顶部出现「正在调试此浏览
  器」提示条；标签空闲 5 分钟自动 detach，`debug_start` 可保持。
- CDP endpoint 与 page 工具互斥：有 Playwright/`--keep` 占着时页面
  工具返回 `ENDPOINT_CONNECTED`；反过来 `browser:doctor` 取端点也
  可能撞上 MCP 会话。
- 同一标签被多个 agent 操作会互相覆盖 ref；`page_snapshot` 的旧
  ref 会 `STALE_REF`，必须重新快照。
- 安全边界不变：配对码只在终端出现；桥不读取、不打印
  `control.token`、`pairing.key`、CDP URL；页面内容是
  `untrusted-page-content`；隔离 profile 只放测试账号。
- 沙箱里 `--check` / `browser:mcp` 仍可能 `spawn EPERM`，这是宿主
  限制；`--print-config` 不 spawn，可安全使用。

## Alternatives considered

- **自己写 MCP server（MCP SDK + playwright-core）**：工具可以定
  制，但要重做 ref 生命周期、dialog、iframe、超时、截图限额、审批
  语义，和 sctl 已有能力重复，还要维护两套页面模型。
- **直接把 `sctl mcp` 写进客户端配置**：少一个文件，但每个客户端
  都要手写 `SCTL_DATA_DIR` 和 daemon 前置；env 被清时静默失败；
  沙箱里也不能用 tsx 包一层。
- **继续每次写 Playwright 脚本**：一次性探查可以，长期对话里每次
  都要生成、调试、清理脚本，无法复用 snapshot/ref 与会话状态。
- **启用 browser-skill 插件**：它管的是 Agent Window，不是本仓
  `.browser-harness` 的隔离 Chrome；两套浏览器环境会分裂。