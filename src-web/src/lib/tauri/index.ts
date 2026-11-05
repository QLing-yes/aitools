import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useSyncExternalStore } from "react"

/** 是否运行在 Tauri 环境（纯 web 部署时为 false，所有窗口能力降级为 no-op/默认值） */
export const isTauri = "__TAURI_INTERNALS__" in window

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

/** 设置窗口总是置顶（浏览器降级 no-op）
 * @param on 是否置顶 */
export async function setAlwaysOnTop(on: boolean): Promise<void> {
  await appWindow?.setAlwaysOnTop(on)
}

/** 查询窗口是否置顶（浏览器返回 false）
 * @returns 是否置顶 */
export async function isAlwaysOnTop(): Promise<boolean> {
  return appWindow ? appWindow.isAlwaysOnTop() : Promise.resolve(false)
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

/** 监听 sidecar 意外退出（浏览器返回空取消函数）
 * @param callback 退出回调 @param code 退出码（信号终止时为 null）
 * @returns 取消监听函数 Promise */
export function onSidecarTerminated(
  callback: (code: number | null) => void
): Promise<() => void> {
  if (!isTauri) return Promise.resolve(() => {})
  return listen<number | null>("sidecar-terminated", (e) => callback(e.payload))
}

/** 窗口状态：最大化标志 + 四角圆角 + CSS border-radius 串 */
export interface WindowState {
  /** 是否最大化 */
  isMaximized: boolean
  /** 四角圆角 */
  corners: WindowCorners
  /** 直接可用的 border-radius：最大化时为 0（避免遮挡任务栏），否则四角拼接 */
  radius: string
}

/** 订阅窗口状态（模块级单源：全应用一条 IPC/事件链，useSyncExternalStore 共享快照）
 * @returns 当前窗口状态
 */

/** 全局唯一快照（不可变对象，变更时整体替换） */
let windowSnapshot: WindowSnapshot = { isMaximized: false, corners: defaultCorners }
const windowListeners = new Set<() => void>()
/** 是否已建立全局订阅（仅 Tauri 环境） */
let windowSubscribed = false

/** 窗口状态原始快照（不含派生 radius） */
interface WindowSnapshot {
  /** 是否最大化 */
  isMaximized: boolean
  /** 四角圆角 */
  corners: WindowCorners
}

function emitWindow(next: WindowSnapshot) {
  windowSnapshot = next
  windowListeners.forEach((l) => l())
}

/** 首次消费时建立全局订阅：初始同步 + resize 最大化探测 + 圆角广播 */
function ensureWindowSubscription(): void {
  if (windowSubscribed || !appWindow) return
  windowSubscribed = true
  const win = appWindow
  win
    .isMaximized()
    .then((v) => emitWindow({ ...windowSnapshot, isMaximized: v }))
    .catch(() => {})
  getWindowCorners()
    .then((c) => emitWindow({ ...windowSnapshot, corners: c }))
    .catch(() => {})
  // 事件回调不被 await：内部自吞异常，IPC 失败跳过本次同步，下次 resize 再覆盖
  win
    .onResized(async () => {
      try {
        const v = await win.isMaximized()
        // 值未变化跳过广播：拖窗期间 resize 高频，避免无谓 re-render
        if (v !== windowSnapshot.isMaximized)
          emitWindow({ ...windowSnapshot, isMaximized: v })
      } catch {
        /* 忽略：窗口销毁竞态等场景 */
      }
    })
    .catch(() => {})
  onWindowCornersChange((c) => emitWindow({ ...windowSnapshot, corners: c })).catch(
    () => {},
  )
}

function subscribeWindow(cb: () => void): () => void {
  windowListeners.add(cb)
  ensureWindowSubscription()
  return () => windowListeners.delete(cb)
}

export function useWindowState(): WindowState {
  const snap = useSyncExternalStore(subscribeWindow, () => windowSnapshot)
  /** border-radius 串：最大化归零，其余四角拼接（浏览器恒为默认圆角） */
  const radius = snap.isMaximized
    ? "0"
    : `${snap.corners.topLeft}px ${snap.corners.topRight}px ${snap.corners.bottomRight}px ${snap.corners.bottomLeft}px`
  return { ...snap, radius }
}
