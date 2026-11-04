import { ArrowLeft, ArrowRight, Copy, Minus, PanelLeftClose, PanelLeftOpen, Square, X } from "lucide-react"
import { useNavigate } from "react-router"
import {
  closeWindow,
  isTauri,
  minimizeWindow,
  startDraggingWindow,
  toggleMaximizeWindow,
  useWindowState,
} from "@/lib/tauri"
import { useHistoryNav } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useUiStore } from "@/store/ui"

/** 按钮通用基样式：可点手型、颜色与微缩放过渡、按下回弹、键盘焦点环 */
const baseBtnClass =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-150 ease-out active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"

/** 常规操作按钮（最小化/最大化）：悬停灰底，按下更深 */
const btnClass = `${baseBtnClass} hover:bg-accent hover:text-accent-foreground active:bg-accent-foreground/15`

/** 关闭按钮：悬停 Windows 原生红 #E81123 + 白色图标，按下变浅（同原生） */
const closeBtnClass = `${baseBtnClass} hover:bg-[#E81123] hover:text-white active:bg-[#F1564C] active:text-white`

/** 左侧功能区按钮容器样式 */
const leftGroupClass = "flex items-center gap-0.5 pl-2"

/** 左侧功能按钮：图标常显实色（cn 合并覆盖基类的弱化色） */
const leftBtnClass = cn(baseBtnClass, "text-foreground")

/** 尽头置灰：不可点且淡化（后退/前进到历史边界时） */
const disabledClass = "pointer-events-none text-muted-foreground/40"

/**
 * 自定义标题栏
 * 左侧功能按钮（侧栏折叠、前进、后退）+ 拖动区域 + 窗口控制按钮
 */
export function TitleBar() {
  const { isMaximized } = useWindowState()
  const navigate = useNavigate()
  /** 前进/后退可用性（历史尽头判断） */
  const { canGoBack, canGoForward } = useHistoryNav()
  /** 侧栏是否折叠（zustand persist） */
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  /** 切换侧栏折叠 @param collapsed 是否折叠 */
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed)

  /** 拖动窗口（左键按住拖动区域时触发） */
  const startDragging = (e: React.MouseEvent) => {
    if (e.button === 0) startDraggingWindow()
  }

  /** 双击拖动区域切换最大化/还原 */
  const handleDoubleClick = () => toggleMaximizeWindow()

  return (
    <header className="flex h-10 shrink-0 items-center justify-between bg-transparent select-none">
      {/* 左侧：侧栏折叠、后退、前进 */}
      <div className={leftGroupClass}>
        <button
          type="button"
          className={leftBtnClass}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "展开侧栏" : "折叠侧栏"}
          title={sidebarCollapsed ? "展开侧栏" : "折叠侧栏"}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
        <button
          type="button"
          className={cn(leftBtnClass, !canGoBack && disabledClass)}
          disabled={!canGoBack}
          onClick={() => navigate(-1)}
          aria-label="后退"
          title="后退"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          className={cn(leftBtnClass, !canGoForward && disabledClass)}
          disabled={!canGoForward}
          onClick={() => navigate(1)}
          aria-label="前进"
          title="前进"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      {/* 中间：拖动区域（占据剩余空间） */}
      <div
        className="h-full flex-1"
        onMouseDown={startDragging}
        onDoubleClick={handleDoubleClick}
      />

      {/* 右侧：窗口操作按钮（仅桌面端；纯 web 部署无窗口能力，整组隐藏） */}
      {isTauri && (
        <div className="flex items-center gap-0.5 pr-2">
          <button type="button" className={btnClass} onClick={minimizeWindow} aria-label="最小化" title="最小化">
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={toggleMaximizeWindow}
            aria-label={isMaximized ? "还原" : "最大化"}
            title={isMaximized ? "还原" : "最大化"}
          >
            {isMaximized ? <Copy className="size-3" /> : <Square className="size-3" />}
          </button>
          <button type="button" className={closeBtnClass} onClick={closeWindow} aria-label="关闭" title="关闭">
            <X className="size-4" />
          </button>
        </div>
      )}
    </header>
  )
}
