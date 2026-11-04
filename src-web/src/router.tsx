import { createHashRouter } from "react-router"
import App from "./App"
import { isTauri } from "@/lib/tauri"
import { HomePage } from "./pages/home"
import { TestTokenPage } from "./pages/test-token"

/** SPA 路由表（hash 模式：Tauri 各平台与静态 web 部署零配置，刷新深链接不 404） */
export const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: HomePage },
      // 鉴权测试页依赖桌面端 sidecar，仅桌面注册
      ...(isTauri ? [{ path: "test", Component: TestTokenPage }] : []),
    ],
  },
])
