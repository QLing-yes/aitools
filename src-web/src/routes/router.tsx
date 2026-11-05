// SPA 路由表

import { lazy } from "react"
import { createHashRouter } from "react-router"

import { AppShell } from "@/components/layout/app-shell"
import { isTauri } from "@/lib/tauri"
import { HomePage } from "./pages/home"
import { LoginPage } from "./pages/login"
import { SettingsPage } from "./pages/settings"
import { TestTokenPage } from "./pages/test-token"

/** AI 对话页重依赖（ai/react-markdown）单独分包，不进首屏主 bundle */
const ChatPage = lazy(() =>
  import("./pages/chat").then((m) => ({ default: m.ChatPage }))
)
/** 流程测试页重依赖（@xyflow/react）单独分包 */
const FlowPage = lazy(() =>
  import("./pages/flow").then((m) => ({ default: m.FlowPage }))
)

/** 路由实例（hash 模式：Tauri 各平台与静态 web 部署零配置，刷新深链接不 404） */
export const router = createHashRouter([
  // 登录页独立于外壳，由用户操作进入（默认页仍是主界面）
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: HomePage },
      // AI 对话示例页（Vercel AI SDK + AI Elements）
      { path: "chat", Component: ChatPage },
      // 流程测试页（React Flow 示例）
      { path: "flow", Component: FlowPage },
      // 设置页（分区菜单：快捷键等）
      { path: "settings", Component: SettingsPage },
      // 鉴权测试页依赖桌面端 sidecar，仅桌面注册
      ...(isTauri ? [{ path: "test", Component: TestTokenPage }] : []),
    ],
  },
])
