// 全局 UI 状态：zustand + persist（localStorage 落盘，跨重启保留）
// 约定：跨组件共享且需要持久化的状态放这里；组件内瞬时状态用 useState，不落盘

import { create } from "zustand"
import { persist } from "zustand/middleware"

/** 侧栏显示模式：完全显示 / 图标折叠 / 完全隐藏 */
export type SidebarMode = "expanded" | "icon" | "hidden"

/** 三态循环顺序：显示 → 折叠 → 隐藏 → 显示 */
const modeNext: Record<SidebarMode, SidebarMode> = {
  expanded: "icon",
  icon: "hidden",
  hidden: "expanded",
}

/** 持久化的 UI 状态字段与行为 */
interface UiState {
  /** 侧栏当前显示模式 */
  sidebarMode: SidebarMode
  /** 设置侧栏模式 @param mode 目标模式 */
  setSidebarMode: (mode: SidebarMode) => void
  /** 按 显示→折叠→隐藏 顺序切换下一模式 */
  cycleSidebarMode: () => void
  /** 侧栏展开宽度（px，拖拽调节后持久化） */
  sidebarWidth: number
  /** 设置侧栏宽度 @param width 像素宽度 */
  setSidebarWidth: (width: number) => void
}

/** v0→v1 迁移：二态 sidebarCollapsed 映射三态，丢弃旧字段 */
function migrateUiState(
  persisted: unknown
): Pick<UiState, "sidebarMode" | "sidebarWidth"> {
  const s = (persisted ?? {}) as Partial<UiState> & {
    sidebarCollapsed?: boolean
  }
  return {
    sidebarMode:
      s.sidebarMode ?? (s.sidebarCollapsed ? ("icon" as const) : "expanded"),
    sidebarWidth: s.sidebarWidth ?? 256,
  }
}

/** 全局 UI store；仅数据字段序列化到 localStorage（函数值自动跳过） */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarMode: "expanded",
      setSidebarMode: (mode) => set({ sidebarMode: mode }),
      cycleSidebarMode: () =>
        set((s) => ({ sidebarMode: modeNext[s.sidebarMode] })),
      sidebarWidth: 256,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
    }),
    { name: "aitools-ui", version: 1, migrate: migrateUiState }
  )
)
