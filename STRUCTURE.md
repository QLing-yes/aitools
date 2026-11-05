# 目录结构索引

> 本文件是全项目「目录 → 文件 → 职责」索引。**任何文件增删、移动、目录职责变化必须同一提交内更新本文件**（规则锚点在根 AGENTS.md）。
> 定位：索引，不是规范——规则看各模块 AGENTS.md，踩坑看 EXPERIENCES.md。条目一行一条，写职责不写实现。

## 总览

```
bun_gui_template/
├── scripts/          # 根编排脚本（dev/build/tauri 配置注入）
├── src-bun/          # Bun + Elysia 后端（sidecar 与服务器部署两形态）
├── src-web/          # React + Vite 前端（web 与桌面 WebView 共用）
├── src-tauri/        # Tauri v2 桌面壳（Rust）
├── .agents/skills/   # Agent 技能（shadcn 等，CLI 维护）
├── .vscode/          # 编辑器配置（类常量命名提示等）
├── .env              # 环境变量单一来源（新增/修改后必须重启根 dev）
├── AGENTS.md         # 全局规则 + 分发/平台基线
├── EXPERIENCES.md    # 跨模块经验沉淀
└── STRUCTURE.md      # 本文件
```

三模块互不牵扯，各自内部管理；跨模块契约见文末速查表。

## scripts/

- `dev.ts` — 并行拉起各模块 dev 进程；启动时固定 process.env 传子进程
- `build.ts` — 生产构建编排
- `config.ts` — 向 tauri.conf.json 注入 devUrl / externalBin（NODE_ENV=production 才注 sidecar）
- `spawn.ts` — 子进程启动公共封装

## src-web/（React 19 + Vite + Tailwind v4 + shadcn base-ui + zustand + react-router/hash）

根配置：
- `vite.config.ts` — react 插件；Tailwind 走 `css.postcss`（样式入口是 .scss，vite 插件模式会漏编译）
- `components.json` — shadcn CLI（css→src/index.scss；`utils` 别名指向 lib/utils 作 CLI 落点）
- `eslint.config.js` — 含架构边界强制：IPC 仅 `lib/tauri/`、Eden 仅 `lib/api.ts`、fetch 仅 `lib/chat.ts`
- `index.html` — 入口 + favicon

src/：
- `main.tsx` — 挂载入口：引全局样式、输入守卫、sidecar 退出监听、窗口显示
- `index.scss` — 全局样式单一入口：Tailwind 引入、主题令牌(:root/.dark 含 --shell)、VT 圆形揭示、基础层
- `assets/` — 打包静态资源；`public/logo.svg` — 品牌 logo（favicon/侧栏/登录共用，明暗自适应）；`public/bg-gradient.png` — 登录页渐变装饰图（源自 reactflow.dev hero，`.bg-gradient` 类引用）
- `styles/typeset.scss` — Markdown 排版样式

components/：
- `ui/` — shadcn CLI 生成，勿手改（已知例外：sidebar.tsx 删 cookie 写入）
- `brand-logo.tsx` — 品牌 logo 统一组件（默认 size-5 = 侧栏图标+4px）
- `theme-provider.tsx` — 主题上下文（light/dark/system，html class 同步落）
- `layout/` — 应用外壳：
  - `app-shell.tsx` — 圆角壳（根透明 + `#app-canvas-anchor` Portal 锚点）+ TitleBar + 常驻侧栏（三态切换全动画）+ Outlet
  - `page-canvas.tsx` — 页面背景画布（每页自带两层：壳色+噪点晕染衬层+实色内容面 --shell（与衬层同色）；Portal 入锚点铺满全窗，主干零背景铁律的执行者；CanvasAnchorProvider 由 AppShell 挂 ref 下发）
  - `title-bar.tsx` — h-10 自绘标题栏：三态开关/前进后退 + 拖动区 + 主题/置顶/窗口三键
  - `sidebar-body.tsx` — 侧栏正文（品牌+导航+用户；固定与悬浮共用，tooltip=false 抑制全宽态提示）
  - `sidebar-brand.tsx` / `sidebar-nav.tsx` / `sidebar-user.tsx` — 头部 logo / 导航项 / 底部用户区菜单（明暗切换、设置、登录/退出）
  - `sidebar-cycle-trigger.tsx` — 三态循环按钮（提示=下次点击效果；移动端=抽屉开合）
  - `sidebar-peek.tsx` — hidden 态左缘悬浮侧栏（热区滑出，收回态 inert）
  - `sidebar-resizer.tsx` — 展开态拖宽手柄（拖动直写 DOM，pointerup 提交 store）
  - `theme-menu.tsx` — 明暗/系统下拉（菜单关闭后再触发 VT）
  - `window-drag-region.tsx` — 拖动区（原生 app-region 转发 + JS 双轨兜底，双击最大化）
  - `window-controls.tsx` — 最小/最大/关闭三键（仅桌面；关闭键 Windows 红）
  - `window-pin.tsx` — 窗口置顶开关（仅桌面；不随重启保留）
- `flow/` — React Flow 演示（`flow-demo.tsx` 画布编排、`step-node.tsx` 自定义节点）

routes/：
- `router.tsx` — 路由表：`/login` 独立于外壳；壳内 home/chat/flow/settings（+桌面专属 test）；chat、flow lazy 分包
- `pages/` — `home` 演示页 / `chat` AI 对话 / `flow` 流程测试 / `login` 表单登录（预留校验）/ `settings` 分区菜单（可拖宽，宽度持久化）+快捷键清单 / `test-token` sidecar 令牌测试（仅桌面）

store/（zustand persist）：
- `ui.ts` — 侧栏三态模式 + 宽度（key `aitools-ui`，v1 迁移自旧二态）
- `auth.ts` — 登录态（预留，无服务端校验）

hooks/：
- `use-mobile.ts` — 移动断点判定；`use-history-nav.ts` — 前进/后退可用性；`use-drag-resize.ts` — 通用「拖宽」hook（侧栏与设置分区菜单共用：直写 DOM、松手提交、全局光标/禁过渡管理）

shortcuts/：
- `registry.ts` — 快捷键单一来源（键名常量 + 条目清单 + 按端过滤；新增热键必须登记，设置页读它展示）
- `sidebar-hotkey.ts` — Ctrl/Cmd+B 三态循环（window 捕获层接管，移动端走抽屉）
- `webview.ts` — 输入守卫（拖入拦截两端通用；右键/F5/F11 仅桌面）

lib/：
- `tauri/index.ts` — Tauri 能力唯一入口：窗口操作/置顶/圆角(get/set/事件)/sidecarToken/终止事件订阅 + `useWindowState` 单例快照
- `api.ts` — Eden 后端客户端；`chat.ts` — AI SDK transport（注入 x-tauri-token，fetch 白名单）
- `theme-transition.ts` — `startThemeTransition` 写 --vt-* 触发圆形揭示
- `utils.ts` — 仅 components.json 的 utils 别名落点（re-export cn），业务代码勿引用

## src-bun/（Bun + Elysia；桌面 sidecar / 服务器部署两形态，靠令牌区分）

- `app/index.ts` — 应用组装入口；`app/cluster.ts` — 多进程封装
- `app/common/` — `tauri_sidecar.ts`（sidecar 令牌配置，token 非空=本地模式）、schemas/schemaDerive/init-global
- `app/controller/api/` — 公共路由 `/api/**`（chat、test、嵌套示例 testsub）；`app/controller/offline/` — 桌面专属 `/offline/**`（服务器不注册）
- `app/lib/` — drizzle / redis / logger / error；`app/model/` — 数据表 mold（user/post/relations）
- `app/plugins/` — 控制器注册 / macro / schema 插件；`app/utils/` — file / watch / menu-ui 通用工具
- `system/script/` — build / build_tauri_bun（产出 sidecar 二进制）/ genApiTypes / routes / menu / batchExport；`system/generated/` — 派生产物（勿手改）
- `public/` — 服务静态资源；`logs/` — 运行日志
- 产物 `bun-service-<target>.exe|.map` — tauri sidecar 二进制（externalBin 引用）

## src-tauri/（Tauri v2，Rust 桌面壳）

- `tauri.conf.json` — 窗口（无装饰/透明/最小 375×667）/ devUrl / bundle（externalBin 由 scripts 注入，源文件留空）
- `build.rs` — tauri_build + release 下 externalBin 自检（缺 sidecar 配置即中断构建）
- `Cargo.toml` — devtools 仅 debug target；windows/webview2-com 仅 Windows target；panic=abort
- `capabilities/default.json` — 窗口权限白名单（minimize/toggle-maximize/close/show/start-dragging/set-always-on-top）
- `app-icon.png` + `icons/` — 全端图标（app-icon.png 为源图，改动后 `bunx tauri icon app-icon.png` 重生成；android/ios 目录为模板保留）
- `src/`：
  - `main.rs` — 入口（release 无控制台）
  - `lib.rs` — Builder：插件（shell/window-state/single-instance）+ setup（release 拉 sidecar、WebView2 非客户端区转发、5s 强显兜底）+ 命令注册
  - `commands.rs` — IPC：`sidecar_token` / `get·set_window_corners`（设置成功广播 `window-corners-changed`）
  - `sidecar.rs` — bun-service 生命周期：注入令牌、日志转发、意外退出 emit `sidecar-terminated`
  - `sidecar_terminal_log.rs` — release 终端日志文件（exe 同级 logs/sidecar_terminal_bun/）
  - `state.rs` — 托管状态：SidecarToken / CornerState（WindowCorners 默认 5px，与前端同步）

## 跨模块契约速查（改动时任一端必查另一端）

| 契约 | 两端 |
|---|---|
| invoke：`sidecar_token` `set/get_window_corners` | src-tauri/commands.rs ↔ src-web/lib/tauri |
| 事件：`window-corners-changed` `sidecar-terminated` | src-tauri emit ↔ src-web listen |
| env：`TAURI_SIDECAR={"token":...}` | src-tauri/sidecar.rs ↔ src-bun/common/tauri_sidecar.ts |
| HTTP：`/api/**` `/offline/**` | src-bun 控制器 ↔ src-web/lib(api.ts·chat.ts) |
| 圆角默认值 5px | src-tauri/state.rs ↔ src-web/lib/tauri defaultCorners |
| 窗口最小 375×667 ↔ 移动断点 768 | src-tauri/tauri.conf.json ↔ src-web（根 AGENTS 有述） |
| devUrl / externalBin | scripts/config.ts ↔ src-tauri/tauri.conf.json |
| 快捷键清单 | src-web/shortcuts/registry.ts（新增热键必须登记） |

## 维护规范

- 结构变化 = 代码 + 本文件同一提交更新；漏更视为改动未完成
- 新增模块/目录：先定职责归属（各模块自查、互不牵扯），再登记条目
- 命名沿用现有约定：`src-*` 顶层模块；web 内按职责目录（layout/routes/store/hooks/shortcuts/lib）
