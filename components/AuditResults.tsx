'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ToolResult {
  toolId: string
  toolName: string
  plan: string
  currentSpend: number
  recommendedAction: string
  savings: number
  reason: string
  isOptimal: boolean
}

interface AuditData {
  id: string
  slug: string
  tools: ToolResult[]
  team_size: number
  use_case: string
  total_current_spend: number
  total_monthly_savings: number
  total_annual_savings: number
  ai_summary: string
  is_high_savings: boolean
}

interface Props {
  audit: AuditData
  slug: string
}

export default function AuditResults({ audit, slug }: Props) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://spendlens.vercel.app'

  const shareUrl = `${baseUrl}/audit/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: audit.id,
          email,
          companyName: company,
          role,
          teamSize: audit.team_size,
          monthlySavings: audit.total_monthly_savings,
          slug,
        }),
      })
      setSubmitted(true)
    } catch {}
    setSubmitting(false)
  }

  const isOptimal =
    audit.total_monthly_savings < 50 && audit.tools.every((t) => t.isOptimal)

  return (
    <main className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back */}
        <Link
          href="/"
          className="text-xs opacity-30 hover:opacity-60 transition-opacity mb-12 block"
        >
          ← Run another audit
        </Link>

        {/* Hero savings */}
        <div className="fade-up fade-up-1 mb-12">
          {isOptimal ? (
            <>
              <div className="text-xs tracking-widest uppercase opacity-40 mb-3">Audit complete</div>
              <h1
                className="text-5xl leading-tight mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                You&apos;re spending well.
              </h1>
              <p className="opacity-50">
                Your current AI tool setup is reasonably optimized for a {audit.team_size}-person
                team.
              </p>
            </>
          ) : (
            <>
              <div className="text-xs tracking-widest uppercase opacity-40 mb-3">Audit complete</div>
              <h1
                className="text-6xl md:text-7xl leading-none mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#16a34a' }}
              >
                ${audit.total_monthly_savings.toLocaleString()}
                <span className="text-3xl opacity-60">/mo</span>
              </h1>
              <p className="text-xl opacity-50" style={{ fontFamily: 'var(--font-display)' }}>
                ${audit.total_annual_savings.toLocaleString()} per year in potential savings
              </p>
              <p className="text-xs opacity-30 mt-2">
                From ${audit.total_current_spend}/mo current spend
              </p>
            </>
          )}
        </div>

        {/* Credex CTA for high savings */}
        {audit.is_high_savings && (
          <div
            className="fade-up fade-up-2 mb-10 p-6 border-l-4 bg-white"
            style={{ borderLeftColor: '#22c55e' }}
          >
            <div className="text-xs tracking-widest uppercase opacity-40 mb-2">
              High savings detected
            </div>
            <p className="text-sm mb-3">
              Your audit shows <strong>${audit.total_monthly_savings}/month</strong> in potential
              savings. Credex can help you capture even more through discounted AI credits for
              Cursor, Claude, ChatGPT and others.
            </p>
            <a
              href="https://credex.rocks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm px-4 py-2 text-white"
              style={{ background: 'var(--ink)' }}
            >
              Book a free Credex consultation →
            </a>
          </div>
        )}

        {/* AI Summary */}
        {audit.ai_summary && (
          <div className="fade-up fade-up-2 mb-10 p-5 bg-white border" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
            <div className="text-xs tracking-widest uppercase opacity-30 mb-3">Summary</div>
            <p className="text-sm leading-relaxed opacity-80">{audit.ai_summary}</p>
          </div>
        )}

        {/* Per-tool breakdown */}
        <div className="fade-up fade-up-3 mb-12">
          <h2 className="text-xs tracking-widest uppercase opacity-40 mb-4">
            Here&apos;s exactly where your money is going
          </h2>
          <div className="space-y-3">
            {audit.tools.map((tool, i) => (
              <div
                key={i}
                className="bg-white border p-4 rounded-sm"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{tool.toolName}</span>
                      <span className="text-xs opacity-40">{tool.plan}</span>
                    </div>
                    <p className="text-xs opacity-50 leading-relaxed">{tool.reason}</p>
                    {!tool.isOptimal && (
                      <p
                        className="text-xs mt-1 font-medium"
                        style={{ color: '#16a34a' }}
                      >
                        → {tool.recommendedAction}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm opacity-40 line-through">
                      ${tool.currentSpend}/mo
                    </div>
                    {tool.savings > 0 && (
                      <div
                        className="text-sm font-medium"
                        style={{ color: '#16a34a' }}
                      >
                        save ${tool.savings}/mo
                      </div>
                    )}
                    {tool.isOptimal && tool.savings === 0 && (
                      <div className="text-xs opacity-30">✓ optimal</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share URL */}
        <div
          className="fade-up fade-up-3 mb-12 p-5 bg-white border"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        >
          <div className="text-xs tracking-widest uppercase opacity-30 mb-3">Share this audit</div>
          <p className="text-xs opacity-50 mb-3">
            Public link — company name and email are never shown.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 border border-black/10 px-3 py-2 text-xs bg-transparent rounded-sm"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs border border-black/20 hover:bg-black hover:text-white transition-colors rounded-sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Lead capture */}
        <div
          className="fade-up fade-up-4 p-6 bg-white border"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        >
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Report sent.
              </div>
              <p className="text-xs opacity-40">
                Check your inbox. We&apos;ll be in touch if there are more savings to capture.
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs tracking-widest uppercase opacity-30 mb-1">
                {isOptimal
                  ? 'Stay notified'
                  : 'Get your full report'}
              </div>
              <p className="text-sm opacity-60 mb-4">
                {isOptimal
                  ? "We'll notify you when new optimizations apply to your stack."
                  : 'Get this audit delivered to your inbox, plus updates when pricing changes affect your tools.'}
              </p>
              <form onSubmit={handleLeadSubmit}>
                <div className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company (optional)"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                    />
                    <input
                      type="text"
                      placeholder="Your role (optional)"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                    />
                  </div>
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-sm tracking-widest uppercase transition-all disabled:opacity-50"
                    style={{ background: 'var(--ink)', color: 'var(--surface)' }}
                  >
                    {submitting ? 'Sending…' : 'Send my report →'}
                  </button>
                </div>
                <p className="text-xs opacity-30 mt-2 text-center">
                  No spam. Unsubscribe any time.
                </p>
              </form>
            </>
          )}
        </div>

        <footer className="mt-12 text-center text-xs opacity-20">
          SpendLens is a free tool by{' '}
          <a href="https://credex.rocks" className="underline">
            Credex
          </a>
          . Pricing data verified weekly.
        </footer>
      </div>
    </main>
  )
}
