// AI 对话客户端封装：useChat 传输层（/api/chat + sidecar 鉴权头注入）

import { DefaultChatTransport, type ChatTransport, type UIMessage } from "ai"

import { sidecarToken } from "@/lib/tauri"

/** API 服务地址（同源部署时为空串，走相对路径） */
const baseURL = import.meta.env.VITE_API_URL ?? ""

/** 创建对话传输层：自定义 fetch 注入 sidecar 令牌（浏览器/服务器部署令牌为空，直接放行）
 * @returns useChat 可用的传输实例 */
export function createChatTransport(): ChatTransport<UIMessage> {
  return new DefaultChatTransport({
    api: `${baseURL}/api/chat`,
    // transport 仅消费函数本体，bun 端 fetch 类型含 preconnect 等附加成员，包装函数按本体断言
    fetch: (async (input, init) => {
      const token = await sidecarToken()
      const headers = new Headers(init?.headers)
      if (token) headers.set("x-tauri-token", token)
      return fetch(input, { ...init, headers })
    }) as typeof globalThis.fetch,
  })
}
