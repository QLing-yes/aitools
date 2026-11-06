// 应用外壳：圆角窗口容器 + 全宽标题栏 + 其下的 shadcn 图标折叠侧栏(sidebar-07) + 页面出口

import { Suspense, useLayoutEffect } from "react"
import { Outlet } from "react-router"

import { CanvasAnchor } from "@/components/layout/page-canvas"
import { SidebarBody } from "@/components/layout/sidebar-body"
import { SidebarPeek } from "@/components/layout/sidebar-peek"
import { SidebarResizer } from "@/components/layout/sidebar-resizer"
import { TitleBar } from "@/components/layout/title-bar"
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { publishGlass } from "@/lib/glass-channel"
import { publishWidth } from "@/lib/sidebar-channel"
import { isTauri } from "@/lib/tauri"
import { useSidebarHotkey } from "@/shortcuts/sidebar-hotkey"
import {
  collapsibleFor,
  modeFromOpen,
  openFor,
  useUiStore,
} from "@/store/ui"

export function AppShell() {
  useSidebarHotkey()
  /** 侧栏三态模式（zustand persist：完全显示/图标折叠/完全隐藏） */
  const sidebarMode = useUiStore((s) => s.sidebarMode)
  /** 写入侧栏模式 @param mode 目标模式 */
  const setSidebarMode = useUiStore((s) => s.setSidebarMode)
  /** 侧栏展开宽度（px，拖拽调节，zustand persist） */
  const sidebarWidth = useUiStore((s) => s.sidebarWidth)
  /** 个性化两项（持久化）：内容面自糊半径与壳色不透明度 */
  const glassBlur = useUiStore((s) => s.glassBlur)
  const glassFilm = useUiStore((s) => s.glassFilm)

  // 宽度通道：store 变更即发布到文档根（useLayoutEffect 抢在绘制前，避免首帧按 :root 兜底值闪一下）
  useLayoutEffect(() => publishWidth(sidebarWidth), [sidebarWidth])
  // 磨砂通道：同上，两个旋钮只改 CSS
  useLayoutEffect(() => publishGlass(glassBlur, glassFilm), [glassBlur, glassFilm])

  return (
    <TooltipProvider>
      <div
        data-app-radius
        className="relative flex h-full flex-col overflow-hidden"
      >
        {/* 画布锚点：页面背景经 createPortal 铺到全窗（绕开行 contain:paint 的 fixed 封锁） */}
        <CanvasAnchor />
        {/* 壳根恒透明：背景由每页 PageCanvas 自带；三态↔二态一律经 store/ui 纯函数翻译 */}
        <SidebarProvider
          open={openFor(sidebarMode)}
          onOpenChange={(open) => setSidebarMode(modeFromOpen(open, sidebarMode))}
          className="min-h-0 flex-1 flex-col"
        >
            {/* 全宽标题栏置顶，侧栏与内容都在其下方 */}
            <TitleBar />

            {/* contain:paint 令本行容器成为 fixed 侧栏的包含块（侧栏从标题栏下方开始并被根壳圆角裁剪），且不产生合成层，避免 DPI 缩放下文字发虚 */}
            <div className="relative flex min-h-0 flex-1 [contain:paint]">
              {/* md:h-full 仅覆盖桌面 fixed 容器的 h-svh，不泄漏到移动端 Sheet；border-r-0 去掉默认右边框，边界视觉由拖拽手柄的常显细线负责 */}
              {/* 侧栏常驻挂载保证三态切换均有出入动画：icon→hidden 走 offcanvas 左滑出屏，hidden→expanded 滑入+撑开（组件自带 200ms 过渡）；隐藏态 inert 防离屏聚焦 */}
              <Sidebar
                collapsible={collapsibleFor(sidebarMode)}
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
                {/* 内容区不带内边距：页面自管布局（普通页 p-6，chat 页全高自滚动）；滚动统一交官方 ScrollArea */}
                <ScrollArea className="min-h-0 flex-1 text-sm">
                  <Suspense fallback={null}>
                    <Outlet />
                  </Suspense>
                </ScrollArea>
              </SidebarInset>
            </div>
        </SidebarProvider>
        {/* 窗口描边仅桌面需要（web 页面自带浏览器视口边界）：OS 边框与阴影已关，1px 浅边线自绘 */}
        {isTauri && <div data-app-edge />}
      </div>
    </TooltipProvider>
  )
}
