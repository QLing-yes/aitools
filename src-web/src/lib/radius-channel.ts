// 圆角通道：唯一发布者。四角半径挂在 <html> 上，壳根、窗口描边层与 ::view-transition 快照底色层
// 继承同一组值（定义在 provider 子树内它们取不到，同宽度通道）

import type { WindowCorners } from "@/store/ui"

/** 四角半径 CSS 变量名 */
const RADIUS_VAR = "--app-radius"

/** 把四角半径写入文档根 @param corners 四角半径 @param maximized 窗口是否最大化（最大化归零，否则圆角处漏桌面） */
export function publishRadius(corners: WindowCorners, maximized: boolean): void {
  document.documentElement.style.setProperty(
    RADIUS_VAR,
    maximized
      ? "0"
      : `${corners.topLeft}px ${corners.topRight}px ${corners.bottomRight}px ${corners.bottomLeft}px`
  )
}
