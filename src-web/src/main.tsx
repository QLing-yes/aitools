import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// 禁用 webview 原生右键菜单（dev 模式默认启用，release 已默认禁用）
document.addEventListener("contextmenu", (e) => e.preventDefault())

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
