// 侧栏底部用户区：头像+用户名+设置icon；点击弹出操作菜单（登录态、设置、明暗切换）

import {
  ContrastIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { useNavigate } from "react-router"

import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { startThemeTransition } from "@/lib/theme-transition"
import { useAuthStore } from "@/store/auth"

/** 菜单关闭动画时长：等菜单消失后再启动过渡，避免打开中的菜单被拍进旧快照 */
const MENU_CLOSE_MS = 120

export function SidebarUser() {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  const username = useAuthStore((s) => s.username)
  const logout = useAuthStore((s) => s.logout)

  /** 明暗切换：圆形揭示动画，起点为点击点 */
  const toggleWithTransition = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    window.setTimeout(
      () => startThemeTransition(toggleTheme, clientX, clientY),
      MENU_CLOSE_MS
    )
  }

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {/* 头像占位：用户名首字符，未登录用图标 */}
                  {username ? (
                    username.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon className="size-4 shrink-0" />
                  )}
                </AvatarFallback>
              </Avatar>
              {/* 折叠成图标时名称与设置图标淡出，仅留头像 */}
              <div className="grid flex-1 text-left text-sm leading-tight transition-opacity group-data-[collapsible=icon]:opacity-0">
                <span className="truncate font-semibold">
                  {username ?? "未登录"}
                </span>
              </div>
              <SettingsIcon className="ml-auto size-4 shrink-0 transition-opacity group-data-[collapsible=icon]:opacity-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="min-w-56 rounded-lg"
            >
              <DropdownMenuItem onClick={toggleWithTransition}>
                <ContrastIcon className="size-4 shrink-0" />
                明暗切换
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <SettingsIcon className="size-4 shrink-0" />
                设置
              </DropdownMenuItem>
              {username ? (
                <DropdownMenuItem onClick={logout}>
                  <LogOutIcon className="size-4 shrink-0" />
                  退出登录
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  <LogInIcon className="size-4 shrink-0" />
                  去登录
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
