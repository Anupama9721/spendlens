import { generateFallbackSummary } from '@/lib/summaryFallback'
import { AuditResult } from '@/lib/types'

const mockAudit: AuditResult = {
  tools: [
    {
      toolId: 'chatgpt',
      toolName: 'ChatGPT',
      plan: 'Team',
      currentSpend: 300,
      recommendedAction: 'Reduce seats',
      savings: 210,
      reason: 'You have 10 seats for a 3-person team.',
      isOptimal: false,
    },
  ],
  teamSize: 3,
  useCase: 'coding',
  totalCurrentSpend: 300,
  totalMonthlySavings: 210,
  totalAnnualSavings: 2520,
  isHighSavings: false,
  isAlreadyOptimal: false,
}

describe('generateFallbackSummary', () => {
  test('returns a non-empty string', () => {
    const result = generateFallbackSummary(mockAudit)
    expect(result.length).toBeGreaterThan(50)
  })

  test('includes monthly savings amount', () => {
    const result = generateFallbackSummary(mockAudit)
    expect(result).toContain('210')
  })

  test('returns optimal message for optimal audit', () => {
    const optimal: AuditResult = {
      ...mockAudit,
      tools: [{ ...mockAudit.tools[0], savings: 0, isOptimal: true }],
      totalMonthlySavings: 0,
      totalAnnualSavings: 0,
      isAlreadyOptimal: true,
    }
    const result = generateFallbackSummary(optimal)
    expect(result.toLowerCase()).toMatch(/optimized|optimal|well/)
  })
})
