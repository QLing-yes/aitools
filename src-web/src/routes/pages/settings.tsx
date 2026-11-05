// 设置页：分区菜单 + 面板；桌面档用 shadcn resizable 可拖分栏（autoSaveId 记忆比例）
// 快捷键数据源为 shortcuts/registry（单一来源）

import { KeyboardIcon } from "lucide-react"
import { useState } from "react"
import { useDefaultLayout } from "react-resizable-panels"

import { Button } from "@/components/ui/button"
import { PageCanvas } from "@/components/layout/page-canvas"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { effectiveShortcuts } from "@/shortcuts/registry"
import { cn } from "cn"

/** 设置分区清单；新增分区在此登记 + 增加对应面板分支 */
const sections = [
  { id: "shortcuts", label: "快捷键", icon: KeyboardIcon },
] as const

/** 分区菜单默认/最小/最大宽度（v4 Panel 像素尺寸字符串） */
const NAV_DEFAULT = "176px"
const NAV_MIN = "140px"
const NAV_MAX = "320px"

/** 键位展示块 */
function KeyCap({ text }: { text: string }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs whitespace-nowrap">
      {text}
    </span>
  )
}

/** 快捷键面板：逐条 效果 + 键位；拦截类条目置灰 */
function ShortcutsPanel() {
  return (
    <div className="flex flex-col">
      {effectiveShortcuts().map((s, i) => (
        <div key={s.keys}>
          {i > 0 && <Separator />}
          <div className="flex items-center justify-between gap-3 py-3 sm:gap-6">
            <span
              className={cn("text-sm", s.blocked && "text-muted-foreground")}
            >
              {s.action}
            </span>
            <KeyCap text={s.keys} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 分区面板内容 @param active 当前分区 id */
function SectionBody({ active }: { active: string }) {
  return (
    <div className="h-full min-w-0 overflow-auto p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {sections.find((s) => s.id === active)?.label}
      </h2>
      {active === "shortcuts" && <ShortcutsPanel />}
    </div>
  )
}

/** 分区菜单按钮组 @param active 当前分区 @param onPick 切换分区 */
function SectionNav({
  active,
  onPick,
}: {
  active: string
  onPick: (id: string) => void
}) {
  return (
    <nav className="flex shrink-0 gap-1 p-3 sm:w-full sm:flex-col sm:gap-1 sm:p-4">
      {sections.map((sec) => (
        <Button
          key={sec.id}
          variant="chrome"
          aria-current={active === sec.id ? "true" : undefined}
          className="justify-start"
          onClick={() => onPick(sec.id)}
        >
          <sec.icon className="size-4 shrink-0" />
          {sec.label}
        </Button>
      ))}
    </nav>
  )
}

export function SettingsPage() {
  const [active, setActive] = useState<string>("shortcuts")
  /** 分栏布局持久化（localStorage，仅用户拖动才写） */
  const layout = useDefaultLayout({
    id: "aitools-settings-split",
    onlySaveAfterUserInteractions: true,
  })

  return (
    <PageCanvas>
      {/* 手机档：竖排堆叠 */}
      <div className="flex h-full min-h-0 flex-col sm:hidden">
        <SectionNav active={active} onPick={setActive} />
        <Separator />
        <div className="min-h-0 flex-1">
          <SectionBody active={active} />
        </div>
      </div>

      {/* sm+ 档：shadcn resizable 可拖分栏（像素布局经 useDefaultLayout 持久化到 localStorage） */}
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
        className="hidden h-full min-h-0 sm:flex"
      >
        <ResizablePanel
          id="settings-nav"
          defaultSize={NAV_DEFAULT}
          minSize={NAV_MIN}
          maxSize={NAV_MAX}
        >
          <SectionNav active={active} onPick={setActive} />
        </ResizablePanel>
        {/* 手柄线由 index.scss 的 [data-slot=resizable-handle]::before 绘制（CLI 包装不渲染 children） */}
        <ResizableHandle className="cursor-col-resize border-0 bg-transparent" />
        <ResizablePanel>
          <SectionBody active={active} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </PageCanvas>
  )
}
