import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useEffect, useState } from "react"

/** 是否运行在 Tauri 环境（纯 web 部署时为 false，所有窗口能力降级为 no-op/默认值） */
const isTauri = "__TAURI_INTERNALS__" in window

/** 当前窗口句柄（仅 Tauri 环境创建，避免浏览器触发 IPC） */
const appWindow = isTauri ? getCurrentWindow() : null

// --------------------------------- 窗口操作 ---------------------------------

/** 显示窗口（页面挂载完成后调用，避免白屏闪烁；浏览器降级 no-op） */
export async function showWindow(): Promise<void> {
  await appWindow?.show()
}

/** 最小化窗口（浏览器降级 no-op） */
export async function minimizeWindow(): Promise<void> {
  await appWindow?.minimize()
}

/** 切换最大化/还原（浏览器降级 no-op） */
export async function toggleMaximizeWindow(): Promise<void> {
  await appWindow?.toggleMaximize()
}

/** 关闭窗口（浏览器降级 no-op） */
export async function closeWindow(): Promise<void> {
  await appWindow?.close()
}

/** 开始拖动窗口（左键按住拖动区域时触发；浏览器降级 no-op） */
export function startDraggingWindow(): void {
  void appWindow?.startDragging()
}

// --------------------------------- 窗口圆角 ---------------------------------

/** 窗口四角圆角（px），对应上左、上右、下右、下左 */
export interface WindowCorners {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

/** 默认圆角，与 Rust 端 WindowCorners::default 一致 */
const defaultCorners: WindowCorners = {
  topLeft: 5,
  topRight: 5,
  bottomRight: 5,
  bottomLeft: 5,
}

/** 设置窗口四角圆角（浏览器降级 no-op）
 * @param topLeft 左上角 px
 * @param topRight 右上角 px
 * @param bottomRight 右下角 px
 * @param bottomLeft 左下角 px
 */
export async function setWindowCorners(
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number
): Promise<void> {
  if (!isTauri) return
  await invoke("set_window_corners", { topLeft, topRight, bottomRight, bottomLeft })
}

/** 获取当前窗口四角圆角（浏览器返回默认值）
 * @returns 四角圆角对象
 */
export async function getWindowCorners(): Promise<WindowCorners> {
  return isTauri ? invoke("get_window_corners") : defaultCorners
}

/** 监听窗口圆角变化（浏览器返回空取消函数）
 * @param callback 圆角变化回调
 * @returns 取消监听函数
 */
export function onWindowCornersChange(
  callback: (corners: WindowCorners) => void
): Promise<() => void> {
  if (!isTauri) return Promise.resolve(() => {})
  return listen<WindowCorners>("window-corners-changed", (event) => callback(event.payload))
}

// --------------------------------- sidecar 令牌 ---------------------------------

/** 令牌缓存（仅首次 invoke） */
let tokenPromise: Promise<string> | null = null

/** 获取 sidecar 访问令牌（结果缓存；浏览器环境降级为空串）
 * @returns 令牌；开发模式或浏览器环境为空串
 */
export function sidecarToken(): Promise<string> {
  return (tokenPromise ??= isTauri
    ? invoke<string>("sidecar_token").catch((e) => {
        console.warn("[tauri] sidecar_token 获取失败，降级为空串:", e)
        return ""
      })
    : Promise.resolve(""))
}

// --------------------------------- 窗口状态 ---------------------------------

/** 窗口状态：最大化标志 + 四角圆角 */
export interface WindowState {
  /** 是否最大化 */
  isMaximized: boolean
  /** 四角圆角 */
  corners: WindowCorners
}

/** 订阅窗口状态（App 与 TitleBar 共用的单一订阅源；浏览器环境恒为默认值）
 * @returns 当前窗口状态
 */
export function useWindowState(): WindowState {
  const [isMaximized, setIsMaximized] = useState(false)
  const [corners, setCorners] = useState(defaultCorners)

  /** 初始同步一次，随后跟随 resize 与圆角广播更新 */
  useEffect(() => {
    if (!appWindow) return
    const syncMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized())
    }
    syncMaximized()
    getWindowCorners().then(setCorners).catch(() => {})
    const unlistenResize = appWindow.onResized(syncMaximized)
    const unlistenCorners = onWindowCornersChange(setCorners)
    return () => {
      unlistenResize.then((fn) => fn())
      unlistenCorners.then((fn) => fn())
    }
  }, [])

  return { isMaximized, corners }
}
