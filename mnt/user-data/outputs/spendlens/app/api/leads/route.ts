import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Honeypot
    if (body.website) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const { auditId, email, companyName, role, teamSize, monthlySavings, slug } = body

    if (!email || !auditId) {
      return NextResponse.json({ error: 'email and auditId are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Save lead
    const { error } = await supabase.from('leads').insert({
      audit_id: auditId,
      email,
      company_name: companyName || null,
      role: role || null,
      team_size: teamSize || null,
      monthly_savings: monthlySavings || 0,
      is_high_value: (monthlySavings || 0) > 500,
    })

    if (error) {
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    // Send confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spendlens.vercel.app'
    try {
      await resend.emails.send({
        from: 'SpendLens <hello@spendlens.app>',
        to: email,
        subject: 'Your AI spend audit is ready',
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #0a0a0a;">
            <h1 style="font-size: 24px; margin-bottom: 8px;">Your audit is saved.</h1>
            <p style="color: #666; margin-bottom: 32px;">Here's your permanent link to share or revisit:</p>
            <a href="${baseUrl}/audit/${slug}" style="display: inline-block; background: #0a0a0a; color: #fff; padding: 14px 28px; text-decoration: none; font-size: 15px; margin-bottom: 32px;">${baseUrl}/audit/${slug}</a>
            ${
              (monthlySavings || 0) > 500
                ? `<p style="background: #f0fdf4; border-left: 3px solid #22c55e; padding: 16px; margin-bottom: 24px;">
                Your audit shows <strong>$${monthlySavings}/month in potential savings</strong>. A Credex team member will be in touch shortly — we may be able to help you capture more of that through discounted AI credits.
              </p>`
                : ''
            }
            <p style="color: #999; font-size: 13px;">SpendLens is a free tool by <a href="https://credex.rocks" style="color: #0a0a0a;">Credex</a>.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Email send error:', emailErr)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Leads API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
