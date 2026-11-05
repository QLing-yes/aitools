import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"

import "./index.scss"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { showWindow, onSidecarTerminated } from "@/lib/tauri"
import { router } from "@/routes/router.tsx"
import { installWebviewGuards } from "@/shortcuts/webview.ts"

// 安装 WebView 全局输入守卫（桌面：右键/刷新/F11；两端：文件拖入拦截）
installWebviewGuards()

// sidecar 意外退出留痕（/offline 将不可用；UI 提示位待接入）
void onSidecarTerminated((code) =>
  console.error("[tauri] sidecar terminated, code:", code)
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)

// 页面挂载完成后显示窗口，避免白屏闪烁
showWindow()
  .then(() => console.log("[app] window shown"))
  .catch((e) => console.error("[app] window show failed:", e))
