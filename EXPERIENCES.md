# 经验沉淀

> 只记踩过才知道的结论。自由增删，过期即删，单条一行。

## WebView2 / 窗口
- WebView2 多 HWND：app-region 转发走 Chromium 子窗口↔DWM，不经宿主 WndProc → web 自绘按钮申报 HTMAXBUTTON 无门，贴靠浮层等 WCO 转正
- 触摸/鼠标拖窗正解：`ICoreWebView2Settings9.SetIsNonClientRegionSupportEnabled(true)` + `app-region: drag`
- `window-drag-button` 是 WCO 专用，普通页面不认且会废掉该元素的 drag 转发（判别：tooltip 还弹=没转发）
- `startDragging` 只认鼠标、必须 mousedown 时机调用；挪到 pointerdown 连鼠标都会坏
- 查 Windows 版本用 `RtlGetVersion`（`Wdk` 是顶层命名空间，参数 Win32 `OSVERSIONINFOW`）；浮层最低 build 22621
- Tauri 事件回调不 await 异步 handler：内部自己 try/catch

## 主题 / View Transitions
- VT 期间文档被快照树整体替换：透明窗口必须给 `::view-transition` 铺底色，否则空帧透见桌面
- 动画用纯 CSS 方向规则（`.dark` 回调内翻转、先于新快照捕获）；`.ready`+WAAPI 会被跳过机制静默吞掉
- 半透明暗色令牌（`--border`=10% 白）禁止衬硬编码浅色底（判别信号：恒显白线）

## 构建 / 工具链
- Tailwind v4 + SCSS：`@tailwindcss/vite` 只编译 .css 入口，.scss 入口时 @theme/utilities 原样漏出且无报错（判别：页面失样式、dev 样式表 theme/utilities 层为空、产物含 raw `@theme`）→ 改 `@tailwindcss/postcss` 挂 `css.postcss`；同理 .scss 内 @apply 不被编译，base 层写原生 CSS
- 构建门是 `bun run build`（tsc -b），typecheck 会漏
- `cmd | tail` 吞退出码；编译验证重定向到日志再看 `$?`
- gen-api 重写的空窗期会 TS2307 → 手动 `bun run generate_script`；别跑 `generate`（触发 drizzle 迁移）
- 控制器子目录+`.post("/")` 在 strictPath 下得到尾斜杠路径 → 平铺文件+显式相对路径
- 任意属性类可能被 render 合成链吞：关键样式用内联 style；JSX 注释不能进 `render={...}`
- 内置无头浏览器无渲染帧：VT/动画不可目测，按最终状态断言，动画留给真窗口

## React / UI
- 媒体查询不增加特异性：想用移动档压过属性选择器规则，必须把桌面规则整体包进 `@media (width>=48rem)`，反向覆盖写法定式失效
- 高频拖动：拖动中直写 DOM CSS 变量，pointerup 才提交 store（persist 一帧一次）
- 设备/窗口状态用模块级单例快照 + `useSyncExternalStore`，勿逐组件订阅
- 覆盖 shadcn 内部类必须带同变体全类名；CLI 更新会带回手删的定制（sidebar cookie），更新后复查
- icon 尺寸写死在业务层（`size-4 shrink-0`），不依赖组件 `[&_svg]`
- `contain: paint` 可做 fixed 包含块且不提升合成层（transform 有 DPI 文字发虚风险）
- shadcn CLI ResizableHandle 把 children 换成 withHandle 分支，业务侧传的线/把手永不渲染（DOM kids 为空）；把手视觉只能挂 `[data-slot=resizable-handle]::before`（react-resizable-panels v4 无 data-state 属性可用）
- Portal 到 provider 子树外的锚点后，子树内定义的 CSS 变量取不到：`left: var(--sidebar-width)` 失效退化为 auto，绝对定位空 div 塌成 0 宽细条（表面看起来只是"颜色不对"）。修法=锚点自带同名变量 inline + 直写型拖拽 hook 同步两处
