// 登录页（login-03 风格）：用户名+密码表单；校验预留，任意凭据直接通过

import { ArrowLeftIcon } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

import { BrandLogo } from "@/components/brand-logo"
import { IconAction } from "@/components/layout/icon-action"
import { ThemeMenu } from "@/components/layout/theme-menu"
import { WindowControls } from "@/components/layout/window-controls"
import { WindowDragRegion } from "@/components/layout/window-drag-region"
import { WindowPin } from "@/components/layout/window-pin"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useHistoryNav } from "@/hooks/use-history-nav"
import { isTauri } from "@/lib/tauri"
import { useAuthStore } from "@/store/auth"

/** 各字段错误文案；无错时对应键为 undefined */
type FormErrors = { username?: string; password?: string }

/** 校验用户名与密码 @param username 用户名 @param password 密码 @returns 各字段错误文案 */
function validate(username: string, password: string): FormErrors {
  const errors: FormErrors = {}
  const name = username.trim()
  if (!name) errors.username = "请输入用户名"
  else if (name.length < 2) errors.username = "用户名至少 2 个字符"
  if (!password) errors.password = "请输入密码"
  else if (password.length < 6) errors.password = "密码至少 6 位"
  return errors
}

/** 返回入口：能后退就后退（回到退出登录前的页面），直达登录页时兜底进主界面 */
function LoginBackButton() {
  const navigate = useNavigate()
  const { canGoBack } = useHistoryNav()

  return (
    <IconAction
      hint={canGoBack ? "返回上一页" : "进入主界面"}
      button={{
        onClick: () =>
          canGoBack ? navigate(-1) : navigate("/", { replace: true }),
      }}
    >
      <ArrowLeftIcon className="size-4 shrink-0" />
    </IconAction>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  /** 提交：校验通过后走预留登录并回主界面（replace 避免后退又回到登录页） */
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = validate(username, password)
    setErrors(next)
    if (next.username || next.password) return
    login(username.trim())
    navigate("/", { replace: true })
  }

  /** 输入焦点态：边框 + 2px 环叠出厚度，颜色取低透明度显浅（覆盖基类 border-ring 深环） */
  const inputFocusClass =
    "focus-visible:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring/15"

  return (
    <TooltipProvider>
      <div
        data-app-radius
        className="bg-shell bg-dots relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6 pt-12 md:p-10"
      >
        {/* 桌面端：返回 + 顶部拖动区 + 主题菜单 + 窗口三键；浏览器：左上返回、右上悬浮主题入口 */}
        {isTauri ? (
          <div className="fixed inset-x-0 top-0 flex h-10 select-none">
            {/* 左上：返回入口（no-drag 保持可点击） */}
            <div className="flex items-center gap-0.5 pl-2 [-webkit-app-region:no-drag]">
              <LoginBackButton />
            </div>
            <WindowDragRegion />
            <div className="flex items-center gap-0.5 pr-2 [-webkit-app-region:no-drag]">
              <ThemeMenu />
              <WindowPin />
              <WindowControls />
            </div>
          </div>
        ) : (
          <>
            <div className="fixed top-1.5 left-2 [-webkit-app-region:no-drag]">
              <LoginBackButton />
            </div>
            <div className="fixed top-1.5 right-2 [-webkit-app-region:no-drag]">
              <ThemeMenu />
            </div>
          </>
        )}

        <div className="relative flex w-full max-w-sm flex-col gap-6">
          {/* 品牌区：logo + 名称 */}
          <div className="flex items-center gap-2 self-center font-medium">
            <BrandLogo />
            aitools
          </div>

          {/* 卡片+光晕容器：光晕衬于卡片左下，透出磨砂层次 */}
          <div className="relative">
            {/* 渐变光晕：原生 400x457 图衬在卡片之下，位置/旋转/缩放均以其中心为锚，偏移量见类 */}
            <div
              className="bg-gradient pointer-events-none absolute -top-30 -left-15 h-[457px] w-100 scale-125 rotate-3 bg-no-repeat"
              aria-hidden
            />
            {/* 卡片衬在壳色上：磨砂背景由 index.scss 全局规则统一提供（含模糊） */}
            <Card className="relative rounded-t-2xl border-b border-solid border-separator px-3">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">登录账号</CardTitle>
                <CardDescription>输入用户名和密码登录</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit}>
                  <FieldGroup>
                    <Field data-invalid={errors.username ? true : undefined}>
                      <FieldLabel htmlFor="username">用户名</FieldLabel>
                      <Input
                        id="username"
                        placeholder="请输入用户名"
                        autoComplete="username"
                        aria-invalid={errors.username ? true : undefined}
                        className={inputFocusClass}
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            username: undefined,
                          }))
                        }}
                      />
                      <FieldError>{errors.username}</FieldError>
                    </Field>
                    <Field data-invalid={errors.password ? true : undefined}>
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        placeholder="请输入密码"
                        autoComplete="current-password"
                        aria-invalid={errors.password ? true : undefined}
                        className={inputFocusClass}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }))
                        }}
                      />
                      <FieldError>{errors.password}</FieldError>
                    </Field>
                    <Field>
                      {/* 亮色黑按钮 #191919；暗色回落到 primary 令牌（近白反色） */}
                      <Button
                        type="submit"
                        className="w-full bg-[#191919] hover:bg-[#191919]/90 dark:bg-primary dark:hover:bg-primary/90"
                      >
                        登录
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
