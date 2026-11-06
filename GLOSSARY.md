# 词汇表（领域与架构）

> 本文件给"好的接缝"命名：跨模块沟通、架构复核、命名新模块时以本文为准。
> 规则：一个词一行，写清它指什么、边界在哪、真值来源在哪。

## 分发与后端

| 词 | 含义 | 真值来源 |
|---|---|---|
| 分发形态 | 离线桌面 / 服务桌面 / web 部署三种发布方式 | 根 AGENTS.md；代码侧判据只有 `VITE_API_URL` 与 sidecar 令牌 |
| 公共路由 `/api/**` | 三种形态都有的接口 | src-bun `app/controller/api/` |
| 本机路由 `/offline/**` | 仅本地 sidecar 形态可用的接口；服务器形态按令牌 404 | src-bun `app/controller/offline/` + `app/plugins/controller.plug.ts` 门控 |
| 令牌（SidecarToken） | 一次性随机串，证明"这个请求来自本机 webview" | src-tauri 生成并注入 `TAURI_SIDECAR` |
| 就绪（SidecarReady） | sidecar 进程已起来且未退出 | src-tauri `state.rs`；「令牌非空」等价于「就绪」 |
| 后端目标 | 某次请求该打到哪个地址、带哪些头 | src-web `lib/backend.ts`（唯一出口） |

## 界面结构

| 词 | 含义 | 真值来源 |
|---|---|---|
| 主干链 | 窗口→html/body/#root→壳根→provider→行→标题栏→侧栏→inset→页面根 | 一律零背景（铁律，见 src-web/AGENTS.md） |
| 衬层 | 页面画布底层：壳色 + 噪点 + 两处晕染，铺满全窗 | src-web `components/layout/page-canvas.tsx` |
| 内容面 | 页面画布上层：半透壳色 + 12px 磨砂，让位标题栏带与侧栏列 | 同上；着色在 index.scss 契约条目 3 |
| 锚点 | 壳根里承接画布 Portal 的全窗节点（绕开 `contain:paint`） | `page-canvas.CanvasAnchor`（模块自持，无 context） |
| 标题栏带 | 自绘标题栏占住的那 2.5rem 高度 | `@theme --spacing-titlebar` |
| 侧栏三态 | expanded / icon / hidden | `store/ui.ts`；到注册表二态的翻译也在这里 |
| 宽度通道 | 发布到文档根的 `--sidebar-width(-icon)`，侧栏/画布/悬浮侧栏共同继承 | `lib/sidebar-channel.ts` |
| 圆角通道 | 文档根 `--app-radius`：壳根、登录页根（挂 `[data-app-radius]`）与 VT 快照底色层同源，最大化归零 | `lib/tauri` 写通道；兜底值在 index.scss |
| 窗口描边 | OS 边框/阴影关闭后由 web 自绘的 1px 窗缘浅线（仅桌面渲染） | index.scss `[data-app-edge]` + `--edge` |
| 出场（reveal） | 启动不占屏（Windows 最小化，其余保持隐藏），web 首屏提交后还原+显示+聚焦 | `commands::reveal_window` ↔ `components/layout/window-reveal.tsx`；动作在 lib.rs `present_window` |
| 淡出线 | 1px、两端 4% 全透明的分割线（含两条可拖线），恒显不变色 | `--line-h` / `--line-v` |
| 覆写契约 | 本仓压过 shadcn/Base UI 内部实现的 13 条层外规则 | index.scss「注册表覆写契约」一节 |
| 快捷键清单 | 键位、展示串、生效端、行为的唯一来源 | `shortcuts/registry.ts` |
