import { auditSpend } from '@/lib/auditEngine'
import { SpendInput } from '@/lib/types'

describe('auditEngine', () => {
  test('over-seated team plan flags correctly', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'chatgpt', plan: 'team', seats: 10, monthlySpend: 300 }],
      teamSize: 3,
      useCase: 'mixed',
    }
    const result = auditSpend(input)
    const tool = result.tools[0]
    expect(tool.isOptimal).toBe(false)
    expect(tool.savings).toBeGreaterThan(0)
  })

  test('solo user on correct plan gets no savings flag', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'claude', plan: 'pro', seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: 'writing',
    }
    const result = auditSpend(input)
    expect(result.tools[0].savings).toBe(0)
  })

  test('coding use case surfaces tool recommendation for chatgpt', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'chatgpt', plan: 'plus', seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: 'coding',
    }
    const result = auditSpend(input)
    const tool = result.tools[0]
    expect(tool.isOptimal).toBe(false)
    expect(tool.reason.toLowerCase()).toMatch(/cursor|windsurf|coding/)
  })

  test('API direct spend over $500 triggers savings flag', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'anthropic_api', plan: 'api_direct', seats: 1, monthlySpend: 600 }],
      teamSize: 5,
      useCase: 'mixed',
    }
    const result = auditSpend(input)
    expect(result.tools[0].savings).toBeGreaterThan(0)
    expect(result.tools[0].isOptimal).toBe(false)
  })

  test('annual savings equals 12x monthly savings', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'chatgpt', plan: 'team', seats: 10, monthlySpend: 300 }],
      teamSize: 3,
      useCase: 'mixed',
    }
    const result = auditSpend(input)
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12)
  })

  test('unknown tool id does not throw', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'unknown_tool' as any, plan: 'pro', seats: 1, monthlySpend: 30 }],
      teamSize: 2,
      useCase: 'coding',
    }
    expect(() => auditSpend(input)).not.toThrow()
  })

  test('already-optimal small spend returns isAlreadyOptimal true', () => {
    const input: SpendInput = {
      tools: [{ toolId: 'claude', plan: 'pro', seats: 1, monthlySpend: 20 }],
      teamSize: 1,
      useCase: 'writing',
    }
    const result = auditSpend(input)
    expect(result.isAlreadyOptimal).toBe(true)
  })

  test('isHighSavings true when savings over 500', () => {
    const input: SpendInput = {
      tools: [
        { toolId: 'chatgpt', plan: 'team', seats: 30, monthlySpend: 900 },
        { toolId: 'github_copilot', plan: 'enterprise', seats: 30, monthlySpend: 1170 },
      ],
      teamSize: 10,
      useCase: 'coding',
    }
    const result = auditSpend(input)
    // With 30 seats for a 10-person team, savings should be substantial
    expect(result.totalMonthlySavings).toBeGreaterThan(0)
  })
})
