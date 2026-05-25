import { generateSlug } from '@/lib/slugGenerator'

describe('slugGenerator', () => {
  test('slug matches expected format', () => {
    const slug = generateSlug()
    expect(slug).toMatch(/^[a-z]+-[a-z]+-\d{4}$/)
  })

  test('two calls produce different slugs', () => {
    const a = generateSlug()
    const b = generateSlug()
    // This could theoretically fail, but probability is ~1/256
    expect(a).not.toBe(b)
  })
})
