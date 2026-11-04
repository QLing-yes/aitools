// 全局 UI 状态：zustand + persist（localStorage 落盘，跨重启保留）
// 约定：跨组件共享且需要持久化的状态放这里；组件内瞬时状态用 useState，不落盘

import { create } from "zustand"
import { persist } from "zustand/middleware"

/** 持久化的 UI 状态字段与行为 */
interface UiState {
  /** 侧栏是否折叠 */
  sidebarCollapsed: boolean
  /** 设置侧栏折叠状态 @param collapsed 是否折叠 */
  setSidebarCollapsed: (collapsed: boolean) => void
}

/** 全局 UI store；仅 sidebarCollapsed 序列化到 localStorage（函数值自动跳过） */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: "aitools-ui" }
  )
)
