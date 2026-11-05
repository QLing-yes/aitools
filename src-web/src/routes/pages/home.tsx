// 首页：组件演示区

import { PageCanvas } from "@/components/layout/page-canvas"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function HomePage() {
  return (
    <PageCanvas>
      <div className="p-4 leading-loose sm:p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Project ready!</CardTitle>
            <CardDescription>
              You may now add components and start building.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p>We&apos;ve already added the button component for you.</p>
            <Button>Button</Button>
          </CardContent>
        </Card>
      </div>
    </PageCanvas>
  )
}
