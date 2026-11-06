# 浏览器验证：独立配置 + sctl 接入

给 script/ 下的工具脚本准备一套「可以随便折腾」的浏览器环境：
独立的浏览器 profile、独立的 sctl 数据目录、Playwright 通过 CDP
接进去做页面验证。日常用浏览器（Profile 2/3/4…）完全不受影响。

代码在 `script/browser/`，命令统一挂在根 package.json 的
`browser:*` 下。

## 它做什么 / 不做什么

做：

- 用独立 `--user-data-dir` 起一个浏览器实例，退出后可随时删掉
- 起一个只有这套环境在用的 sctl daemon（数据目录也独立）
- 引导你完成脚本猫与 sctl Browser 的一次性配对
- 用 Playwright `connectOverCDP` 接管页面，截图、读标题、跑断言
- `browser:doctor` 逐项体检，缺什么就告诉你怎么补

不做：

- 不自动下载 sctl（本机访问不了 GitHub Releases，见下）
- 不自动安装扩展（Chrome 137 起不再支持 `--load-extension`，
  扩展必须手动装一次）
- 不跑「逐个脚本的 e2e」（那是后续的事，这里只提供接入能力）
- 不动 `dev:sync` 推送流程

## 目录

默认根目录是仓库下的 `.browser-harness/`（已 gitignore）：

```
.browser-harness/
  profile/            浏览器 --user-data-dir，删掉等于重置环境
  sctl-data/          sctl 的 SCTL_DATA_DIR（pairing.key 等）
  tools/sctl/         可选的 sctl 可执行文件放置处
  artifacts/          attach --screenshot 的产物
  state.json          实例记录（pid / 端口 / profile 路径，无密钥）
  serve.log           daemon 输出
  serve.pid
  SETUP.md            browser:setup 生成的本地清单
```

想换位置就设 `WEBSCRIPTS_BROWSER_HOME`（相对路径按当前工作目录算）。

## 一次性准备

按 `pnpm browser:doctor` 的红项逐条补，顺序建议如下。

1. **浏览器**：Chrome 125+ 或 Edge（`WEBSCRIPTS_BROWSER_CHANNEL=msedge`
   切到 Edge，也可直接填绝对路径）。
2. **playwright-core**：`pnpm install`。仓库锁文件里已有
   `playwright-core@1.64.1`，只是本机曾经装不上；`doctor` 的第 02
   项会告诉你它到底能不能 `import`。
3. **脚本猫 ≥ 1.5**：在独立浏览器里打开 `chrome://extensions`，
   开发者模式 → 从商店安装。商店打不开时用 Edge 加载项市场，或者
   从 GitHub Releases 下 `.crx`/解压目录手动加载。
   低于 1.5 没有「外部接入」，`doctor` 第 06 项会报版本。
4. **sctl Browser 扩展**：同一个 `chrome://extensions`，商店 id
   `biafbcaobbmcodfinffakgpdgaiodbgk`；Edge 加载项 id
   `nbmnkdfbjdhbdjjffgkocfdkemockepa`；手动装则是解压
   `sctl-browser-extension-<版本>.zip` 后「加载已解压的扩展程序」。
5. **sctl 本体**：这是唯一的硬前置件，必须手动拿到
   （GitHub 在本机解析到 127.0.0.1，命令行拉不下来）：

   - 找一台能上网的机器，从 GitHub Releases 下载 `sctl` 的
     Windows 版本，拷到本机；
   - 放进 `.browser-harness/tools/sctl/sctl.exe`，
     或者设 `WEBSCRIPTS_SCTL=<绝对路径>`，或者放进 PATH；
   - 注意 sctl 不分发「多文件安装包」，就是一个可执行文件。

6. **确认**：`pnpm browser:doctor`（`--json` 给机器读），
   全绿就可以往下走了。

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm browser:setup` | 建目录、写 `SETUP.md`、顺手体检 |
| `pnpm browser:launch [--url <地址>] [--debug-port <端口>]` | 起独立浏览器实例 |
| `pnpm browser:stop` | 关掉实例并清理残留锁 |
| `pnpm browser:serve [--status\|--stop]` | 起 / 查 / 停隔离 daemon |
| `pnpm browser:pair` | 生成一次性配对码（码只在终端出现） |
| `pnpm browser:status [--json]` | 实例、扩展、daemon、两条通道的接入状态 |
| `pnpm browser:attach [--url <地址>] [--screenshot] [--pages]` | Playwright 接管页面 |
| `pnpm browser:doctor [--json]` | 12 项体检 |

`--debug-port <端口>` 会额外加 `--remote-debugging-port`，方便直接
用浏览器自带的 devtools 协议调试；平时不需要。

所有命令都接受 `--browser <实例名>`（等价于环境变量
`WEBSCRIPTS_BROWSER_NAME`，sctl 那边变成 `SCTL_BROWSER`），
一个 daemon 上挂了多个 sctl Browser 实例时用它指定目标，例如：

```
pnpm browser:status --browser chrome-7288
```

## 配对（两条通道，分开看）

脚本猫和 sctl Browser 是两个独立扩展，各自要配一次，状态也分两份：

- `sctl status` 里的 `extension connected`（JSON 是 `extConnected`）
  指**脚本猫**——「脚本管理通道」，只有想让 sctl 直接读源码、装脚本、
  改脚本时才需要它；
- `sctl browsers` 里的实例（如 `chrome-7288: online`）指
  **sctl Browser**——「页面通道」，Playwright 接管页面走的就是它。

所以「脚本猫没接入」不影响 `pnpm browser:attach`。`browser:doctor`
也按这个区分：页面通道可用时，脚本猫那条只算提醒（不算失败）。

配对码是即用即弃的：**每跑一次 `browser:pair` 都会生成一个新码，
旧码立刻作废**。`sctl connect` 打印完码就返回，配对是异步完成的，
所以在扩展里填完要再跑一次 `pnpm browser:status` 才算确认。

```
pnpm browser:serve     # 起隔离 daemon（pair 也会自己起，可以省）
pnpm browser:pair      # 把码填进脚本猫：设置 → 工具 → 外部接入
pnpm browser:pair      # 再跑一次，把新码填进 sctl Browser 的弹窗
pnpm browser:status    # 两条通道分别显示「已接入」「在线」
```

`browser:pair` 会先打印两条通道的当前状态，并告诉你这次的新码该给
哪个扩展（只差一条时它会直接点名）；两条都接好时它会说不用再配。

`browser:pair` 会先确认 daemon 在跑，没跑就自动起一个隔离的
（数据目录同上），不会去碰你日常那个 sctl。

注意：daemon 没起时 `sctl status` 退出码仍是 0，只是
`daemonVersion` 为空、输出「daemon is not running」。别拿退出码
判断 daemon 是否可用，本工具读的是 `-o json` 里的 `daemonVersion`。

配对码是 8 位、2 分钟过期、只能用一次，**只在终端里出现**：
它不进 `state.json`、不进 `serve.log`，也不要粘到对话、issue 或
MCP 配置里。`sctl status` 之后应能看到两个扩展都「已连接」。

权限策略在脚本猫的「外部接入」页里改：默认是「需人工审批」，
读源码、装脚本、改脚本、启停删除都会在浏览器里弹确认页
（拒绝 / 本会话允许 / 允许，5 分钟不选就过期）。想省事可以改成
「直接允许」，但那就是让任何本机程序都能动你的脚本，风险自负。
每次操作都会进脚本猫的审计日志。

## 用 Playwright 接进去

底层就是 sctl 的 CDP 端点：`sctl cdp endpoint` 打印一个
`http://127.0.0.1:8643/cdp/<secret>`，拿它去 `connectOverCDP`。
端点地址本身就是凭据，同一时间只允许一个客户端，无客户端 60 分钟
失效，`sctl cdp close` 可以手动关。

最省事的用法：

```
pnpm browser:attach --url https://example.com --screenshot
```

它会：取端点 → `chromium.connectOverCDP` → `contexts()[0]`
→ 新开标签并 `goto` → 打印 URL 与标题 → 需要时截图到
`artifacts/attach-<时间戳>.png` → `browser.close()`（只是断开，
浏览器和标签都留着）→ `sctl cdp close`。
不带 `--url` 时不会新开标签页：直接操作最近打开的那个页面，
截图和「当前页面」日志都指向它；带 `--url` 时才新建标签并导航。
`--keep` 表示断开后不关端点（自己接着调试用）。

在脚本里接的时候，模块在 `script/browser/playwright.ts`：

```ts
import { attach, describeContext } from './playwright.ts';

const { browser, context } = await attach(cdpUrl);
const page = await context.newPage();
await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
});
console.log(await page.title(), describeContext(context));
await browser.close(); // 只断连
```

注意几点：

- `script/` 的 tsconfig 没有 DOM lib，`page.evaluate` 里别写依赖
  `document` 类型的回调，必要时传字符串。
- 页面顶部出现「正在调试此浏览器」的提示条是正常的：
  起浏览器时带了 `--silent-debugger-extension-api`，
  但 debugger 一挂上去提示条还是会有。
- 标签页空闲 5 分钟会自动断开，`sctl page detach` 可手动断。

## 让别的 AI 客户端用 sctl

`pnpm browser:serve` 起的 daemon 和命令行共用一套数据目录，
所以 MCP 客户端也能连。配置里只写命令，**不要写配对码**：

```json
{
  "mcpServers": {
    "sctl": {
      "command": "C:\\path\\to\\sctl.exe",
      "args": ["mcp", "--name", "browser-harness"],
      "env": {
        "SCTL_DATA_DIR": "D:\\Code\\.project\\73_web_script\\WebScripts\\.browser-harness\\sctl-data"
      }
    }
  }
}
```

`SCTL_DATA_DIR` 必须和 `browser:serve` 用的一致，否则会报
「控制通道鉴权失败」。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `WEBSCRIPTS_BROWSER_HOME` | `<repo>/.browser-harness` | 整套环境的根目录 |
| `WEBSCRIPTS_BROWSER_CHANNEL` | `chrome` | `chrome` / `msedge` / 绝对路径 |
| `WEBSCRIPTS_BROWSER_NAME` | 空 | 多实例时给这个浏览器起的名字（传给 `--browser`） |
| `WEBSCRIPTS_SCTL` | 空 | sctl 可执行文件绝对路径 |
| `WEBSCRIPTS_SCTL_LISTEN` | `ws://127.0.0.1:8643` | 隔离 daemon 的监听地址 |

## 排障

| 现象 | 处理 |
| --- | --- |
| `doctor` 09 项 daemon 不可达 | 先 `pnpm browser:serve`；看 `serve.log` 末尾几行 |
| 报「控制通道鉴权失败」 | `SCTL_DATA_DIR` 不一致：确认命令、MCP、serve 用的是同一个 `sctl-data/` |
| 8643 被占用 | 日常用的 sctl 在跑。要么先停掉它，要么改 `WEBSCRIPTS_SCTL_LISTEN`，并且把两个扩展里的「外部接入地址」改成同一个 |
| 启动浏览器后立刻退出 | 常见是被沙箱/杀软拦（浏览器要起子进程、开命名管道）、profile 被占、参数被策略拒；在普通终端里直接跑一次能看到浏览器自己的报错 |
| `pid` 已死但 profile 里还有锁 | 崩溃残留，`pnpm browser:stop` 会清理；确认没有浏览器在用这个目录再动手 |
| CDP 端点取不到 | 已经被别的客户端占着，先 `sctl cdp close` |
| `attach` 报缺 playwright-core | `pnpm install` |
| 脚本猫版本 < 1.5 | 更新扩展；外部接入是 1.5 才有的 |

## 清理与撤销

- 重置浏览器环境：`pnpm browser:stop` 后删掉 `.browser-harness/`
  （profile 里的登录态、扩展、缓存一起没）。
- 撤销接入：脚本猫「外部接入」页里解除配对，或删掉
  `.browser-harness/sctl-data/`（等于让所有配对失效）。
- 删历史、Cookie、浏览数据这类破坏性操作在 sctl 里必须显式加
  `--yes`；删书签、卸载扩展会走浏览器自己的确认弹窗。

## 本机已知限制（写文档时实测）

- GitHub 与 Chrome 网店在本机不可达（DNS 解析到 127.0.0.1），
  所以 sctl 下载和商店装扩展都得手动来。
- 在受限沙箱里跑 `pnpm browser:launch` 会失败：Chrome 起子进程/
  开命名管道被拦，日志是 `crashpad ... OpenProcess: 0x5` 和
  `mojo platform_channel Check failed`。普通终端里没这个问题。
- 同理，`pnpm test` 在受限沙箱里会 `spawn EPERM`，
  需要在普通终端运行。
