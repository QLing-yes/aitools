// 侧栏三态热键：捕获阶段接管 Ctrl/Cmd+B，绕开 SidebarProvider 内置的两态开关

import { useEffect } from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { SIDEBAR_HOTKEY_KEY } from "@/shortcuts/registry"
import { useUiStore } from "@/store/ui"

/** 注册侧栏三态循环热键；移动端不拦截（Ctrl+B 走内置抽屉开合） */
export function useSidebarHotkey(): void {
  const isMobile = useIsMobile()
  const cycleSidebarMode = useUiStore((s) => s.cycleSidebarMode)

  useEffect(() => {
    if (isMobile) return
    /** 窗口捕获阶段拦截：stopImmediatePropagation 阻断 provider 冒泡监听 */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey) return
      if (e.key.toLowerCase() !== SIDEBAR_HOTKEY_KEY || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      cycleSidebarMode()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [isMobile, cycleSidebarMode])
}
