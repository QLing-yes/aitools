import { NavLink, Outlet } from "react-router"
import { TitleBar } from "@/components/TitleBar"
import { useUiStore } from "@/store/ui"
import { isTauri, useWindowState } from "@/lib/tauri"

/** 左侧边栏菜单项（鉴权测试依赖桌面端 sidecar，仅桌面显示） */
const navItems = [
  { to: "/", label: "首页" },
  ...(isTauri ? [{ to: "/test", label: "鉴权测试" }] : []),
]

/** 菜单项基础样式 */
const navClass =
  "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"

/** 菜单项激活样式 */
const navActiveClass = "bg-accent font-medium text-accent-foreground"

/**
 * 应用布局：圆角窗口容器 + TitleBar + 左侧边栏导航 + 页面出口
 */
export function App() {
  const { isMaximized, corners } = useWindowState()
  /** 侧栏是否折叠（zustand persist，宽度联动） */
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)

  /** 最大化时圆角归零，避免遮挡任务栏 */
  const radius = isMaximized
    ? "0"
    : `${corners.topLeft}px ${corners.topRight}px ${corners.bottomRight}px ${corners.bottomLeft}px`

  return (
    <div
      style={{ borderRadius: radius }}
      className="flex h-full flex-col overflow-hidden bg-[#F9FAFB]"
    >
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        {/* 左侧边栏导航（折叠时完全隐藏，背景透明露出项目底色） */}
        <nav
          className={`flex shrink-0 flex-col gap-1 overflow-hidden transition-[width,padding] duration-200 ${sidebarCollapsed ? "w-0 p-0" : "w-36 p-2"}`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              title={item.label}
              className={({ isActive }) => (isActive ? `${navClass} ${navActiveClass}` : navClass)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 页面内容（左上圆角白底，其余背景透明） */}
        <main className="min-h-0 flex-1 overflow-auto rounded-tl-lg bg-white p-6 text-sm leading-loose">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default App
