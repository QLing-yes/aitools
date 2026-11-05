// 应用外壳：圆角窗口容器 + 全宽标题栏 + 其下的 shadcn 图标折叠侧栏(sidebar-07) + 页面出口

import { Suspense, useState } from "react"
import type { CSSProperties } from "react"
import { Outlet } from "react-router"

import { CanvasAnchorProvider } from "@/components/layout/page-canvas"
import { SidebarBody } from "@/components/layout/sidebar-body"
import { SidebarPeek } from "@/components/layout/sidebar-peek"
import { SidebarResizer } from "@/components/layout/sidebar-resizer"
import { TitleBar } from "@/components/layout/title-bar"
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useWindowState } from "@/lib/tauri"
import { useSidebarHotkey } from "@/shortcuts/sidebar-hotkey"
import { useUiStore } from "@/store/ui"

export function AppShell() {
  useSidebarHotkey()
  const { radius } = useWindowState()
  /** 侧栏三态模式（zustand persist：完全显示/图标折叠/完全隐藏） */
  const sidebarMode = useUiStore((s) => s.sidebarMode)
  /** 写入侧栏模式 @param mode 目标模式 */
  const setSidebarMode = useUiStore((s) => s.setSidebarMode)
  /** 侧栏展开宽度（px，拖拽调节，zustand persist） */
  const sidebarWidth = useUiStore((s) => s.sidebarWidth)
  /** 画布锚点元素（ref 回调捕获，经 Provider 下发给 PageCanvas） */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <TooltipProvider>
      <div
        style={{ borderRadius: radius }}
        className="relative flex h-full flex-col overflow-hidden"
      >
        {/* 画布锚点：页面经 createPortal 把背景铺到全窗（绕开行 contain:paint 的 fixed 封锁）；
            data-sidebar-mode 在此驱动内容面偏移（选择器链保持 [mode]→surface 两级）；
            锚点在 SidebarProvider 子树之外，故自带 --sidebar-width 供内容面 left 取值（拖拽时由手柄同步直写） */}
        <div
          id="app-canvas-anchor"
          ref={setAnchorEl}
          data-sidebar-mode={sidebarMode}
          style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
          className="absolute inset-0 -z-10"
        />
        {/* 壳根恒透明：背景由每页 PageCanvas 经锚点 Portal 自带 */}
        <CanvasAnchorProvider anchor={anchorEl}>
          <SidebarProvider
            open={sidebarMode === "expanded"}
            onOpenChange={(open) => setSidebarMode(open ? "expanded" : "icon")}
            className="min-h-0 flex-1 flex-col"
            style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
          >
            {/* 全宽标题栏置顶，侧栏与内容都在其下方 */}
            <TitleBar />

            {/* contain:paint 令本行容器成为 fixed 侧栏的包含块（侧栏从标题栏下方开始并被根壳圆角裁剪），且不产生合成层，避免 DPI 缩放下文字发虚 */}
            <div className="relative flex min-h-0 flex-1 [contain:paint]">
              {/* md:h-full 仅覆盖桌面 fixed 容器的 h-svh，不泄漏到移动端 Sheet；border-r-0 去掉默认右边框，边界视觉由拖拽手柄的常显细线负责 */}
              {/* 侧栏常驻挂载保证三态切换均有出入动画：icon→hidden 走 offcanvas 左滑出屏，hidden→expanded 滑入+撑开（组件自带 200ms 过渡）；隐藏态 inert 防离屏聚焦 */}
              <Sidebar
                collapsible={sidebarMode === "hidden" ? "offcanvas" : "icon"}
                inert={sidebarMode === "hidden"}
                className="group-data-[side=left]:border-r-0 md:h-full"
              >
                <SidebarBody />
              </Sidebar>

              {/* 展开态才显示拖拽手柄；折叠成图标时无可调宽度 */}
              {sidebarMode === "expanded" && <SidebarResizer />}

              {/* 隐藏态：左边缘热区滑出悬浮侧栏 */}
              {sidebarMode === "hidden" && <SidebarPeek />}

              <SidebarInset className="min-h-0 overflow-hidden bg-transparent">
                {/* 内容区不带内边距：页面自管布局（普通页 p-6，chat 页全高自滚动） */}
                <div className="min-h-0 flex-1 overflow-auto text-sm">
                  <Suspense fallback={null}>
                    <Outlet />
                  </Suspense>
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </CanvasAnchorProvider>
      </div>
    </TooltipProvider>
  )
}
