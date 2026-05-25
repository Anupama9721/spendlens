import { NextRequest, NextResponse } from 'next/server'
import { auditSpend } from '@/lib/auditEngine'
import { generateFallbackSummary } from '@/lib/summaryFallback'
import { generateSlug } from '@/lib/slugGenerator'
import { getServiceClient } from '@/lib/supabase'
import { SpendInput } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const { tools, teamSize, useCase } = body as SpendInput & { website?: string }

    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json({ error: 'tools array is required' }, { status: 400 })
    }
    if (!teamSize || !useCase) {
      return NextResponse.json({ error: 'teamSize and useCase are required' }, { status: 400 })
    }

    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const supabase = getServiceClient()

    const { data: rateData } = await supabase
      .from('rate_limits')
      .select('count, window_start')
      .eq('ip', ip)
      .single()

    const now = new Date()
    if (rateData) {
      const windowStart = new Date(rateData.window_start)
      const hoursPassed = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60)
      if (hoursPassed < 1 && rateData.count >= 10) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
      if (hoursPassed >= 1) {
        await supabase.from('rate_limits').upsert({ ip, count: 1, window_start: now.toISOString() })
      } else {
        await supabase.from('rate_limits').update({ count: rateData.count + 1 }).eq('ip', ip)
      }
    } else {
      await supabase.from('rate_limits').insert({ ip, count: 1, window_start: now.toISOString() })
    }

    // Run the audit
    const auditResult = auditSpend({ tools, teamSize, useCase })

    // Try AI summary, fall back to template
    let aiSummary = generateFallbackSummary(auditResult)
    try {
      const summaryRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/summary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audit: auditResult }),
        }
      )
      if (summaryRes.ok) {
        const { summary } = await summaryRes.json()
        if (summary) aiSummary = summary
      }
    } catch {
      // fallback already set
    }

    auditResult.aiSummary = aiSummary

    // Generate a unique slug
    let slug = generateSlug()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('audits')
        .select('slug')
        .eq('slug', slug)
        .single()
      if (!existing) break
      slug = generateSlug()
      attempts++
    }

    // Save to Supabase
    const { error: insertError } = await supabase.from('audits').insert({
      slug,
      tools: auditResult.tools,
      team_size: auditResult.teamSize,
      use_case: auditResult.useCase,
      total_current_spend: auditResult.totalCurrentSpend,
      total_monthly_savings: auditResult.totalMonthlySavings,
      total_annual_savings: auditResult.totalAnnualSavings,
      ai_summary: aiSummary,
      is_high_savings: auditResult.isHighSavings,
    })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })
    }

    return NextResponse.json({ slug })
  } catch (err) {
    console.error('Audit API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
