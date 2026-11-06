// 设置页：官方 Tabs 分区导航 + 面板；≥768（与侧栏 md 同档）用 shadcn resizable 可拖左右分栏
// 快捷键数据源为 shortcuts/registry（单一来源）

import { KeyboardIcon } from "lucide-react"
import { Fragment, useState } from "react"
import { useDefaultLayout } from "react-resizable-panels"

import { PageCanvas } from "@/components/layout/page-canvas"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd } from "@/components/ui/kbd"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { effectiveShortcuts, entryText } from "@/shortcuts/registry"
import { cn } from "cn"

/** 设置分区清单；新增分区在此登记即可（导航与面板自动出自该表） */
const sections = [
  { id: "shortcuts", label: "快捷键", icon: KeyboardIcon },
] as const

/** 分区菜单默认/最小/最大宽度（v4 Panel 像素尺寸字符串） */
const NAV_DEFAULT = "176px"
const NAV_MIN = "140px"
const NAV_MAX = "320px"

/** 快捷键面板：官方 Item 列表 + Kbd 键位；拦截类条目置灰 */
function ShortcutsPanel() {
  return (
    <ItemGroup className="gap-0">
      {effectiveShortcuts().map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <ItemSeparator className="my-0" />}
          <Item size="sm" className="flex-nowrap rounded-none border-0 px-0">
            <ItemContent>
              <ItemTitle
                className={cn(
                  "font-normal",
                  s.kind === "block" && "text-muted-foreground"
                )}
              >
                {s.action}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Kbd className="whitespace-nowrap px-1.5">{entryText(s)}</Kbd>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  )
}

/** 单分区面板 @param id 分区 id @param label 分区标题 */
function SectionPanel({ id, label }: { id: string; label: string }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{label}</h2>
        {id === "shortcuts" && <ShortcutsPanel />}
      </div>
    </ScrollArea>
  )
}

export function SettingsPage() {
  const [active, setActive] = useState<string>("shortcuts")
  /** 窄档竖排堆叠、宽档可拖分栏；同一时刻只挂载一个 TabsList，故 Tabs 根不重复 */
  const isMobile = useIsMobile()
  /** 分栏布局持久化（localStorage，仅用户拖动才写） */
  const layout = useDefaultLayout({
    id: "aitools-settings-split",
    onlySaveAfterUserInteractions: true,
  })
  /** 切换分区（Tabs 值为弱类型，收口成 string） */
  const pick = (v: unknown) => setActive(String(v))

  /** 导航触发器集合（两档布局共用） */
  const triggers = sections.map((sec) => (
    <TabsTrigger
      key={sec.id}
      value={sec.id}
      className="flex-none justify-start"
    >
      <sec.icon />
      {sec.label}
    </TabsTrigger>
  ))

  /** 分区面板集合（Base UI 仅挂载激活项） */
  const panels = sections.map((sec) => (
    <TabsContent key={sec.id} value={sec.id} className="h-full min-w-0">
      <SectionPanel id={sec.id} label={sec.label} />
    </TabsContent>
  ))

  if (isMobile) {
    return (
      <PageCanvas>
        <Tabs
          value={active}
          onValueChange={pick}
          className="h-full min-h-0 gap-0"
        >
          <TabsList variant="line" className="justify-start px-3">
            {triggers}
          </TabsList>
          <Separator />
          {panels}
        </Tabs>
      </PageCanvas>
    )
  }

  return (
    <PageCanvas>
      <Tabs
        orientation="vertical"
        value={active}
        onValueChange={pick}
        className="h-full min-h-0 gap-0"
      >
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={layout.defaultLayout}
          onLayoutChanged={layout.onLayoutChanged}
          className="h-full min-h-0"
        >
          <ResizablePanel
            id="settings-nav"
            defaultSize={NAV_DEFAULT}
            minSize={NAV_MIN}
            maxSize={NAV_MAX}
          >
            <TabsList
              variant="line"
              className="h-full w-full items-start justify-start p-3"
            >
              {triggers}
            </TabsList>
          </ResizablePanel>
          {/* 手柄线由 index.scss 的 [data-slot=resizable-handle]::before 绘制（CLI 包装不渲染 children） */}
          <ResizableHandle className="cursor-col-resize border-0 bg-transparent" />
          <ResizablePanel className="min-w-0">{panels}</ResizablePanel>
        </ResizablePanelGroup>
      </Tabs>
    </PageCanvas>
  )
}
