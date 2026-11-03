import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { getCurrentWindow } from "@tauri-apps/api/window"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// 禁用 webview 原生右键菜单（dev 模式默认启用，release 已默认禁用）
document.addEventListener("contextmenu", (e) => e.preventDefault())

// 禁用 webview 默认快捷键；F11 切换最大化/还原
document.addEventListener("keydown", (e) => {
  if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
    e.preventDefault()
    return
  }
  if (e.key === "F11") {
    e.preventDefault()
    getCurrentWindow().toggleMaximize()
  }
})

// 阻止文件拖入触发页面跳转（仅阻止默认导航，业务 drop 监听不受影响）
document.addEventListener("dragover", (e) => e.preventDefault())
document.addEventListener("drop", (e) => e.preventDefault())

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)

// 页面挂载完成后显示窗口，避免白屏闪烁
getCurrentWindow()
  .show()
  .then(() => console.log("[app] window shown"))
  .catch((e) => console.error("[app] window show failed:", e))
