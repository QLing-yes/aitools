// 标题栏窗口置顶开关：仅桌面端渲染；置顶不随 window-state 持久化，重启默认未置顶，挂载时查询回显真实 OS 态

import { PinIcon, PinOffIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  isAlwaysOnTop,
  isTauri,
  setAlwaysOnTop,
} from "@/lib/tauri"

export function WindowPin() {
  /** 当前是否置顶 */
  const [pinned, setPinned] = useState(false)

  // 启动时同步真实状态（含插件恢复的置顶态）
  useEffect(() => {
    if (!isTauri) return
    isAlwaysOnTop()
      .then(setPinned)
      .catch(() => {})
  }, [])

  /** 切换置顶：成功才回写状态，失败保持原样并留痕 */
  const toggle = () => {
    const next = !pinned
    setAlwaysOnTop(next)
      .then(() => setPinned(next))
      .catch((e) => console.error("[tauri] setAlwaysOnTop failed:", e))
  }

  if (!isTauri) return null

  const Icon = pinned ? PinOffIcon : PinIcon

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="chrome"
            size="icon"
            aria-pressed={pinned}
            onClick={toggle}
          />
        }
      >
        <Icon className="size-4 shrink-0" />
      </TooltipTrigger>
      <TooltipContent>{pinned ? "取消置顶" : "窗口置顶"}</TooltipContent>
    </Tooltip>
  )
}
