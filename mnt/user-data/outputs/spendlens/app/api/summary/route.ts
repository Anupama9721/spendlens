import { NextRequest, NextResponse } from 'next/server'
import { AuditResult } from '@/lib/types'
import { generateFallbackSummary } from '@/lib/summaryFallback'

export async function POST(req: NextRequest) {
  try {
    const { audit } = (await req.json()) as { audit: AuditResult }
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({ summary: generateFallbackSummary(audit) })
    }

    const toolBreakdown = audit.tools
      .map(
        (t) =>
          `- ${t.toolName} (${t.plan}): currently $${t.currentSpend}/mo → ${t.recommendedAction} → saves $${t.savings}/mo. Reason: ${t.reason}`
      )
      .join('\n')

    const userMessage = `Here is the audit data:

Team size: ${audit.teamSize}
Primary use case: ${audit.useCase}
Tools audited: ${audit.tools.length}
Total current monthly spend: $${audit.totalCurrentSpend}
Total projected monthly savings: $${audit.totalMonthlySavings}
Total projected annual savings: $${audit.totalAnnualSavings}

Per-tool breakdown:
${toolBreakdown}

Write the 90–110 word summary paragraph now.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.4,
        system: `You are a sharp, concise financial analyst specializing in SaaS and AI tooling costs for early-stage startups. Your job is to write a single paragraph (90–110 words) summarizing an AI tool spend audit for a startup.

Rules:
- Be specific: use the actual tool names, plan names, and dollar amounts from the audit data.
- Be direct and honest: if the user is spending well, say so plainly. If they're overspending, be clear about where and by how much.
- Do not use bullet points, headers, or markdown formatting of any kind. Plain prose only.
- Do not say "I" or refer to yourself. Do not start with "Based on your audit" or "Your audit shows."
- Tone: like a trusted advisor talking to a peer, not a report generator.
- End with one forward-looking sentence about the most impactful action.
- Output only the paragraph. Nothing else before or after it.`,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ summary: generateFallbackSummary(audit) })
    }

    const data = await response.json()
    const summary = data.content?.[0]?.text || generateFallbackSummary(audit)
    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: null }, { status: 500 })
  }
}
