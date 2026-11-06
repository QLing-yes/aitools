// 主题切换按钮：点击循环 浅色→深色→跟随系统；悬停提示下次点击将切换到的模式
// 反馈分层：按钮图标/提示走本地乐观档（点击当帧生效），配色与动画走切换事务（后续任务）

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useState } from "react"

import { useTheme, type Theme } from "@/components/theme-provider"
import { IconAction } from "@/components/layout/icon-action"
import { startThemeTransition } from "@/lib/theme-transition"

/** 循环顺序：浅色→深色→跟随系统→浅色 */
const nextTheme: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
}

/** 各模式中文提示 */
const themeLabel: Record<Theme, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
}

/** 各模式按钮图标（跟随系统用显示器示意） */
const themeIcon: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
}

export function ThemeMenu() {
  const { theme, setTheme } = useTheme()
  /** 乐观档：点击当帧先换图标与提示（事务回调要到后续任务才执行，否则点了毫无反馈） */
  const [pending, setPending] = useState<Theme | null>(null)
  /** 展示档：乐观优先，provider 追上后交还 */
  const shown = pending ?? theme

  /** 循环切换：乐观档先占一帧，切换事务排到下一个任务（快照捕获与按钮重绘不挤同帧） */
  const cycle = (e: React.MouseEvent) => {
    const { clientX: x, clientY: y } = e
    const next = nextTheme[shown]
    const previous = theme
    setPending(next)
    window.setTimeout(() => {
      startThemeTransition({
        // 与 setTheme 同批次清空，图标不会闪回旧档
        apply: () => {
          setTheme(next)
          setPending(null)
        },
        rollback: () => {
          setPending(null)
          setTheme(previous)
        },
        x,
        y,
      })
    }, 0)
  }

  const Icon = themeIcon[shown]

  return (
    <IconAction
      hint={`切换到${themeLabel[nextTheme[shown]]}`}
      button={{ onClick: cycle }}
    >
      <Icon className="size-4 shrink-0" />
    </IconAction>
  )
}
