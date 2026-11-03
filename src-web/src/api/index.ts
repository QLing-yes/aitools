import { treaty } from "@elysia/eden"
import type { APP } from "@bun/app/index"
import { sidecarToken } from "@/lib/tauri"

/** API 服务地址（同源部署时为空串，走相对路径） */
const baseURL = import.meta.env.VITE_API_URL ?? ""

/** 请求前：注入 sidecar 鉴权头（有令牌时；无令牌直接放行）
 * @param _path 请求路径（未使用）
 * @param options treaty 已组装的 fetch 选项
 * @returns 追加的 fetch 选项；无令牌时不追加
 */
async function onRequest(_path: string, options: RequestInit): Promise<RequestInit | void> {
  const token = await sidecarToken()
  if (!token) return
  const headers = new Headers(options.headers)
  headers.set("x-tauri-token", token)
  return { headers }
}

/** Eden treaty 客户端（全局单例，端到端类型来自 src-bun 生成的类型树）
 * 响应为统一信封 { msg, code, data }：code===1 成功；HTTP/网络失败走 error 分支或抛异常
 */
export const client = treaty<APP>(baseURL, { onRequest })
