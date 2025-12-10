import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RootLayoutClient } from "./layout.client"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Use font-display: swap for better performance
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "AuditSwarm - AI Tool Sharing Platform for Auditors",
    template: "%s | AuditSwarm"
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐝</text></svg>',
  },
  description: "AuditSwarm is a professional platform for certified public accountants, internal auditors, and audit professionals to discover, share, and collaborate on AI tools for audit automation. Supporting OpenAI, Claude, Gemini, LangChain, and Copilot.",
  keywords: ["AI tools", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "audit", "financial audit", "AI agents", "AuditSwarm", "CPA", "internal audit", "external audit", "accounting", "professional services", "audit software", "audit technology"],
  authors: [{ name: "AuditSwarm" }],
  creator: "AuditSwarm",
  publisher: "AuditSwarm",
  category: "Business & Professional Services",
  classification: "Business/Technology",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://auditswarm.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AuditSwarm - Professional AI Tool Sharing Platform for Auditors',
    description: 'A professional platform for audit professionals to discover and share AI tools for audit automation. Trusted by CPAs, internal auditors, and audit firms.',
    siteName: 'AuditSwarm',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'AuditSwarm - Professional Audit Tools Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditSwarm - Professional AI Tool Sharing Platform',
    description: 'A professional platform for audit professionals to discover and share AI tools for audit automation.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'rating': 'General',
    'distribution': 'Global',
    'revisit-after': '7 days',
    'target': 'all',
    'audience': 'Audit Professionals, CPAs, Internal Auditors, Accountants',
    'page-topic': 'Business Software, Audit Technology, Professional Services',
    'page-type': 'Professional Services Portal',
    'company': 'AuditSwarm',
    'industry': 'Professional Services, Accounting, Audit',
  },
  verification: {
    // Add when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        <Analytics />
      </body>
    </html>
  )
}