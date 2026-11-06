// 设置页：官方 Tabs 分区导航 + 面板；≥768（与侧栏 md 同档）用 shadcn resizable 可拖左右分栏
// 当前分区以 URL 的 `?section=` 为唯一事实（侧栏深链入口靠它）
// 快捷键数据源为 shortcuts/registry（单一来源）

import { KeyboardIcon, PaletteIcon, RotateCcwIcon } from "lucide-react"
import { Fragment } from "react"
import type { ComponentType } from "react"
import { useSearchParams } from "react-router"
import { useDefaultLayout } from "react-resizable-panels"

import { PageCanvas } from "@/components/layout/page-canvas"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { isTauri } from "@/lib/tauri"
import { STORAGE_KEYS } from "@/lib/storage"
import { effectiveShortcuts, entryText } from "@/shortcuts/registry"
import {
  BLUR_MAX,
  FILM_MAX,
  RADIUS_MAX,
  useUiStore,
  type CornerSide,
} from "@/store/ui"
import { cn } from "cn"

/** 分区 id 联合类型（URL 参数按此白名单校验，新增分区同步加一项） */
type SectionId = "shortcuts" | "personalize"

/** 分区登记项：一个分区的导航、面板与可选标题行动作 */
type SectionRow = {
  /** 分区 id（亦作 URL `?section=` 的合法值） */
  id: SectionId
  /** 导航与标题文案 */
  label: string
  /** 导航图标 */
  icon: ComponentType
  /** 分区内容 */
  Panel: ComponentType
  /** 标题行右侧动作（无则不占位） */
  action?: ComponentType
}

/** 取合法分区 id：URL 参数不可信，缺省或非法一律回落首项 @param value `section` 查询参数 @returns 分区 id */
function sectionIdOf(value: string | null): SectionId {
  return sections.some((sec) => sec.id === value)
    ? (value as SectionId)
    : sections[0].id
}

/** 分区菜单默认/最小/最大宽度（v4 Panel 像素尺寸字符串） */
const NAV_DEFAULT = "176px"
const NAV_MIN = "140px"
const NAV_MAX = "320px"

/** 窗口圆角落行顺序（左上起） */
const cornerRows = [
  { side: "topLeft", label: "左上角" },
  { side: "topRight", label: "右上角" },
  { side: "bottomLeft", label: "左下角" },
  { side: "bottomRight", label: "右下角" },
] as const satisfies ReadonlyArray<{ side: CornerSide; label: string }>

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

/** 滑杆数值统一取第一手柄（Base UI 的 value 可能是只读数组） */
function first(v: number | readonly number[]): number {
  return Number(Array.isArray(v) ? v[0] : v)
}

/** 设置页一行滑杆：标题 + 当前值 + 控件 + 可选说明 */
function SliderRow({
  id,
  label,
  value,
  unit,
  max,
  hint,
  onChange,
}: {
  /** 控件 id */
  id: string
  /** 标题 */
  label: string
  /** 当前值 */
  value: number
  /** 单位后缀 */
  unit: string
  /** 取值上限（下限恒 0） */
  max: number
  /** 说明文案，省略则不占行 */
  hint?: string
  /** 值变化回调 @param next 新值 */
  onChange: (next: number) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        <span className="text-muted-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </FieldLabel>
      <Slider
        id={id}
        value={[value]}
        min={0}
        max={max}
        step={1}
        onValueChange={(v) => onChange(first(v))}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

/** 个性化面板：内容面磨砂两旋钮 + 背景渐变开关 + 桌面端窗口四角圆角 */
function PersonalizePanel() {
  const glassBlur = useUiStore((s) => s.glassBlur)
  const setGlassBlur = useUiStore((s) => s.setGlassBlur)
  const glassFilm = useUiStore((s) => s.glassFilm)
  const setGlassFilm = useUiStore((s) => s.setGlassFilm)
  const bgWash = useUiStore((s) => s.bgWash)
  const setBgWash = useUiStore((s) => s.setBgWash)
  const corners = useUiStore((s) => s.corners)
  const setCorner = useUiStore((s) => s.setCorner)

  return (
    <FieldGroup className="max-w-md gap-6">
      <FieldSet>
        <FieldLegend>内容面磨砂</FieldLegend>
        <SliderRow
          id="glass-blur"
          label="模糊程度"
          value={glassBlur}
          unit="px"
          max={BLUR_MAX}
          hint="内容面自身的高斯模糊半径，0 为不糊；糊的是衬层透出的纹理"
          onChange={setGlassBlur}
        />
        <SliderRow
          id="glass-film"
          label="背景不透明度"
          value={glassFilm}
          unit="%"
          max={FILM_MAX}
          hint="内容面壳色的不透明度；衬层保持实心，100% 即无透出"
          onChange={setGlassFilm}
        />
      </FieldSet>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="bg-wash">背景渐变</FieldLabel>
        <Switch
          id="bg-wash"
          checked={bgWash}
          onCheckedChange={setBgWash}
        />
      </Field>
      {isTauri && (
        <FieldSet>
          <FieldLegend>窗口圆角</FieldLegend>
          <FieldDescription>
            四角各自半径，0 即直角；最大化时自动归零
          </FieldDescription>
          {cornerRows.map((row) => (
            <SliderRow
              key={row.side}
              id={`radius-${row.side}`}
              label={row.label}
              value={corners[row.side]}
              unit="px"
              max={RADIUS_MAX}
              onChange={(next) => setCorner(row.side, next)}
            />
          ))}
        </FieldSet>
      )}
    </FieldGroup>
  )
}

/** 个性化标题行右侧动作：一次把磨砂与四角圆角回默认档 */
function PersonalizeReset() {
  const resetPersonalize = useUiStore((s) => s.resetPersonalize)

  return (
    <Button size="sm" variant="outline" onClick={resetPersonalize}>
      <RotateCcwIcon className="size-4 shrink-0" />
      重置
    </Button>
  )
}

/** 设置分区清单：导航、面板与标题行动作全部出自此表，新增分区在此登记即可 */
const sections: readonly SectionRow[] = [
  {
    id: "shortcuts",
    label: "快捷键",
    icon: KeyboardIcon,
    Panel: ShortcutsPanel,
  },
  {
    id: "personalize",
    label: "个性化",
    icon: PaletteIcon,
    Panel: PersonalizePanel,
    action: PersonalizeReset,
  },
]

/** 单分区面板：标题行（左标题、右动作）+ 分区内容 @param sec 分区登记项 */
function SectionPanel({ sec }: { sec: SectionRow }) {
  const { label, Panel, action: Action } = sec

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{label}</h2>
          {Action && <Action />}
        </div>
        <Panel />
      </div>
    </ScrollArea>
  )
}

export function SettingsPage() {
  /** 分区状态以 URL 查询参数为唯一事实（侧栏可直接 `?section=personalize` 深链进入） */
  const [params, setParams] = useSearchParams()
  /** 当前分区 */
  const active = sectionIdOf(params.get("section"))
  /** 切换分区：replace 改写 URL，不往历史栈灌条目；Tabs 值为弱类型，先收口成 string */
  const pick = (v: unknown) =>
    setParams({ section: String(v) }, { replace: true })
  /** 窄档竖排堆叠、宽档可拖分栏；同一时刻只挂载一个 TabsList，故 Tabs 根不重复 */
  const isMobile = useIsMobile()
  /** 分栏布局持久化（键为 react-resizable-panels:<id>，仅用户拖动才写） */
  const layout = useDefaultLayout({
    id: STORAGE_KEYS.settingsLayout,
    onlySaveAfterUserInteractions: true,
  })

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
      <SectionPanel sec={sec} />
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
          <ResizablePanel id="settings-content" className="min-w-0">
            {panels}
          </ResizablePanel>
        </ResizablePanelGroup>
      </Tabs>
    </PageCanvas>
  )
}
