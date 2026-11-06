# 经验沉淀

> 只记踩过才知道的结论。自由增删，过期即删，单条一行。

## WebView2 / 窗口
- WebView2 多 HWND：app-region 转发走 Chromium 子窗口↔DWM，不经宿主 WndProc → web 自绘按钮申报 HTMAXBUTTON 无门，贴靠浮层等 WCO 转正
- 触摸/鼠标拖窗正解：`ICoreWebView2Settings9.SetIsNonClientRegionSupportEnabled(true)` + `app-region: drag`
- `window-drag-button` 是 WCO 专用，普通页面不认且会废掉该元素的 drag 转发（判别：tooltip 还弹=没转发）
- `startDragging` 只认鼠标、必须 mousedown 时机调用；挪到 pointerdown 连鼠标都会坏
- 查 Windows 版本用 `RtlGetVersion`（`Wdk` 是顶层命名空间，参数 Win32 `OSVERSIONINFOW`）；浮层最低 build 22621
- Tauri 事件回调不 await 异步 handler：内部自己 try/catch
- 无边框窗口顶部 1~2px 白线不是 DOM：`shadow:true` 会让 tao 在 WM_NCCALCSIZE 留一条非客户区（供 HTTOP 拖窗），由 DWM 绘制（判别：注释整个 html 仍有线）→ 已改 `shadow:false` 关掉 OS 边框/阴影，窗口描边由壳根末尾 `[data-app-edge]` 自绘 1px（仅桌面渲染）
- `shadow:false` 后缩放热区落进客户区：宽度就是 `SM_CXFRAME/SM_CYFRAME`，DPI 换算后恒约 4 CSS px（tao `hit_test` 只用 frame，不加 `SM_CXPADDEDBORDER`）；标题栏按钮排 `pl-2/pr-2`=8px 已避开，纵向滚动条贴右缘会落进热区（拖它可能变缩放，实机留意）

## 主题 / View Transitions
- VT 期间文档被快照树整体替换：透明窗口必须给 `::view-transition` 铺底色，否则空帧透见桌面；该底色矩形还得带 `border-radius: var(--app-radius)`（与壳根同源圆角），否则明暗切换的 300ms 内四角被填成尖角
- 窗口最小化时 WebView2 停帧但 JS 照跑：rAF 永不回调 → 出场/就绪这类信号只能挂 useEffect，不能用帧或 `onload`；另 `ShowWindow(SW_MINIMIZE)` 属 show 类，会把 `visible:false` 的窗口显示成最小化（任务栏有按钮、不上屏）
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
- `shadcn add` 带 registryDependencies 时会要求覆盖已有定制文件（如 button.tsx 的自定义变体）：先 `--dry-run` 看覆盖清单，交互提示回答 n 可跳过覆盖并继续创建其余文件
- Portal 类组件（Sheet/Dialog）渲染进 body Portal，provider 子树里定义的变量（--sidebar-width）同样取不到 → 组件 inline style 自带；与 page-canvas 锚点同坑
- Base UI Portal 的遮罩与面板之间夹辅助 span，`:has(+ …)` 相邻兄弟不成立 → 用 `:has(~ …)` 通用兄弟
- 未合成/隐藏的 webview 里 rAF 冻结：Base UI 弹层的 `data-starting-style` 永不摘除（停在 opacity:0+位移），别据此判定样式失效；用 computed left/width 校几何
- 生成式路由树只导出其中一个顶层前缀时，其余前缀（如 /offline）代码存在但不可达：生成器必须组合导出全部顶层 plug，形态差异改由运行期门控（404）表达
- cargo 的 cfg(debug_assertions) 不能用于 [target.*] 选依赖（cargo 直接告警失效）：按构建模式开关能力一律走 [features] + CLI 的 --features 透传
- 一次性随机令牌 ≠ 服务可用：令牌必须由"进程已起来且未退出"的就绪状态门控，否则前端拿到的判据是假的（所有请求 401/拒连且无提示）
- CSS 变量的继承域=DOM 子树：Portal 到 body（Sheet/Dialog）或壳根（画布锚点）的节点取不到 provider 子树里的变量 → 通道要发布到文档根，别在每处 inline 补一份
- Tailwind v4 的 md: 断点可被 @theme --breakpoint-md 改写；JS(matchMedia)/SCSS(媒体查询)/CLI 工具类三处断点无法共享变量，只能同值 + 注释互指，改一处必须三处齐动
