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

- `dev.ts` — 并行拉起各模块 dev 进程；启动时固定 process.env 传子进程；tauri dev 带 `--features devtools`
- `build.ts` — 生产构建编排（先 `check_ipc` 闸门，再 config → web/bun 并行 → tauri → dist）
- `config.ts` — 向 tauri.conf.json 注入 devUrl / externalBin（NODE_ENV=production 才注 sidecar；内容未变不落盘，避免 tracked 文件恒脏）
- `check_ipc.ts` — IPC 契约漂移检查：Rust `#[tauri::command]`/`generate_handler!`/`emit` 与 src-web `IPC`·`IPC_EVENT` 常量表逐条比对，漂移即退出非零
- `spawn.ts` — 子进程启动公共封装

## src-web/（React 19 + Vite + Tailwind v4 + shadcn base-ui + zustand + react-router/hash）

根配置：
- `vite.config.ts` — react 插件；Tailwind 走 `css.postcss`（样式入口是 .scss，vite 插件模式会漏编译）
- `components.json` — shadcn CLI（css→src/index.scss；registry 组件的 cn 直接落 `cn` 包，无 lib/utils 落点）
- `eslint.config.js` — 含架构边界强制：IPC 仅 `lib/tauri/`、Eden 仅 `lib/api.ts`、fetch 仅 `lib/chat.ts`
- `index.html` — 入口 + favicon

src/：
- `main.tsx` — 挂载入口：引全局样式、输入守卫、sidecar 退出监听、`<WindowReveal/>` 出场时机
- `index.scss` — 全局样式单一入口：Tailwind 引入、主题令牌(:root/.dark 含 --shell/--edge/--separator/--chrome-*/--line-h|--line-v/侧栏宽度通道默认值/--app-radius 兜底)、窗口钩子 `[data-app-radius]`·`[data-app-edge]`、`@theme`（--breakpoint-md=768px、--spacing-titlebar=2.5rem）、「注册表覆写契约」索引节（升级 CLI 前按该清单复查）、VT 圆形揭示、基础层
- `assets/` — 打包静态资源；`public/logo.svg` — 品牌 logo（favicon/侧栏/登录共用，明暗自适应）；`public/bg-gradient.png` — 登录页渐变装饰图（源自 reactflow.dev hero，`.bg-gradient` 类引用）
- `styles/typeset.scss` — Markdown 排版样式

components/：
- `ui/` — shadcn CLI 生成，勿手改（已知例外：sidebar.tsx 删 cookie 写入与内置 Ctrl+B、不再 inline 宽度变量；button.tsx 加 chrome 态色变体；scroll-area.tsx 删未用 React 导入）
- `brand-logo.tsx` — 品牌 logo 统一组件（默认 size-5 = 侧栏图标+4px）
- `theme-provider.tsx` — 主题上下文（light/dark/system，html class 与 Windows 窗口原生明暗同步落；未选过时默认 light，与 index.html 首帧脚本同值）
- `layout/` — 应用外壳：
  - `app-shell.tsx` — 圆角壳（`[data-app-radius]` 走圆角通道 + `<CanvasAnchor/>` 锚点）+ TitleBar + 常驻侧栏（三态经 store/ui 纯函数翻译）+ Outlet + 桌面专属末尾 `[data-app-edge]` 描边层；宽度变更时发布到通道
  - `page-canvas.tsx` — 页面背景画布：自持锚点槽位（`CanvasAnchor` + useSyncExternalStore，无 context）；每页两层＝壳色噪点晕染衬层 + 半透磨砂内容面；`surfaceLeft(mode, desktop)` 是本模块拥有的偏移算法（left 直写 style）
  - `icon-action.tsx` — 图标按钮 + 下方提示的统一外壳（标题栏/侧栏图标动作一律用它）
  - `title-bar.tsx` — `h-titlebar` 自绘标题栏：三态开关/前进后退 + 拖动区 + 主题/置顶/窗口三键
  - `sidebar-body.tsx` — 侧栏正文（品牌+导航+用户；固定与悬浮共用，tooltip=false 抑制全宽态提示）
  - `sidebar-brand.tsx` / `sidebar-nav.tsx` / `sidebar-user.tsx` — 头部 logo / 导航项 / 底部用户区菜单（明暗切换、设置、登录/退出）
  - `sidebar-cycle-trigger.tsx` — 三态循环按钮（提示=下次点击效果；移动端=抽屉开合）
  - `sidebar-peek.tsx` — hidden 态左缘悬浮侧栏（官方非模态 Sheet + 热区 hover 唤出；几何/磨砂/遮罩统一在 index.scss 的 sidebar-peek 契约条目里）
  - `sidebar-resizer.tsx` — 展开态拖宽手柄（自持指针拖拽，拖动中只写文档根通道变量，pointerup 提交 store）
  - `theme-menu.tsx` — 明暗/系统下拉（菜单关闭后再触发 VT）
  - `window-drag-region.tsx` — 拖动区（原生 app-region 转发 + JS 双轨兜底，双击最大化）
  - `window-controls.tsx` — 最小/最大/关闭三键（仅桌面；关闭键 Windows 红）
  - `window-pin.tsx` — 窗口置顶开关（仅桌面；不随重启保留）
  - `window-reveal.tsx` — 首屏提交后发 `reveal_window` 就绪信号（启动阶段窗口最小化，此处才还原+显示+聚焦；禁用 rAF 触发，最小化时 WebView2 停帧）
- `flow/` — React Flow 演示（`flow-demo.tsx` 画布编排、`step-node.tsx` 自定义节点=官方 Card，退出全局磨砂、定宽）

routes/：
- `router.tsx` — 路由表：`/login` 独立于外壳；壳内 home/chat/flow/settings（+桌面专属 test）；chat、flow lazy 分包
- `pages/` — `home` 演示页 / `chat` AI 对话 / `flow` 流程测试 / `login` 表单登录（预留校验）/ `settings` 官方 Tabs 分区导航（≥768 可拖宽分栏 + Item/Kbd 快捷键清单）/ `test-token` sidecar 令牌测试（仅桌面，结果用官方 Code Block）

dev/（零依赖原生工具，可整体拷走）：
- `layer-inspector.ts` — 层级背景检视器：`mountLayerInspector()` 唯一导出（幂等，返回卸载函数；卸载会清 `data-dlx` 标记与 window 监听）。自动扫描绘制层（html、body 恒为 #0/#1 底层，其余按 `getComputedStyle` 自带 bg/背景图/backdrop-filter/box-shadow/outline 判定），文档顺序即层序并记最近登记父层；`[data-dlx=n]` + 注入样式表逐层 `visibility` 切换——只在「祖先正被隐藏会继承下来」时才补 visible，绝不顶掉宿主自己的 visibility；默认由内向外，⇄ 反转，⟳ 重扫；面板 = 可拖动吸边按钮（位置存 localStorage）+ 进度条/数字框 + tag#id.class.data-* 折叠树，点标签复制裸词（剪贴板失败可框选 Ctrl+C）；工具自身打 `[data-dlx-ui]`，扫描跳过且样式永久豁免

store/（zustand persist）：
- `ui.ts` — 侧栏三态模式 + 宽度（默认 260px，与 index.scss `--sidebar-width` 兜底同值；key `aitools-ui`，v1 迁移自旧二态）
- `auth.ts` — 登录态（预留，无服务端校验）

hooks/：
- `use-mobile.ts` — 移动断点判定（768px 的 JS 侧唯一来源，与 index.scss 的 --breakpoint-md 同值）；`use-history-nav.ts` — 前进/后退可用性

shortcuts/：
- `registry.ts` — 快捷键单一来源：条目含 combo 结构、生效端、类别；`comboText/entryText` 派生展示串，`comboMatches` 供匹配，`effectiveShortcuts/shortcutById` 供安装与设置页（键位字面量只出现在这张表里）
- `sidebar-hotkey.ts` — 三态循环热键（组合键取自 registry；注册表内置的两态 Ctrl+B 已移除，不再抢事件）
- `webview.ts` — 守卫安装器：拖入拦截常驻，block 类与 hotkey 类条目全部由清单驱动（行为表按 id 挂钩）

lib/：
- `tauri/index.ts` — Tauri 能力唯一入口：`IPC`/`IPC_EVENT` 常量表（命令与事件名不再散写）+ 窗口操作/置顶/圆角/sidecarToken（仅缓存非空结果）/终止事件订阅 + `useWindowState` 单例快照
- `backend.ts` — 后端目标单一来源：`apiUrl` 拼址、`authHeaders` 注令牌、`treatyRequest` 供 Eden；形态判据只在这里
- `api.ts` — Eden 客户端（消费 backend）；`chat.ts` — AI SDK transport（消费 backend，fetch 白名单）
- `sidebar-channel.ts` — 侧栏宽度通道：把 `--sidebar-width` 发布到文档根（`publishWidth/readWidth/nextWidth`），使侧栏、画布、body Portal 的悬浮侧栏继承同一个值
- `theme-transition.ts` — `startThemeTransition` 写 --vt-* 触发圆形揭示

## src-bun/（Bun + Elysia；桌面 sidecar / 服务器部署两形态，靠令牌区分）

- `app/index.ts` — 应用组装入口；`app/cluster.ts` — 多进程封装
- `app/common/` — `tauri_sidecar.ts`（sidecar 令牌配置，token 非空=本地模式）、schemas/schemaDerive/init-global
- `app/controller/api/` — 公共路由 `/api/**`（chat、test、嵌套示例 testsub）；`app/controller/offline/` — 桌面专属 `/offline/**`（服务器形态按令牌一律 404，门控在 `app/plugins/controller.plug.ts`）
- `app/lib/` — drizzle / redis / logger / error；`app/model/` — 数据表 mold（user/post/relations）
- `app/plugins/` — 控制器注册 / macro / schema 插件；`app/utils/` — file / watch / menu-ui 通用工具
- `system/script/` — build / build_tauri_bun（产出 sidecar 二进制）/ genApiTypes / routes（顶层路由前缀全部组合导出，漏导出=该前缀不可达）/ menu / batchExport；`system/generated/` — 派生产物（勿手改）
- `public/` — 服务静态资源；`logs/` — 运行日志
- 产物 `bun-service-<target>.exe|.map` — tauri sidecar 二进制（externalBin 引用）

## src-tauri/（Tauri v2，Rust 桌面壳）

- `tauri.conf.json` — 窗口（无装饰/透明/无 OS 阴影与边框/最小 375×667）/ devUrl / bundle（externalBin 由 scripts 注入，源文件留空）
- `build.rs` — tauri_build + release 下 externalBin 自检（缺 sidecar 配置即中断构建）
- `Cargo.toml` — `[features] devtools`（dev 由 scripts 传 `--features`，release 不含 DevTools；cfg(debug_assertions) 不能用于选依赖）；windows/webview2-com 仅 Windows target；panic=abort
- `capabilities/default.json` — 窗口权限白名单（minimize/toggle-maximize/close/start-dragging/set-always-on-top/set-theme；show 已由 Rust 侧 reveal_window 承担，不再开权限）
- `app-icon.png` + `icons/` — 全端图标（app-icon.png 为源图，改动后 `bunx tauri icon app-icon.png` 重生成；android/ios 目录为模板保留）
- `src/`：
  - `main.rs` — 入口（release 无控制台）
  - `lib.rs` — Builder：插件（shell/window-state/single-instance）+ setup（release 拉 sidecar、WebView2 非客户端区转发、5s 强显兜底）+ 命令注册
  - `commands.rs` — IPC：`sidecar_token`（未就绪返回空串）/ `reveal_window`（就绪信号，动作在 lib.rs `present_window`）/ `shell_platform`（Rust cfg 平台标识）/ `get·set_window_corners`（设置成功广播 `window-corners-changed`）
  - `sidecar.rs` — bun-service 生命周期：注入令牌、置位/清零 SidecarReady、日志转发、意外退出 emit `sidecar-terminated`
  - `sidecar_terminal_log.rs` — release 终端日志文件（exe 同级 logs/sidecar_terminal_bun/）
  - `state.rs` — 托管状态：SidecarToken / SidecarReady（进程起来且未退出才为真）/ CornerState（WindowCorners 默认 5px，与前端同步）

## 跨模块契约速查（改动时任一端必查另一端）

| 契约 | 两端 |
|---|---|
| invoke：`sidecar_token` `reveal_window` `shell_platform` `set/get_window_corners` | src-tauri/commands.rs ↔ src-web/lib/tauri（`IPC` 表；`bun run check:ipc` 校验） |
| 事件：`window-corners-changed` `sidecar-terminated` | src-tauri emit ↔ src-web listen（`IPC_EVENT` 表；同上校验） |
| env：`TAURI_SIDECAR={"token":...}` | src-tauri/sidecar.rs ↔ src-bun/common/tauri_sidecar.ts |
| 令牌语义：非空=sidecar 进程已起来且未退出 | src-tauri/SidecarReady ↔ src-web/lib/backend（请求头）↔ src-bun/controller.plug（校验/门控） |
| HTTP：`/api/**` `/offline/**` | src-bun 控制器（offline 按令牌 404） ↔ src-web/lib/backend（apiUrl+authHeaders） |
| 侧栏宽度通道 `--sidebar-width` | src-web/lib/sidebar-channel.ts 单点发布（文档根）→ 侧栏/画布/悬浮侧栏/index.scss 兜底 |
| 内容面偏移 | src-web/components/layout/page-canvas.tsx 的 `surfaceLeft(mode, desktop)` |
| 圆角默认值 5px | src-tauri/state.rs ↔ src-web/lib/tauri defaultCorners ↔ index.scss `--app-radius`（VT 快照底色层与壳根共用同一通道） |
| 出场时机（启动最小化 → 首屏还原聚焦） | src-tauri/lib.rs setup + `commands::present_window` ↔ src-web/components/layout/window-reveal.tsx |
| 移动断点 768 | src-web/hooks/use-mobile.ts ↔ index.scss `--breakpoint-md`/媒体查询（壳最小 375×667 见根 AGENTS） |
| devUrl / externalBin | scripts/config.ts ↔ src-tauri/tauri.conf.json |
| 快捷键清单 | src-web/shortcuts/registry.ts（键位/展示/安装唯一来源，新增必须登记） |

## 维护规范

- 结构变化 = 代码 + 本文件同一提交更新；漏更视为改动未完成
- 新增模块/目录：先定职责归属（各模块自查、互不牵扯），再登记条目
- 命名沿用现有约定：`src-*` 顶层模块；web 内按职责目录（layout/routes/store/hooks/shortcuts/lib）
