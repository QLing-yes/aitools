import { Button } from "@/components/ui/button"

/** 首页：组件演示区 */
export function HomePage() {
  return (
    <div className="max-w-md">
      <h1 className="font-medium">Project ready!</h1>
      <p>You may now add components and start building.</p>
      <p>We&apos;ve already added the button component for you.</p>
      <Button className="mt-2">Button</Button>
      <p className="mt-4 font-mono text-xs text-muted-foreground">
        (Press <kbd>d</kbd> to toggle dark mode)
      </p>
    </div>
  )
}
