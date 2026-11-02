import { useState } from "react"
import { Button } from "@/components/ui/button"
import { request } from "@/lib/request"

export function App() {
  const [result, setResult] = useState("")

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

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div>
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
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
