// 通用「拖动改变宽度」hook：拖动中直写目标 DOM（零 React 渲染），松手才提交；
// 负责指针捕获、全局光标/选中状态归还、拖拽期全局禁过渡属性、中途卸载兜底

import { useCallback, useEffect, useRef, useState } from "react"
import type React from "react"

/** 数值钳制 @param v 输入 @param min 下限 @param max 上限 @returns 范围内数值 */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/** hook 配置 @property resolve 从手柄元素定位宽度目标 @property read 读取目标当前宽度px
 *  @property apply 拖动中直写宽度 @property onCommit 松手提交 @property min/max 宽度范围
 *  @property resizingAttr 拖拽期挂在 <html> 的 data 属性名（供 CSS 禁过渡），可省 */
export interface DragResizeOptions {
  resolve: (handle: HTMLElement) => HTMLElement | null
  read: (el: HTMLElement) => number
  apply: (el: HTMLElement, width: number) => void
  onCommit: (width: number) => void
  min: number
  max: number
  resizingAttr?: string
}

/** hook 返回值 @property dragging 是否正在拖@drag @property handleProps 绑到手柄 div 的事件组 */
export function useDragResize(o: DragResizeOptions) {
  const [dragging, setDragging] = useState(false)
  /** 拖动中标志（ref 版，事件内零渲染判定） */
  const draggingRef = useRef(false)
  /** 目标左缘（宽度计算基准） */
  const origin = useRef(0)
  /** 实时宽度（px），松手提交 */
  const width = useRef(0)

  /** 归还全局光标/选中/禁过渡状态 */
  const resetGlobal = useCallback(() => {
    if (o.resizingAttr) delete document.documentElement.dataset[o.resizingAttr]
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [o.resizingAttr])

  // 拖动中途卸载（如快捷键折叠）兜底归还全局状态
  useEffect(() => () => { if (draggingRef.current) resetGlobal() }, [resetGlobal])

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const el = o.resolve(e.currentTarget)
    if (!el) return
    origin.current = el.getBoundingClientRect().left
    width.current = o.read(el)
    draggingRef.current = true
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    if (o.resizingAttr) document.documentElement.dataset[o.resizingAttr] = ""
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    width.current = Math.round(
      clamp(e.clientX - origin.current, o.min, o.max)
    )
    const el = o.resolve(e.currentTarget)
    if (el) o.apply(el, width.current)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    resetGlobal()
    o.onCommit(width.current)
  }

  return {
    dragging,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
