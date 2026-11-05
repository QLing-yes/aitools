// 页面背景画布：背景是页面级资产，经 Portal 铺入壳根锚点（全窗，含透明标题栏/侧栏之下）
// 两层：①壳色+噪点+晕染衬底层 ②内容面（实色 --background，避让标题栏带与侧栏区，左上内圆角）

import { createContext, useContext } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"

/** 锚点元素上下文：AppShell 捕获 DOM 后经 Provider 下发 */
const AnchorCtx = createContext<HTMLElement | null>(null)

/** 画布锚点 Provider：AppShell 用 ref 抓到锚点元素后包裹外壳子树 */
export function CanvasAnchorProvider({
  anchor,
  children,
}: {
  anchor: HTMLElement | null
  children: ReactNode
}) {
  return <AnchorCtx value={anchor}>{children}</AnchorCtx>
}

/** 页面画布容器 @param children 页面前景内容 */
export function PageCanvas({ children }: { children: ReactNode }) {
  const anchor = useContext(AnchorCtx)

  const canvas = (
    <div data-slot="page-canvas-shell" className="absolute inset-0 bg-shell">
      {/* 内容面：着色与 left 偏移均由 index.scss 层外规则驱动；top 让位透明标题栏带 */}
      <div
        data-slot="page-canvas-surface"
        className="absolute inset-x-0 top-10 bottom-0 rounded-tl-lg"
      />
    </div>
  )

  return (
    <>
      {anchor ? createPortal(canvas, anchor) : null}
      {children}
    </>
  )
}
