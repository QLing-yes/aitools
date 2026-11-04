import { useState } from "react"
import { Button } from "@/components/ui/button"
import { client } from "@/api"

/** 鉴权测试页：sidecar token 链路验证 */
export function TestTokenPage() {
  const [result, setResult] = useState("")

  /** 测试 sidecar token 鉴权链路：error 分支表示 HTTP/校验失败，成功则显示信封内容 */
  const testToken = async () => {
    setResult("请求中... POST /success")
    try {
      const { data, error, status } = await client.api.success.post()
      setResult(
        error
          ? `HTTP ${status}\n${JSON.stringify(error.value, null, 2)}`
          : `${status} OK\n${JSON.stringify(data, null, 2)}`,
      )
    } catch (err) {
      setResult(`请求失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-medium">Sidecar 鉴权测试</h1>
      <Button className="mt-2" variant="secondary" onClick={testToken}>
        测试 Token 调用 POST /success
      </Button>
      {result && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  )
}
