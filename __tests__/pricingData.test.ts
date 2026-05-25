import { TOOLS } from '@/lib/pricingData'

describe('pricingData', () => {
  test('all tools have at least one plan', () => {
    for (const tool of TOOLS) {
      expect(tool.plans.length).toBeGreaterThan(0)
    }
  })

  test('all non-api plan prices are non-negative', () => {
    for (const tool of TOOLS) {
      for (const plan of tool.plans) {
        if (!plan.isApiDirect) {
          expect(plan.pricePerSeat).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  test('all tools have a sourceUrl', () => {
    for (const tool of TOOLS) {
      expect(tool.sourceUrl).toBeTruthy()
      expect(tool.sourceUrl).toMatch(/^https?:\/\//)
    }
  })
})
