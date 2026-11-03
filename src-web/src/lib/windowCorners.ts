import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

/** 窗口四角圆角（px），对应上左、上右、下右、下左 */
export interface WindowCorners {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

/**
 * 设置窗口四角圆角
 * @param topLeft 左上角 px
 * @param topRight 右上角 px
 * @param bottomRight 右下角 px
 * @param bottomLeft 左下角 px
 */
export function setWindowCorners(
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number
): Promise<void> {
  return invoke("set_window_corners", { topLeft, topRight, bottomRight, bottomLeft })
}

/**
 * 获取当前窗口四角圆角
 * @returns 四角圆角对象
 */
export function getWindowCorners(): Promise<WindowCorners> {
  return invoke("get_window_corners")
}

/**
 * 监听窗口圆角变化
 * @param callback 圆角变化回调
 * @returns 取消监听函数
 */
export function onWindowCornersChange(callback: (corners: WindowCorners) => void) {
  return listen<WindowCorners>("window-corners-changed", (event) => callback(event.payload))
}
