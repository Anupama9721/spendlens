'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TOOLS } from '@/lib/pricingData'
import { ToolInput, UseCase } from '@/lib/types'

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: 'coding', label: 'Coding / Engineering' },
  { value: 'writing', label: 'Writing / Content' },
  { value: 'data', label: 'Data / Analysis' },
  { value: 'research', label: 'Research' },
  { value: 'mixed', label: 'Mixed / General' },
]

const DEFAULT_TOOL: ToolInput = {
  toolId: 'cursor',
  plan: 'pro',
  seats: 1,
  monthlySpend: 20,
}

interface FormState {
  tools: ToolInput[]
  teamSize: number
  useCase: UseCase
}

const DEFAULT_FORM: FormState = {
  tools: [{ ...DEFAULT_TOOL }],
  teamSize: 5,
  useCase: 'coding',
}

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('spendlens_form')
      if (saved) setForm(JSON.parse(saved))
    } catch {}
    setMounted(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (mounted) localStorage.setItem('spendlens_form', JSON.stringify(form))
  }, [form, mounted])

  const totalSpend = form.tools.reduce((sum, t) => sum + (t.monthlySpend || 0), 0)

  const updateTool = useCallback((index: number, updates: Partial<ToolInput>) => {
    setForm((prev) => {
      const tools = [...prev.tools]
      tools[index] = { ...tools[index], ...updates }
      // Auto-update monthlySpend when plan/seats change for non-API tools
      const tool = TOOLS.find((t) => t.id === tools[index].toolId)
      const plan = tool?.plans.find((p) => p.id === tools[index].plan)
      if (plan && !plan.isApiDirect && !updates.monthlySpend) {
        tools[index].monthlySpend = plan.pricePerSeat * tools[index].seats
      }
      return { ...prev, tools }
    })
  }, [])

  const addTool = () => {
    const usedIds = new Set(form.tools.map((t) => t.toolId))
    const nextTool = TOOLS.find((t) => !usedIds.has(t.id as any))
    if (!nextTool) return
    const firstPlan = nextTool.plans[0]
    setForm((prev) => ({
      ...prev,
      tools: [
        ...prev.tools,
        {
          toolId: nextTool.id as any,
          plan: firstPlan.id,
          seats: 1,
          monthlySpend: firstPlan.pricePerSeat,
        },
      ],
    }))
  }

  const removeTool = (index: number) => {
    setForm((prev) => ({ ...prev, tools: prev.tools.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      localStorage.removeItem('spendlens_form')
      router.push(`/audit/${data.slug}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen" style={{ background: 'var(--surface)' }}>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12">
        <div className="fade-up fade-up-1">
          <span className="text-xs tracking-widest uppercase opacity-50 mb-4 block">
            Free · No login · By Credex
          </span>
        </div>
        <h1
          className="fade-up fade-up-2 text-5xl md:text-6xl leading-tight mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Find out how much your<br />
          <em>AI tools actually cost.</em>
        </h1>
        <p className="fade-up fade-up-3 text-base opacity-60 max-w-xl mb-2">
          Most startups pay for 3–5 AI tools and have never added them up. In 2 minutes, you will.
        </p>
        {totalSpend > 0 && (
          <div className="fade-up fade-up-4 mt-6 inline-flex items-center gap-3 border border-black/10 px-4 py-2 rounded-sm bg-white">
            <span className="opacity-50 text-xs">Current total</span>
            <span className="font-medium text-lg" style={{ fontFamily: 'var(--font-display)' }}>
              ${totalSpend.toLocaleString()}/mo
            </span>
          </div>
        )}
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Tools */}
          <div className="mb-8">
            <h2 className="text-xs tracking-widest uppercase opacity-40 mb-4">
              Your AI tools
            </h2>
            <div className="space-y-3">
              {form.tools.map((tool, i) => {
                const toolDef = TOOLS.find((t) => t.id === tool.toolId)
                const planDef = toolDef?.plans.find((p) => p.id === tool.plan)
                const isApi = planDef?.isApiDirect

                return (
                  <div
                    key={i}
                    className="bg-white border border-black/8 p-4 rounded-sm"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Tool */}
                      <div>
                        <label className="block text-xs opacity-40 mb-1">Tool</label>
                        <select
                          className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                          value={tool.toolId}
                          onChange={(e) => {
                            const newTool = TOOLS.find((t) => t.id === e.target.value)
                            if (!newTool) return
                            const firstPlan = newTool.plans[0]
                            updateTool(i, {
                              toolId: e.target.value as any,
                              plan: firstPlan.id,
                              monthlySpend: firstPlan.pricePerSeat,
                            })
                          }}
                        >
                          {TOOLS.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Plan */}
                      <div>
                        <label className="block text-xs opacity-40 mb-1">Plan</label>
                        <select
                          className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                          value={tool.plan}
                          onChange={(e) => updateTool(i, { plan: e.target.value })}
                        >
                          {(toolDef?.plans || []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seats or Spend */}
                      {isApi ? (
                        <div>
                          <label className="block text-xs opacity-40 mb-1">Monthly spend ($)</label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                            value={tool.monthlySpend}
                            onChange={(e) =>
                              updateTool(i, { monthlySpend: Number(e.target.value) })
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs opacity-40 mb-1">Seats</label>
                          <input
                            type="number"
                            min={1}
                            className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                            value={tool.seats}
                            onChange={(e) =>
                              updateTool(i, { seats: Number(e.target.value) })
                            }
                          />
                        </div>
                      )}

                      {/* Monthly spend (non-API) */}
                      {!isApi && (
                        <div>
                          <label className="block text-xs opacity-40 mb-1">Monthly ($)</label>
                          <input
                            type="number"
                            min={0}
                            className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                            value={tool.monthlySpend}
                            onChange={(e) =>
                              updateTool(i, { monthlySpend: Number(e.target.value) })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {form.tools.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTool(i)}
                        className="mt-3 text-xs opacity-30 hover:opacity-70 transition-opacity"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {form.tools.length < TOOLS.length && (
              <button
                type="button"
                onClick={addTool}
                className="mt-3 text-sm border border-dashed border-black/20 w-full py-3 hover:border-black/40 transition-colors rounded-sm"
              >
                + Add another tool
              </button>
            )}
          </div>

          {/* Team context */}
          <div className="bg-white border p-4 rounded-sm mb-6" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <h2 className="text-xs tracking-widest uppercase opacity-40 mb-4">Team context</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs opacity-40 mb-1">Team size</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                  value={form.teamSize}
                  onChange={(e) => setForm((prev) => ({ ...prev, teamSize: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-xs opacity-40 mb-1">Primary use case</label>
                <select
                  className="w-full border border-black/10 px-3 py-2 text-sm bg-transparent rounded-sm focus:outline-none focus:border-black/30"
                  value={form.useCase}
                  onChange={(e) => setForm((prev) => ({ ...prev, useCase: e.target.value as UseCase }))}
                >
                  {USE_CASES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || form.tools.length === 0}
            className="w-full py-4 text-sm tracking-widest uppercase font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--ink)',
              color: 'var(--surface)',
            }}
          >
            {submitting ? 'Running audit…' : 'Audit my AI spend →'}
          </button>

          <p className="text-center text-xs opacity-30 mt-3">
            No login required. Email only asked after results.
          </p>
        </form>
      </section>
    </main>
  )
}
