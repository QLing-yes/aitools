// 流程示例自定义节点：带左右连接点的步骤卡片

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"

/** 步骤节点数据 @property label 标题 @property hint 副标题提示 */
export type StepNodeData = { label: string; hint?: string }
/** 步骤节点类型（注册名 step） */
export type StepNode = Node<StepNodeData, "step">

export function StepNodeView({ data }: NodeProps<StepNode>) {
  return (
    <div className="rounded-lg bg-card px-3 py-2 text-sm shadow-md transition-shadow hover:shadow-lg">
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-0 !bg-muted-foreground"
      />
      <div className="font-medium">{data.label}</div>
      {data.hint && (
        <div className="text-xs text-muted-foreground">{data.hint}</div>
      )}
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-0 !bg-primary"
      />
    </div>
  )
}
