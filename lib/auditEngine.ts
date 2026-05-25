import { SpendInput, AuditResult, ToolAuditResult, UseCase } from './types'
import { getToolById } from './pricingData'

const TOOL_NAMES: Record<string, string> = {
  cursor: 'Cursor',
  github_copilot: 'GitHub Copilot',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  anthropic_api: 'Anthropic API',
  openai_api: 'OpenAI API',
  gemini: 'Gemini',
  windsurf: 'Windsurf',
}

// Cross-tool alternatives by use case
const ALTERNATIVES: Record<string, Partial<Record<UseCase | 'all', string>>> = {
  chatgpt: {
    coding: 'Consider Cursor or Windsurf for coding — they have IDE-native AI that replaces ChatGPT for code tasks',
    writing: 'Claude Pro is similarly priced with stronger long-form writing capability',
    all: 'Claude Pro is the same price with stronger reasoning',
  },
  github_copilot: {
    coding: 'Cursor Pro ($20/seat) offers a superior coding experience with more model options at similar price',
    all: 'Cursor Pro provides more flexibility at a comparable price point',
  },
  gemini: {
    coding: 'Cursor or Windsurf are purpose-built for coding and more cost-effective',
    writing: 'Claude Pro has stronger writing capability at the same price tier',
    all: 'Claude Pro offers stronger general capability at a comparable price',
  },
}

function getAlternative(toolId: string, useCase: UseCase): string | null {
  const toolAlts = ALTERNATIVES[toolId]
  if (!toolAlts) return null
  return toolAlts[useCase] || toolAlts['all'] || null
}

function auditTool(
  toolId: string,
  plan: string,
  seats: number,
  monthlySpend: number,
  teamSize: number,
  useCase: UseCase
): ToolAuditResult {
  const tool = getToolById(toolId)
  const toolName = TOOL_NAMES[toolId] || toolId

  // Handle unknown tools gracefully
  if (!tool) {
    return {
      toolId: toolId as any,
      toolName,
      plan,
      currentSpend: monthlySpend,
      recommendedAction: 'No data available for this tool',
      savings: 0,
      reason: 'Tool not in our pricing database.',
      isOptimal: true,
    }
  }

  const currentPlan = tool.plans.find((p) => p.id === plan)

  // API direct tools — just flag if high spend
  if (currentPlan?.isApiDirect) {
    if (monthlySpend > 500) {
      return {
        toolId: toolId as any,
        toolName,
        plan,
        currentSpend: monthlySpend,
        recommendedAction: 'Review usage and consider Credex credits for discounted access',
        savings: Math.round(monthlySpend * 0.2),
        reason: `At $${monthlySpend}/mo you're a strong candidate for discounted credits through Credex, typically saving 15–25%.`,
        isOptimal: false,
      }
    }
    return {
      toolId: toolId as any,
      toolName,
      plan,
      currentSpend: monthlySpend,
      recommendedAction: 'Spend looks reasonable for API-direct usage',
      savings: 0,
      reason: 'Usage-based billing at this level is within normal range.',
      isOptimal: true,
    }
  }

  if (!currentPlan) {
    return {
      toolId: toolId as any,
      toolName,
      plan,
      currentSpend: monthlySpend,
      recommendedAction: 'Verify your current plan details',
      savings: 0,
      reason: 'Could not match plan to pricing data.',
      isOptimal: true,
    }
  }

  const currentCost = currentPlan.pricePerSeat * seats

  // Check over-seating: seats significantly more than team size
  if (seats > teamSize * 1.2 && seats > 2) {
    const rightSizedCost = currentPlan.pricePerSeat * teamSize
    const savings = currentCost - rightSizedCost
    if (savings > 0) {
      return {
        toolId: toolId as any,
        toolName,
        plan,
        currentSpend: monthlySpend,
        recommendedAction: `Reduce from ${seats} seats to ${teamSize} seats`,
        savings,
        reason: `You have ${seats} seats for a ${teamSize}-person team — ${seats - teamSize} unused seats at $${currentPlan.pricePerSeat}/seat.`,
        isOptimal: false,
      }
    }
  }

  // Check if there's a cheaper plan from the same vendor
  const cheaperPlans = tool.plans
    .filter((p) => {
      if (p.id === plan) return false
      if (p.isApiDirect) return false
      if (p.pricePerSeat === 0) return false // don't suggest free if they're paying
      const cost = p.pricePerSeat * Math.max(seats, p.minSeats)
      return cost < currentCost && Math.max(seats, p.minSeats) <= seats + 1
    })
    .sort((a, b) => a.pricePerSeat - b.pricePerSeat)

  if (cheaperPlans.length > 0) {
    const recommended = cheaperPlans[0]
    const recommendedCost = recommended.pricePerSeat * Math.max(seats, recommended.minSeats)
    const savings = currentCost - recommendedCost
    if (savings > 5) {
      return {
        toolId: toolId as any,
        toolName,
        plan: currentPlan.label,
        currentSpend: monthlySpend,
        recommendedAction: `Downgrade to ${recommended.label}`,
        savings,
        reason: `${recommended.label} at $${recommended.pricePerSeat}/seat covers your use case and saves $${savings}/mo.`,
        isOptimal: false,
      }
    }
  }

  // Check cross-tool alternative
  const alt = getAlternative(toolId, useCase)
  if (alt && currentCost > 30) {
    return {
      toolId: toolId as any,
      toolName,
      plan: currentPlan.label,
      currentSpend: monthlySpend,
      recommendedAction: 'Consider switching tools',
      savings: 0,
      reason: alt,
      isOptimal: false,
    }
  }

  // Check if over $200/mo on any single tool — flag Credex
  if (monthlySpend > 200) {
    return {
      toolId: toolId as any,
      toolName,
      plan: currentPlan.label,
      currentSpend: monthlySpend,
      recommendedAction: 'Explore Credex credits for this tool',
      savings: Math.round(monthlySpend * 0.15),
      reason: `At $${monthlySpend}/mo, discounted credits through Credex could save 15–20% on this tool.`,
      isOptimal: false,
    }
  }

  // Already optimal
  return {
    toolId: toolId as any,
    toolName,
    plan: currentPlan.label,
    currentSpend: monthlySpend,
    recommendedAction: 'No change needed',
    savings: 0,
    reason: "You're on the right plan for your team size and use case.",
    isOptimal: true,
  }
}

export function auditSpend(input: SpendInput): AuditResult {
  const { tools, teamSize, useCase } = input

  const auditedTools = tools.map((t) =>
    auditTool(t.toolId, t.plan, t.seats, t.monthlySpend, teamSize, useCase)
  )

  const totalCurrentSpend = auditedTools.reduce((sum, t) => sum + t.currentSpend, 0)
  const totalMonthlySavings = auditedTools.reduce((sum, t) => sum + t.savings, 0)
  const totalAnnualSavings = totalMonthlySavings * 12

  return {
    tools: auditedTools,
    teamSize,
    useCase,
    totalCurrentSpend,
    totalMonthlySavings,
    totalAnnualSavings,
    isHighSavings: totalMonthlySavings > 500,
    isAlreadyOptimal: totalMonthlySavings < 50 && auditedTools.every((t) => t.isOptimal),
  }
}
