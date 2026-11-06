// 路由历史状态：供标题栏前进/后退按钮与登录页返回入口判断是否到尽头

import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router"

/** 历史导航可用性 @returns canGoBack 可后退；canGoForward 可前进 */
export function useHistoryNav() {
  // 订阅路由变化触发重算；索引本身来自 window.history.state.idx（react-router 维护）
  useLocation()
  /** 当前历史索引（history.state 的 usr 才是 location.state，idx 在其外层） */
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
  /** 可达最大索引（前进上界），挂载估算、随真实导航修正 */
  const [max, setMax] = useState(() => Math.max(idx, window.history.length - 1))
  /** popstate 标记：索引变化来自历史穿越（后退/前进），未标记视为 PUSH/replace */
  const popRef = useRef(false)
  /** 已处理的索引；同值跳过保证幂等（StrictMode dev 双跑） */
  const seenRef = useRef<number | null>(null)

  useEffect(() => {
    const markPop = () => (popRef.current = true)
    window.addEventListener("popstate", markPop)
    return () => window.removeEventListener("popstate", markPop)
  }, [])

  useEffect(() => {
    const first = seenRef.current === null
    if (!first && seenRef.current === idx) return
    const isPop = popRef.current
    popRef.current = false
    // 穿越保留上界；PUSH/replace 截断前进栈，上界重置为当前
    if (!first) setMax((prev) => (isPop ? Math.max(prev, idx) : idx))
    seenRef.current = idx
  }, [idx])

  return { canGoBack: idx > 0, canGoForward: idx < max }
}
