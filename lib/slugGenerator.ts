const ADJECTIVES = [
  'brave', 'swift', 'calm', 'bright', 'sharp', 'bold', 'keen', 'wise',
  'lean', 'clear', 'crisp', 'clean', 'smart', 'quick', 'agile', 'nimble',
]
const NOUNS = [
  'fox', 'hawk', 'pine', 'oak', 'lake', 'peak', 'star', 'wave',
  'reef', 'gale', 'mist', 'dusk', 'dawn', 'tide', 'beam', 'crest',
]

export function generateSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = String(Math.floor(Math.random() * 9000) + 1000)
  return `${adj}-${noun}-${num}`
}
