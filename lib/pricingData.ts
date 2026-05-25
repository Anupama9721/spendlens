export interface Plan {
  id: string
  label: string
  pricePerSeat: number // monthly
  minSeats: number
  isApiDirect?: boolean
}

export interface Tool {
  id: string
  name: string
  plans: Plan[]
  sourceUrl: string
}

export const TOOLS: Tool[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    sourceUrl: 'https://www.cursor.com/pricing',
    plans: [
      { id: 'hobby', label: 'Hobby', pricePerSeat: 0, minSeats: 1 },
      { id: 'pro', label: 'Pro', pricePerSeat: 20, minSeats: 1 },
      { id: 'business', label: 'Business', pricePerSeat: 40, minSeats: 1 },
    ],
  },
  {
    id: 'github_copilot',
    name: 'GitHub Copilot',
    sourceUrl: 'https://github.com/features/copilot#pricing',
    plans: [
      { id: 'individual', label: 'Individual', pricePerSeat: 10, minSeats: 1 },
      { id: 'business', label: 'Business', pricePerSeat: 19, minSeats: 3 },
      { id: 'enterprise', label: 'Enterprise', pricePerSeat: 39, minSeats: 1 },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    sourceUrl: 'https://www.anthropic.com/pricing',
    plans: [
      { id: 'free', label: 'Free', pricePerSeat: 0, minSeats: 1 },
      { id: 'pro', label: 'Pro', pricePerSeat: 20, minSeats: 1 },
      { id: 'max_5x', label: 'Max (5×)', pricePerSeat: 100, minSeats: 1 },
      { id: 'max_20x', label: 'Max (20×)', pricePerSeat: 200, minSeats: 1 },
      { id: 'team', label: 'Team', pricePerSeat: 30, minSeats: 5 },
      { id: 'enterprise', label: 'Enterprise', pricePerSeat: 0, minSeats: 1 },
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    sourceUrl: 'https://openai.com/chatgpt/pricing',
    plans: [
      { id: 'free', label: 'Free', pricePerSeat: 0, minSeats: 1 },
      { id: 'plus', label: 'Plus', pricePerSeat: 20, minSeats: 1 },
      { id: 'team', label: 'Team', pricePerSeat: 30, minSeats: 2 },
      { id: 'enterprise', label: 'Enterprise', pricePerSeat: 0, minSeats: 1 },
    ],
  },
  {
    id: 'anthropic_api',
    name: 'Anthropic API',
    sourceUrl: 'https://www.anthropic.com/pricing',
    plans: [
      { id: 'api_direct', label: 'API Direct (usage-based)', pricePerSeat: 0, minSeats: 1, isApiDirect: true },
    ],
  },
  {
    id: 'openai_api',
    name: 'OpenAI API',
    sourceUrl: 'https://openai.com/api/pricing',
    plans: [
      { id: 'api_direct', label: 'API Direct (usage-based)', pricePerSeat: 0, minSeats: 1, isApiDirect: true },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    sourceUrl: 'https://one.google.com/about/plans',
    plans: [
      { id: 'free', label: 'Free', pricePerSeat: 0, minSeats: 1 },
      { id: 'advanced', label: 'Advanced', pricePerSeat: 20, minSeats: 1 },
      { id: 'workspace', label: 'Workspace Business', pricePerSeat: 24, minSeats: 1 },
    ],
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    sourceUrl: 'https://windsurf.com/pricing',
    plans: [
      { id: 'free', label: 'Free', pricePerSeat: 0, minSeats: 1 },
      { id: 'pro', label: 'Pro', pricePerSeat: 15, minSeats: 1 },
      { id: 'teams', label: 'Teams', pricePerSeat: 35, minSeats: 1 },
    ],
  },
]

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id)
}

export function getPlanById(toolId: string, planId: string): Plan | undefined {
  return getToolById(toolId)?.plans.find((p) => p.id === planId)
}
