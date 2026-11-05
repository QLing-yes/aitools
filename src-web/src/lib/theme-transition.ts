// View Transitions 圆形揭示主题切换：不支持的浏览器降级为直接切换（无动画）
// 动画本体由 index.css 的方向规则驱动（.dark 决定收/扩），此处只写入几何参数并触发过渡

/**
 * 圆形揭示切换主题：切深色时旧快照收缩回起点，切浅色时新快照从起点扩散
 * @param applyTheme 应用主题的回调（须同步改 DOM class，provider 的 setTheme 满足）
 * @param x 动画起点 x 坐标（点击点或视口中心）
 * @param y 动画起点 y 坐标（点击点或视口中心）
 */
export function startThemeTransition(applyTheme: () => void, x: number, y: number): void {
  if (!("startViewTransition" in document)) {
    applyTheme()
    return
  }

  // 圆心与终点半径（起点到最远角的距离）写入 CSS 变量，供 keyframes 取用
  const style = document.documentElement.style
  style.setProperty("--vt-x", `${x}px`)
  style.setProperty("--vt-y", `${y}px`)
  style.setProperty(
    "--vt-r",
    `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`
  )

  document.startViewTransition(applyTheme)
}
