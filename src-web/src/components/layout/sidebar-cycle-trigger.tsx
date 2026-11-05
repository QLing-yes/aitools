// 侧栏三态开关：完全显示 → 图标折叠 → 完全隐藏 循环；提示文案描述下一次点击的效果

import { EyeOffIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUiStore, type SidebarMode } from "@/store/ui"

/** 当前状态 → 下一次点击的效果提示 */
const nextHint: Record<SidebarMode, string> = {
  expanded: "折叠侧边栏",
  icon: "隐藏侧边栏",
  hidden: "显示侧边栏",
}

/** 当前状态 → 按钮图标（表现下一次点击的动作） */
const nextIcon: Record<SidebarMode, typeof PanelLeftCloseIcon> = {
  expanded: PanelLeftCloseIcon,
  icon: EyeOffIcon,
  hidden: PanelLeftOpenIcon,
}

export function SidebarCycleTrigger() {
  const { isMobile, openMobile, toggleSidebar } = useSidebar()
  const sidebarMode = useUiStore((s) => s.sidebarMode)
  const cycleSidebarMode = useUiStore((s) => s.cycleSidebarMode)
  const setSidebarMode = useUiStore((s) => s.setSidebarMode)

  /** 桌面端走三态循环；移动端抽屉不受折叠态影响，仅负责开合 */
  const handleClick = () => {
    if (!isMobile) return cycleSidebarMode()
    if (sidebarMode === "hidden") {
      // 隐藏态下抽屉组件未挂载，先恢复挂载再打开
      setSidebarMode("expanded")
      toggleSidebar()
    } else {
      toggleSidebar()
    }
  }

  /** 移动端语义是抽屉开合，提示/图标跟随 openMobile；隐藏态预告"显示侧边栏" */
  const mobileOpen = sidebarMode !== "hidden" && !openMobile
  const Icon = isMobile
    ? openMobile
      ? PanelLeftCloseIcon
      : PanelLeftOpenIcon
    : nextIcon[sidebarMode]
  const hint = isMobile
    ? sidebarMode === "hidden"
      ? "显示侧边栏"
      : mobileOpen
        ? "打开侧边栏"
        : "关闭侧边栏"
    : nextHint[sidebarMode]

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="chrome" size="icon" onClick={handleClick} />}
      >
        <Icon className="size-4 shrink-0" />
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}
