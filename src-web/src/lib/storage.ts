// web 端持久化的唯一登记处：localStorage 键名与裸值读写口都在这里，别处不再出现字面键名
// 边界：zustand store 走 persist 自带的容错存储，只登记键名；第三方库自管的键在此只做索引，不反向接管

/** 持久化键登记表；值一经发布不可改（改了等于丢用户数据），新增只加行 */
export const STORAGE_KEYS = {
  /** zustand UI store：侧栏模式/宽度 + 磨砂两项 */
  ui: "aigc-ui",
  /** zustand 鉴权 store：username */
  auth: "aigc-auth",
  /** 明暗偏好，裸字符串值 */
  theme: "theme",
  /** 设置页分栏布局 id，react-resizable-panels 自加前缀落盘为 `react-resizable-panels:<id>` */
  settingsLayout: "aigc-settings-split",
  /** 层级检视器悬浮按钮位置，键由 src/dev/layer-inspector.ts 自持（该文件跨项目零依赖，不引本模块） */
  layerInspector: "dlx:pos",
} as const

/** 读裸字符串 @param key 存储键 @returns 存过的值；没存过或存储不可用返回 null */
export function readText(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** 写裸字符串 @param key 存储键 @param value 待存值；隐私模式/配额失败一律静默（持久化是增强，不是功能前提） */
export function writeText(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 落盘失败不影响本次会话 */
  }
}
