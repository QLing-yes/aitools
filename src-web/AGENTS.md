# 规则
摇树：对于支持按需导入和摇树的，必须使用按需导入和摇树，避免全部导入。
组件化：能独立成组件的必须组件化。
光标：注意根据场景和元素切换合适的光标样式。
屏幕适配：注意需要兼容不同设备屏幕尺寸（如手机、平板、PC 等尺寸），避免在不同设备上显示异常。

Tailwind：
- 如果需要复用类名提取为常量，命名以 Class/Style 结尾（IDE 补全依赖此后缀），定义与.vscode/settings.json。
- 条件组合用 cn() 或 className 内三元。
- 禁止变量拼接类名，动态类必须写完整字面量。
- 覆盖 shadcn 组件内部默认类必须带同变体全类名（如 `group-data-[side=left]:border-r-0`），裸类名赢不了 tailwind-merge。
- icon 一律显式固定尺寸（`size-4 shrink-0`），不依赖组件的 `[&_svg]` 后代规则。

shadcn ui：
完全接纳和使用 shadcn 系列的官方全生态，包括组件、主题、插件、...等，尽量避免自己实现和使用其他组件库！！！
在编写时需要特别注意主题相关，保证有效果。
- 颜色一律语义令牌；新增色值走 CSS 变量（`:root`/`.dark` 双份 + `@theme inline` 注册，参照 `--shell`）。禁止硬编码单主题色衬在随主题 surface 之下：暗色令牌多为半透明白（如 `--border`），衬浅色底会恒显白线。
- 图标按钮一律 `components/layout/icon-action.tsx`（= chrome 态色 Button + 下方 Tooltip）；禁止再各自展开 Tooltip 三件套。选中态用 `aria-pressed`（开关）/`aria-current`（导航），侧栏条目选中由 index.scss 层外 `[data-active]` 加深，悬停色复用 `--sidebar-accent: var(--chrome-hover)`。
- 官方组件优先（硬规则）：写 UI 前先查 ui.shadcn.com/docs/components 清单，官方已有的必须 `shadcn add` 后用，禁止手写等价 div/kbd/pre 变体。官方无对应物才允许自定义：Tauri 窗口层（title-bar/drag-region/window-controls/window-pin）、page-canvas 背景层、sidebar-resizer（官方 Resizable 只服务 panel-group，驱动不了 fixed 侧栏的 `--sidebar-width`）、brand-logo、theme-provider/transition（官方是文档片段非 registry 项）、React Flow 画布。`typography`/`data-table` 官方仅文档、不可安装。
- 官方磨砂规则会波及的自定义表面需显式退出：流程节点 `[data-slot=card][data-flow-node]` 关 blur（拖动掉帧）。Sheet/Dialog/画布锚点都在 provider 子树之外（body Portal / 壳根），**provider 里定义的 CSS 变量它们取不到** → 宽度一律走 `lib/sidebar-channel` 发布到文档根，不再逐处 inline 补丁。
- 所有覆写注册表内部的层外规则集中在 index.scss 的「注册表覆写契约」一节，条目已编号；`shadcn add --overwrite` 或 Base UI 升级后按该清单逐条复查是否失效。
- 文字渲染：`html` 上统一 `-webkit-font-smoothing: antialiased` + `font-synthesis-weight: none`（Geist 有真字重，禁合成假粗）+ `font-kerning: normal`；正文色用近黑 `--foreground`（亮档 0.21，非纯黑），新增文字令牌一律别名到它，禁止再写 `oklch(0.145 0 0)` 一类的第二份黑。
- 外壳/布局无边框：不写 border 类，边界视觉用恒显浅色拖拽细线（不随悬停/拖拽变色）或底色差。
- 表单校验用 `Field data-invalid` + 控件 `aria-invalid` + `FieldError`，手写校验状态，不引入 react-hook-form/zod。
- 聊天 UI 用主注册表原语（message-scroller/message/bubble/trace/empty），不用旧版 @ai-elements 的 conversation/prompt-input。

背景系统（独立性铁律）：
- 主干链零背景：窗口→html/body/#root→壳根→provider→行→标题栏→侧栏→inset→页面根全链路不着色。三层由 index.scss 层外 `!important` 锁死；窗口靠 `transparent:true`。
- 主题必须同时声明 UA 着色方案：`html{color-scheme:light}` / `html.dark{color-scheme:dark}`。主干透明 ⇒ 壳根圆角、Win11 窗口圆角等「未被自绘覆盖」的像素由 UA 默认画布填充，缺它暗色下顶边整条发白（滚动条/表单控件也恒亮）。
- 窗口描边归 web：conf 已关 `decorations` 与 `shadow`，OS 不画线也不画阴影 → 壳根末尾 `[data-app-edge]` 用 `--edge` 自绘 1px inset 描边（跟随壳根圆角、`pointer-events:none`、仅桌面渲染）。已知差异：悬浮侧栏 peek 是 body Portal（z-50），展开时压住左缘那 1px。缩放热区为窗口最外约 4 CSS px（`SM_CXFRAME/CYFRAME`），贴边可点控件一律留 ≥8px——现有标题栏/侧栏内缩已满足，纵向滚动条贴右缘属已知风险点。
- 圆角单源：壳根与登录页根挂 `[data-app-radius]`，值走文档根 `--app-radius`（最大化归零），VT 快照底色层同值；组件内禁止再写 inline `borderRadius`。
- 主题落地时同步一次原生明暗 `lib/tauri.setWindowTheme(dark)`（仅 Windows，供 DWM 缩略图/Alt-Tab 着色；mac/linux 传明暗会污染 `prefers-color-scheme` 判定）。
- 背景是页面级资产：每页自带 `<PageCanvas>`（衬层 bg-shell 壳色+噪点晕染、内容面半透壳色 76% + blur12 磨砂、左上内圆角、top-titlebar 让位标题栏带；点状 `.bg-dots` 仅登录页，流程页用 React Flow 自带 Background）。锚点由本模块自持（`CanvasAnchor` 组件 + 模块内槽位 + useSyncExternalStore，不用 context/ref 转发），AppShell 只在壳根摆出锚点节点（absolute inset-0 -z-10 全窗），画布 createPortal 铺满含标题栏带——Portal 是绕开 `contain:paint` 封锁的既定手段，行 contain 不变量勿动。
- 内容面偏移是 JS 事实：`page-canvas.surfaceLeft(mode, desktop)` 返回 `var(--sidebar-width)`/`var(--sidebar-width-icon)`/`0px` 并直写 style，index.scss 只留过渡与着色；不再挂 `data-sidebar-mode`，也没有 CSS 侧的三态分支。
- 允许着色层白名单：页面画布两层、悬浮侧栏 peek（chrome 72%+blur18）、卡片/下拉菜单磨砂（--card/--popover 40%+blur24，全局规则挂 data-slot）、登录页自有根与 rf 光晕图、dev-only 检视面板（dev/layer-inspector.ts，release 不挂载）。除此以外禁止任何作用于全应用的背景。
- `dev/layer-inspector.ts` 必须零依赖（只用 DOM/CSSOM，不引 React、shadcn、本项目令牌），层级靠运行时 `getComputedStyle` 自动扫描（html、body 恒为最底两层）——新增自带背景的层无需登记；改它要保持「整文件拷进任意项目即可用」。
- 移动抽屉例外：Sheet 保持 bg-sidebar 实底（透明规则仅限 ≥768px）。
- 过渡伪层例外：`::view-transition` 兜底色仅存于主题切换 300ms（见"桌面窗口与主题切换"）。
- 主窗口亚克力为**纯 CSS 近似**（不依赖 OS 材质）：`page-canvas-shell` 叠噪点(inline svg feTurbulence)+两处 `muted-foreground` 径向晕染；内容面 `--shell` 76% 半透 + `blur(12px)`（磨砂透出衬层纹理）；点状纹理不在此层（`.bg-dots` 仅登录页引用）；各平台一致渲染，无 Win/mac/Linux 差异。
- 淡出线单源：横竖各一条 `--line-h`/`--line-v`（1px、两端 4% 全透明、色取 `--separator`），SCSS 与 TSX 一律引用变量，禁止再展开 gradient 字面量；拖拽线恒显不变色。
- 标题栏带高度单源：`@theme --spacing-titlebar: 2.5rem` → `h-titlebar`/`top-titlebar`（壳根让位、内容面偏移、悬浮侧栏共用），新增让位处用该类，不再写 h-10/top-10/top-12。
- 断点单源：`--breakpoint-md: 768px`（Tailwind `md:` 的实值）+ SCSS 媒体查询写 768px + `hooks/use-mobile.ts` 的 768，三处同值，改断点必须三处一起动（JS 与 CSS 无法共享变量，靠注释互指）。

桌面窗口与主题切换：
- 桌面端任何页面必须保留最小化/最大化/关闭三键：AppShell 之外的全屏路由（如登录页）需自带 WindowControls + 顶部拖动区 + useWindowState 圆角。
- 主题切换动画只用 index.scss 的纯 CSS 方向规则（`vt-circle-in/out` + `--vt-x/y/r`，由 lib/theme-transition.ts 写参触发）；禁止改回「.ready 后 WAAPI animate」模式——过渡被跳过/拒绝时静默无动画。
- View Transition 期间文档渲染被快照树替换，`::view-transition` 必须保留 `var(--shell)` 兜底底色，否则透明窗口直接透见桌面；该底色矩形还要 `border-radius: var(--app-radius)`（圆角通道由 lib/tauri `emitWindow` 单点写入），否则明暗切换的 300ms 里四角被填成尖角。
- 窗口出场时机归本模块：`layout/window-reveal.tsx` 在首屏 useEffect 里发 `reveal_window`（还原+显示+聚焦全在 Rust 一侧做完）。禁止改用 rAF/`onload` 等帧信号触发——窗口启动即最小化，WebView2 停帧时 rAF 永不回调，窗口会卡在不显示。
- 新增主题：在 html 层用类覆盖 CSS 变量（必须含 `--shell`），动画链路零改动即生效；切换必须在 `startThemeTransition` 的 flushSync 回调内同步落 html class，方向由目标是否带 `.dark` 决定。

侧边栏：
- 三态模式 `expanded/icon/hidden` 以 zustand（store/ui.ts）为唯一持久化源；`collapsibleFor/openFor/modeFromOpen` 三个纯函数是领域模式↔注册表二态的唯一翻译处（含 hidden 不被 provider 抹掉），组件里不得再各自写映射。Ctrl+B 与标题栏按钮共用 `cycleSidebarMode`。
- 侧栏**常驻挂载**保证三态切换均有出入动画：`collapsible` 按模式取 `icon`/`offcanvas`（hidden=offcanvas 左滑出屏），provider `open` 仅在 expanded 为真；hidden 态容器加 `inert` 防离屏聚焦。勿改回条件卸载（会丢过渡）。
- Ctrl+B 由 `shortcuts/sidebar-hotkey.ts` 普通监听接管三态；ui/sidebar.tsx 内置的两态热键已删，不要再加 `stopImmediatePropagation` 抢时序（移动端不拦截，走抽屉）。
- 宽度单通道：`lib/sidebar-channel.publishWidth` 只写 `<html>`，侧栏/拖拽手柄/画布内容面/悬浮侧栏全部继承它；拖拽期间直写文档根，pointerup 才提交 store。禁止在 provider/锚点/组件上再 inline 重复变量。
- hidden 态另挂左缘悬浮侧栏（sidebar-peek.tsx，官方非模态 Sheet + 复用 sidebar-body.tsx，`tooltip={false}` 抑制全宽态的重复提示），几何与磨砂在 index.scss 契约条目 5/6。
- ui/sidebar.tsx 的 CLI 手改例外共三处：删 cookie 写入、删内置 Ctrl+B、去掉 wrapper 的 inline `--sidebar-width(-icon)`；CLI 更新后会带回，需按 STRUCTURE.md 的 ui/ 例外行复原。
- 行容器的 `[contain:paint]` 是 fixed 侧栏的包含块（侧栏始于标题栏之下、被壳圆角裁剪），不可移除；勿换成 transform（DPI 缩放下文字发虚）。

目录规范：按职责独立成目录，互不越界。
- `components/ui/`：shadcn CLI 生成的组件（勿手改，走 CLI 更新；已知例外见 STRUCTURE.md 的 ui/ 行）。
- `components/layout/`：应用外壳布局（app-shell/page-canvas/icon-action/title-bar/sidebar-body/sidebar-nav/sidebar-user/sidebar-cycle-trigger/sidebar-peek/sidebar-resizer/window-*）。
- `components/*.tsx`：业务组件（如 theme-provider）。
- `routes/`：路由表 `router.tsx` + 页面 `pages/`。
- `store/`：zustand 持久化状态（ui/auth）。
- `hooks/`：通用 React hooks。
- `lib/`：`tauri/`（IPC 命令与事件常量表 + 窗口能力）、`backend.ts`（后端形态/地址/鉴权头单源）、`api.ts`·`chat.ts`（消费 backend）、`sidebar-channel.ts`（宽度通道）、`theme-transition.ts`。网络请求与令牌注入禁止在页面里各写一份。
- `shortcuts/`：`registry.ts` 是快捷键唯一来源（combo 结构 + 类别 + 生效端；`comboText/entryText` 派生展示、`comboMatches` 供匹配），`webview.ts` 按清单安装 block/hotkey，`sidebar-hotkey.ts` 只挂三态循环。新增热键/拦截必须进清单，否则设置页漏项。主题切换无热键，仅菜单触发。
- `lib/`：领域封装（`tauri/` 桌面能力、`api.ts` 后端客户端、`chat.ts` AI 传输、`theme-transition.ts` 主题过渡、`utils.ts`）。
- `styles/`：额外全局样式（typeset.scss）。
架构边界（eslint 强制）：Tauri IPC 仅在 `lib/tauri/`；Eden 仅在 `lib/api.ts`；fetch 仅在 `lib/chat.ts`（AI SDK transport 注入鉴权头）；其余代码禁止裸 `fetch`。
