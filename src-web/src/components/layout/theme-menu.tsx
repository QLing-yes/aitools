// 主题切换按钮：点击循环 浅色→深色→跟随系统；悬停提示下次点击将切换到的模式

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

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

  /** 循环切换：圆形揭示动画锚定点击点 */
  const cycle = (e: React.MouseEvent) => {
    startThemeTransition(() => setTheme(nextTheme[theme]), e.clientX, e.clientY)
  }

  const Icon = themeIcon[theme]

  return (
    <IconAction
      hint={`切换到${themeLabel[nextTheme[theme]]}`}
      button={{ onClick: cycle }}
    >
      <Icon className="size-4 shrink-0" />
    </IconAction>
  )
}
