import { useEffect, useState } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { Button } from "@/components/ui/button"
import { TitleBar } from "@/components/TitleBar"
import { request } from "@/lib/request"
import { getWindowCorners, onWindowCornersChange, type WindowCorners } from "@/lib/windowCorners"

export function App() {
  const [result, setResult] = useState("")
  const [isMaximized, setIsMaximized] = useState(false)
  const [corners, setCorners] = useState<WindowCorners>({ topLeft: 5, topRight: 5, bottomRight: 5, bottomLeft: 5 })
  const appWindow = getCurrentWindow()

  /** 同步窗口最大化状态与圆角状态 */
  useEffect(() => {
    const syncMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized())
    }
    syncMaximized()
    getWindowCorners().then(setCorners).catch(() => {})
    const unlistenResize = appWindow.onResized(syncMaximized)
    const unlistenCorners = onWindowCornersChange(setCorners)
    return () => {
      unlistenResize.then((fn) => fn())
      unlistenCorners.then((fn) => fn())
    }
  }, [])

  /** 测试 sidecar token 鉴权链路：401 表示令牌未通过，200/500 表示已穿过守卫到达业务层 */
  const testToken = async () => {
    const url = `${import.meta.env.VITE_API_URL}/success`
    setResult(`请求中... ${url}`)
    try {
      const res = await request(url, { method: "POST" })
      const body = await res.text()
      setResult(`${res.status} ${res.statusText}\n${body.slice(0, 300)}`)
    } catch (err) {
      setResult(`请求失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

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
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-6 text-sm leading-loose">
        <div className="max-w-md">
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="max-w-md">
          <h2 className="font-medium">Sidecar 鉴权测试</h2>
          <Button className="mt-2" variant="secondary" onClick={testToken}>
            测试 Token 调用 POST /success
          </Button>
          {result && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md border bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
              {result}
            </pre>
          )}
        </div>
        <div className="max-w-md font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </main>
    </div>
  )
}

export default App
