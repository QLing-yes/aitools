// 自定义标题栏：侧栏三态开关/前进后退 + 拖动区域 + 主题切换 + 窗口控制

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { SidebarCycleTrigger } from "@/components/layout/sidebar-cycle-trigger"
import { ThemeMenu } from "@/components/layout/theme-menu"
import { WindowControls } from "@/components/layout/window-controls"
import { WindowDragRegion } from "@/components/layout/window-drag-region"
import { WindowPin } from "@/components/layout/window-pin"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHistoryNav } from "@/hooks/use-history-nav"

export function TitleBar() {
  const navigate = useNavigate()
  const { canGoBack, canGoForward } = useHistoryNav()

  return (
    <header
      data-slot="title-bar"
      className="flex h-10 shrink-0 items-center justify-between select-none"
    >
      {/* 左侧：侧栏开关、后退、前进（no-drag 保持按钮可点击） */}
      <div className="flex items-center gap-0.5 pl-2 [-webkit-app-region:no-drag]">
        <SidebarCycleTrigger />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="chrome"
                size="icon"
                disabled={!canGoBack}
                onClick={() => navigate(-1)}
              />
            }
          >
            <ArrowLeftIcon className="size-4 shrink-0" />
          </TooltipTrigger>
          <TooltipContent>后退</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="chrome"
                size="icon"
                disabled={!canGoForward}
                onClick={() => navigate(1)}
              />
            }
          >
            <ArrowRightIcon className="size-4 shrink-0" />
          </TooltipTrigger>
          <TooltipContent>前进</TooltipContent>
        </Tooltip>
      </div>

      {/* 中间：拖动区域（左键拖动、双击切换最大化） */}
      <WindowDragRegion />

      {/* 右侧：主题切换 + 窗口置顶 + 窗口控制（窗口按钮仅桌面端；no-drag 保持可点击） */}
      <div className="flex items-center gap-0.5 pr-2 [-webkit-app-region:no-drag]">
        <ThemeMenu />
        <WindowPin />
        <WindowControls />
      </div>
    </header>
  )
}
