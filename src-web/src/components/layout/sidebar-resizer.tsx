// 侧栏宽度拖拽手柄：基于通用 useDragResize——拖动中直写 wrapper 的 --sidebar-width
// （零 React 渲染、零持久化序列化），松手才提交 store；线视觉见内部注释

import { useDragResize } from "@/hooks/use-drag-resize"
import { useUiStore } from "@/store/ui"

/** 侧栏可拖到的最小宽度（px） */
const MIN_WIDTH = 160
/** 侧栏可拖到的最大宽度（px） */
const MAX_WIDTH = 480

/** 侧栏宽度拖拽手柄 */
export function SidebarResizer() {
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth)

  const { handleProps } = useDragResize({
    // 手柄在 wrapper（provider 行容器）内，向上找承载 --sidebar-width 的元素
    resolve: (handle) =>
      handle.closest<HTMLElement>("[data-slot='sidebar-wrapper']"),
    read: (el) =>
      parseFloat(getComputedStyle(el).getPropertyValue("--sidebar-width")) ||
      MIN_WIDTH,
    apply: (el, width) => {
      el.style.setProperty("--sidebar-width", `${width}px`)
      // 内容面在 Portal 锚点里（provider 子树之外），同一值同步直写，拖动中不错位
      document
        .getElementById("app-canvas-anchor")
        ?.style.setProperty("--sidebar-width", `${width}px`)
    },
    onCommit: setSidebarWidth,
    min: MIN_WIDTH,
    max: MAX_WIDTH,
    resizingAttr: "resizingSidebar",
  })

  return (
    <div
      data-slot="sidebar-resizer"
      role="separator"
      aria-orientation="vertical"
      {...handleProps}
      className="absolute inset-y-0 left-(--sidebar-width) z-20 hidden w-1.5 -translate-x-1/2 cursor-col-resize touch-none transition-[left] duration-200 ease-linear md:block"
    >
      {/* 分隔线：恒显 separator 浅色细线，悬停/拖拽都不变色；
          竖向两端各 4% 全透明渐变（与全局分割线同款），颜色经文字色驱动 */}
      <div
        className="absolute inset-y-0 left-1/2 w-[0.5px] -translate-x-1/2 text-separator"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0%, currentColor 4%, currentColor 96%, transparent 100%)",
        }}
      />
    </div>
  )
}
