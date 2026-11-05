// 完全隐藏态的悬浮侧栏：光标贴近内容区左边缘滑出，离开短暂延迟后收回

import { useEffect, useRef, useState } from "react"

import { SidebarBody } from "@/components/layout/sidebar-body"
import { cn } from "cn"

/** 鼠标离开后延迟收回（ms），留出从边缘移入面板的时间 */
const HIDE_DELAY_MS = 200

export function SidebarPeek() {
  /** 面板是否滑出 */
  const [shown, setShown] = useState(false)
  /** 延迟收回定时器 id */
  const hideTimer = useRef(0)

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  /** 热区/面板进入：取消收回并立即弹出 */
  const reveal = () => {
    clearTimeout(hideTimer.current)
    setShown(true)
  }
  /** 离开：延迟收回 */
  const scheduleHide = () => {
    hideTimer.current = window.setTimeout(() => setShown(false), HIDE_DELAY_MS)
  }

  return (
    <>
      {/* 左边缘热区（窄条，不遮挡内容点击） */}
      <div
        className="absolute inset-y-0 left-0 z-20 w-3"
        onMouseEnter={reveal}
        onMouseLeave={scheduleHide}
      />
      {/* 悬浮面板：复用同一侧栏组件，边距+圆角+投影；磨砂背景由 index.scss 全局规则提供 */}
      <div
        data-slot="sidebar-peek"
        className={cn(
          "absolute inset-y-2 left-2 z-30 w-(--sidebar-width) overflow-hidden rounded-xl shadow-2xl transition-transform duration-200 ease-out",
          !shown && "pointer-events-none -translate-x-[calc(100%+1rem)]"
        )}
        inert={!shown}
        onMouseEnter={reveal}
        onMouseLeave={scheduleHide}
      >
        <div className="flex h-full w-full flex-col text-sidebar-foreground">
          <SidebarBody tooltip={false} />
        </div>
      </div>
    </>
  )
}
