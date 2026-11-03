import { NavLink, Outlet } from "react-router"
import { TitleBar } from "@/components/TitleBar"
import { useWindowState } from "@/lib/tauri"

/** 左侧边栏菜单项 */
const navItems = [
  { to: "/", label: "首页" },
  { to: "/test", label: "鉴权测试" },
]

/** 菜单项基础样式 */
const navClass =
  "rounded-md px-3 py-1.5 text-sm transition-colors text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"

/** 菜单项激活样式 */
const navActiveClass = "bg-accent font-medium text-accent-foreground"

/**
 * 应用布局：圆角窗口容器 + TitleBar + 左侧边栏导航 + 页面出口
 */
export function App() {
  const { isMaximized, corners } = useWindowState()

  /** 最大化时圆角归零，避免遮挡任务栏 */
  const radius = isMaximized
    ? "0"
    : `${corners.topLeft}px ${corners.topRight}px ${corners.bottomRight}px ${corners.bottomLeft}px`

  return (
    <div
      style={{ borderRadius: radius }}
      className="flex h-full flex-col overflow-hidden bg-background"
    >
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        {/* 左侧边栏导航 */}
        <nav className="flex w-36 shrink-0 flex-col gap-1 border-r p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? `${navClass} ${navActiveClass}` : navClass)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 页面内容 */}
        <main className="min-h-0 flex-1 overflow-auto p-6 text-sm leading-loose">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default App
