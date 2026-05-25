import { AuditResult } from './types'

export function generateFallbackSummary(audit: AuditResult): string {
  const { teamSize, useCase, totalMonthlySavings, totalAnnualSavings, tools } = audit

  if (audit.isAlreadyOptimal || totalMonthlySavings < 50) {
    return `For a ${teamSize}-person team focused on ${useCase}, the current AI tooling setup is reasonably optimized. Most plans align with actual usage, and there are no significant structural overspends. The main opportunity, if any, is to revisit as the team grows — plan-tier mismatches tend to compound at scale.`
  }

  const topTool = [...tools].sort((a, b) => b.savings - a.savings)[0]

  return `For a ${teamSize}-person team focused on ${useCase}, there's a clear opportunity to reduce AI tooling costs by $${totalMonthlySavings}/month — $${totalAnnualSavings.toLocaleString()}/year. The biggest lever is ${topTool.toolName}: ${topTool.reason} Addressing this one change would recover the majority of available savings without disrupting your team's workflow.`
}
