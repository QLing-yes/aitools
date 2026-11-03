import { Minus, X, Maximize2, Minimize2 } from "lucide-react"
import {
  closeWindow,
  minimizeWindow,
  startDraggingWindow,
  toggleMaximizeWindow,
  useWindowState,
} from "@/lib/tauri"

/** 窗口操作按钮通用样式 */
const btnClass =
  "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"

/** 关闭按钮悬停样式 */
const closeBtnClass =
  "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"

/**
 * 自定义标题栏
 * 包含图标、标题、拖动区域、最小化、还原/最大化、关闭
 */
export function TitleBar() {
  const { isMaximized } = useWindowState()

  /** 拖动窗口（左键按住拖动区域时触发） */
  const startDragging = (e: React.MouseEvent) => {
    if (e.button === 0) startDraggingWindow()
  }

  /** 双击拖动区域切换最大化/还原 */
  const handleDoubleClick = () => toggleMaximizeWindow()

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-sm select-none">
      {/* 左侧：图标 + 标题 */}
      <div className="flex items-center gap-2 pl-3">
        <img src="/vite.svg" alt="logo" className="size-4" />
        <span className="text-sm font-medium">aitools</span>
      </div>

      {/* 中间：拖动区域（占据剩余空间） */}
      <div
        className="h-full flex-1"
        onMouseDown={startDragging}
        onDoubleClick={handleDoubleClick}
      />

      {/* 右侧：窗口操作按钮 */}
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
          {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
        <button type="button" className={closeBtnClass} onClick={closeWindow} aria-label="关闭" title="关闭">
          <X className="size-4" />
        </button>
      </div>
    </header>
  )
}
