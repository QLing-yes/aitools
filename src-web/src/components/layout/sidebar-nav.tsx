// 侧边栏导航：路由项集合，桌面端专属项按 isTauri 过滤

import { BotIcon, HomeIcon, KeyRoundIcon, WorkflowIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { isTauri } from "@/lib/tauri"

/** 导航项 @property to 路由路径 @property label 显示文本 @property icon 图标组件 */
type NavItem = { to: string; label: string; icon: typeof HomeIcon }

/** 全部导航项；桌面端专属项仅 isTauri 时注入 */
const navItems: NavItem[] = [
  { to: "/", label: "首页", icon: HomeIcon },
  { to: "/chat", label: "AI 对话", icon: BotIcon },
  { to: "/flow", label: "流程测试", icon: WorkflowIcon },
  ...(isTauri
    ? [{ to: "/test", label: "鉴权测试", icon: KeyRoundIcon } as NavItem]
    : []),
]

/** 导航区 @param tooltip 图标折叠态是否显示右侧项名提示（悬浮面板等全宽场景传 false） */
export function SidebarNav({ tooltip = true }: { tooltip?: boolean }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>导航</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              render={<NavLink to={item.to} />}
              isActive={
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to)
              }
              tooltip={tooltip ? item.label : undefined}
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
