import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AuditResults from '@/components/AuditResults'

interface PageProps {
  params: { slug: string }
}

async function getAudit(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const audit = await getAudit(params.slug)
  if (!audit) return { title: 'Audit not found' }
  const savings = audit.total_monthly_savings
  const title = savings > 0
    ? `AI spend audit: $${savings}/mo in potential savings found`
    : 'AI spend audit: your tools are well optimized'
  const description = `A free AI tool spend audit for a ${audit.team_size}-person team. Tools reviewed: ${Array.isArray(audit.tools) ? audit.tools.length : 0}.`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spendlens.vercel.app'
  return {
    title, description,
    openGraph: { title, description, url: `${baseUrl}/audit/${params.slug}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function AuditPage({ params }: PageProps) {
  const audit = await getAudit(params.slug)
  if (!audit) notFound()
  return <AuditResults audit={audit} slug={params.slug} />
}