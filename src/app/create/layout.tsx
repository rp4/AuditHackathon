import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Workflow',
  description: 'Create and share your audit workflow templates with the professional audit community. Design visual workflows using our intuitive canvas editor.',
  keywords: ['create workflow', 'audit workflow builder', 'workflow designer', 'audit template creator'],
  openGraph: {
    title: 'Create Workflow | AuditToolbox',
    description: 'Create and share your audit workflow templates with the professional audit community.',
    type: 'website',
  },
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
