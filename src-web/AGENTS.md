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
- 按钮态色单源：`--chrome-hover/press/on`（foreground 10%/16%/20% 叠加，只写 `:root` 一份——由 `--foreground` 派生，`.dark` 同元素覆盖自动生效）。标题栏/侧栏/分区导航图标按钮一律 `Button variant="chrome"`，选中用 `aria-pressed`/`aria-current`；侧栏条目选中由 index.scss 层外 `[data-active]` 加深，悬停色复用 `--sidebar-accent: var(--chrome-hover)`。
- 外壳/布局无边框：不写 border 类，边界视觉用恒显浅色拖拽细线（不随悬停/拖拽变色）或底色差。
- 表单校验用 `Field data-invalid` + 控件 `aria-invalid` + `FieldError`，手写校验状态，不引入 react-hook-form/zod。
- 聊天 UI 用主注册表原语（message-scroller/message/bubble/trace/empty），不用旧版 @ai-elements 的 conversation/prompt-input。

背景系统（独立性铁律）：
- 主干链零背景：窗口→html/body/#root→壳根→provider→行→标题栏→侧栏→inset→页面根全链路不着色。三层由 index.scss 层外 `!important` 锁死；窗口靠 `transparent:true`。
- 背景是页面级资产：每页自带 `<PageCanvas>`（衬层 bg-shell 壳色+噪点晕染、内容面实色同壳色圆角无覆盖口子、top-10 让位标题栏带；点状 `.bg-dots` 仅登录页，流程页用 React Flow 自带 Background）。AppShell 壳根供 `#app-canvas-anchor`（absolute inset-0 -z-10 全窗），画布经锚点 context + createPortal 铺满含标题栏带——Portal 是绕开 `contain:paint` 封锁的既定手段，行 contain 不变量勿动。
- `data-sidebar-mode` 挂锚点，CSS 驱动内容面偏移；媒体查询不加特异性，桌面偏移规则必须包在 `@media (width >= 48rem)` 内。
- 允许着色层白名单：页面画布两层、悬浮侧栏 peek（chrome 72%+blur18）、卡片/下拉菜单磨砂（--card/--popover 40%+blur24，全局规则挂 data-slot）、登录页自有根与 rf 光晕图。除此以外禁止任何作用于全应用的背景。
- 移动抽屉例外：Sheet 保持 bg-sidebar 实底（透明规则仅限 ≥48rem）。
- 过渡伪层例外：`::view-transition` 兜底色仅存于主题切换 300ms（见"桌面窗口与主题切换"）。
- 主窗口亚克力为**纯 CSS 近似**（不依赖 OS 材质）：`page-canvas-shell` 叠噪点(inline svg feTurbulence)+两处 `muted-foreground` 径向晕染；内容面实色 `--shell`（亮=#F9FAFB），亚克力只从标题栏带与侧栏列露出；点状纹理不在此层（`.bg-dots` 仅登录页引用）；各平台一致渲染，无 Win/mac/Linux 差异。

桌面窗口与主题切换：
- 桌面端任何页面必须保留最小化/最大化/关闭三键：AppShell 之外的全屏路由（如登录页）需自带 WindowControls + 顶部拖动区 + useWindowState 圆角。
- 主题切换动画只用 index.scss 的纯 CSS 方向规则（`vt-circle-in/out` + `--vt-x/y/r`，由 lib/theme-transition.ts 写参触发）；禁止改回「.ready 后 WAAPI animate」模式——过渡被跳过/拒绝时静默无动画。
- View Transition 期间文档渲染被快照树替换，`::view-transition` 必须保留 `var(--shell)` 兜底底色，否则透明窗口直接透见桌面。
- 新增主题：在 html 层用类覆盖 CSS 变量（必须含 `--shell`），动画链路零改动即生效；切换必须在 `startThemeTransition` 的 flushSync 回调内同步落 html class，方向由目标是否带 `.dark` 决定。

侧边栏：
- 三态模式 `expanded/icon/hidden` 以 zustand（store/ui.ts）为唯一持久化源；切换走 `cycleSidebarMode`，标题栏按钮与 Ctrl+B 共用它。
- 侧栏**常驻挂载**保证三态切换均有出入动画：`collapsible` 按模式取 `icon`/`offcanvas`（hidden=offcanvas 左滑出屏），provider `open` 仅在 expanded 为真；hidden 态容器加 `inert` 防离屏聚焦。勿改回条件卸载（会丢过渡）。
- Ctrl+B 在 `shortcuts/sidebar-hotkey.ts` 的 window 捕获层接管三态、阻断 provider 冒泡监听（移动端不拦截，走抽屉）。
- hidden 态另挂左缘悬浮侧栏（sidebar-peek.tsx，复用 sidebar-body.tsx，`tooltip={false}` 抑制全宽态的重复提示），收回态带 `inert`。
- ui/sidebar.tsx 的 cookie 写入已手删，CLI 更新组件后会带回，需再删。
- 行容器的 `[contain:paint]` 是 fixed 侧栏的包含块（侧栏始于标题栏之下、被壳圆角裁剪），不可移除；勿换成 transform（DPI 缩放下文字发虚）。

目录规范：按职责独立成目录，互不越界。
- `components/ui/`：shadcn CLI 生成的组件（勿手改，走 CLI 更新；已知例外：sidebar.tsx 删 cookie）。
- `components/layout/`：应用外壳布局（app-shell/page-canvas/title-bar/sidebar-body/sidebar-nav/sidebar-user/sidebar-cycle-trigger/sidebar-peek/sidebar-resizer/window-controls）。
- `components/*.tsx`：业务组件（如 theme-provider）。
- `routes/`：路由表 `router.tsx` + 页面 `pages/`。
- `store/`：zustand 持久化状态（ui/auth）。
- `hooks/`：通用 React hooks。
- `shortcuts/`：全局按键/输入监听（webview 守卫、侧栏三态热键）+ `registry.ts` 快捷键单一来源（新增热键必须登记，设置页读它展示）。主题切换无热键，仅菜单触发。
- `lib/`：领域封装（`tauri/` 桌面能力、`api.ts` 后端客户端、`chat.ts` AI 传输、`theme-transition.ts` 主题过渡、`utils.ts`）。
- `styles/`：额外全局样式（typeset.scss）。
架构边界（eslint 强制）：Tauri IPC 仅在 `lib/tauri/`；Eden 仅在 `lib/api.ts`；fetch 仅在 `lib/chat.ts`（AI SDK transport 注入鉴权头）；其余代码禁止裸 `fetch`。
