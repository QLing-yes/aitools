// WebView 全局输入守卫

import { isTauri, toggleMaximizeWindow } from "@/lib/tauri"

/** 安装 WebView 全局输入守卫：拖入拦截两端通用；右键/F5/F11 属桌面窗口语义，仅 Tauri 生效 */
export function installWebviewGuards(): void {
  // 阻止文件拖入触发浏览器导航（桌面防意外、web 同理保留）
  document.addEventListener("dragover", (e) => e.preventDefault())
  document.addEventListener("drop", (e) => e.preventDefault())
  if (!isTauri) return
  document.addEventListener("contextmenu", (e) => e.preventDefault())
  document.addEventListener("keydown", (e) => {
    if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
      e.preventDefault()
      return
    }
    if (e.key === "F11") {
      e.preventDefault()
      toggleMaximizeWindow()
    }
  })
}
