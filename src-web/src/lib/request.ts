import { invoke } from "@tauri-apps/api/core"

let tokenPromise: Promise<string> | null = null

/**
 * 获取 sidecar 访问令牌（仅首次 invoke，结果缓存；非 Tauri 环境降级为空串）
 * @returns 令牌；开发模式下为空串
 */
export function sidecarToken(): Promise<string> {
  return (tokenPromise ??= invoke<string>("sidecar_token").catch(() => ""))
}

/**
 * 带 sidecar 鉴权头的 fetch 封装
 * @param input 请求地址（开发模式需带完整 Bun 服务地址）
 * @param init fetch 选项
 * @returns fetch 响应
 */
export async function request(input: string, init?: RequestInit): Promise<Response> {
  const token = await sidecarToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set("x-tauri-token", token)
  return fetch(input, { ...init, headers })
}
