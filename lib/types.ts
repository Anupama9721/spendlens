export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed'

export type ToolId =
  | 'cursor'
  | 'github_copilot'
  | 'claude'
  | 'chatgpt'
  | 'anthropic_api'
  | 'openai_api'
  | 'gemini'
  | 'windsurf'

export interface ToolInput {
  toolId: ToolId
  plan: string
  seats: number
  monthlySpend: number
}

export interface SpendInput {
  tools: ToolInput[]
  teamSize: number
  useCase: UseCase
}

export interface ToolAuditResult {
  toolId: ToolId
  toolName: string
  plan: string
  currentSpend: number
  recommendedAction: string
  savings: number
  reason: string
  isOptimal: boolean
}

export interface AuditResult {
  tools: ToolAuditResult[]
  teamSize: number
  useCase: UseCase
  totalCurrentSpend: number
  totalMonthlySavings: number
  totalAnnualSavings: number
  isHighSavings: boolean
  isAlreadyOptimal: boolean
  aiSummary?: string
}
