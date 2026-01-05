import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Audit Workflows',
  description: 'Discover and download professional audit workflow templates. Filter by category, search for specific processes, and find the perfect workflow for your audit needs.',
  keywords: ['audit workflows', 'workflow templates', 'audit processes', 'CPA tools', 'internal audit', 'compliance workflows'],
  openGraph: {
    title: 'Browse Audit Workflows | AuditSwarm',
    description: 'Discover and download professional audit workflow templates created by the audit community.',
    type: 'website',
  },
}

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
