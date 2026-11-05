// 快捷键单一来源：热键模块引用键名常量，设置页引用条目清单展示

import { isTauri } from "@/lib/tauri"

/** 侧栏三态循环组合键（sidebar-hotkey 与清单同源） */
export const SIDEBAR_HOTKEY_KEY = "b"

/** 快捷键条目 @property keys 键/操作文本 @property action 效果 @property platform 生效端 @property blocked 拦截类（禁用系统默认行为） */
export interface ShortcutEntry {
  keys: string
  action: string
  /** all=桌面+浏览器均生效；desktop=仅 Tauri */
  platform: "all" | "desktop"
  blocked?: boolean
}

/** 全部生效快捷键条目；新增热键必须在此登记（设置页数据源） */
const shortcutEntries: ShortcutEntry[] = [
  {
    keys: "Ctrl/⌘ + B",
    action: "侧栏 显示→折叠→隐藏 三态循环（移动视口为抽屉开合）",
    platform: "all",
  },
  { keys: "F11", action: "窗口最大化/还原切换", platform: "desktop" },
  { keys: "双击标题栏", action: "最大化/还原（鼠标与触摸均可）", platform: "desktop" },
  { keys: "右键", action: "上下文菜单已禁用", platform: "desktop", blocked: true },
  { keys: "F5 / Ctrl+R", action: "页面刷新已禁用", platform: "desktop", blocked: true },
]

/** 当前运行环境实际生效的快捷键清单
 * @returns 按端过滤后的条目数组 */
export function effectiveShortcuts(): ShortcutEntry[] {
  return shortcutEntries.filter((e) => e.platform === "all" || isTauri)
}
