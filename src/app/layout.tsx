import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RootLayoutClient } from "./layout.client"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Use font-display: swap for better performance
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "AuditToolbox - Workflow Sharing Platform for Auditors",
    template: "%s | AuditToolbox"
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐝</text></svg>',
  },
  description: "AuditToolbox is a professional platform for certified public accountants, internal auditors, and audit professionals to discover, share, and collaborate on audit workflows. Supporting OpenAI, Claude, Gemini, LangChain, and Copilot.",
  keywords: ["audit workflows", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "audit", "financial audit", "AI agents", "AuditToolbox", "CPA", "internal audit", "external audit", "accounting", "professional services", "audit software", "audit technology"],
  authors: [{ name: "Rich Penfil" }],
  creator: "AuditToolbox",
  publisher: "AuditToolbox",
  category: "Business & Professional Services",
  classification: "Business/Technology",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://audittoolbox.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AuditToolbox - Professional Workflow Sharing Platform for Auditors',
    description: 'A professional platform for audit professionals to discover and share audit workflows. Trusted by CPAs, internal auditors, and audit firms.',
    siteName: 'AuditToolbox',
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: 'AuditToolbox - Professional Audit Workflow Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditToolbox - Professional Workflow Sharing Platform',
    description: 'A professional platform for audit professionals to discover and share audit workflows.',
    images: ['/api/og'],
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
    'company': 'AuditToolbox',
    'industry': 'Professional Services, Accounting, Audit',
  },
  verification: {
    // Add when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

// Organization JSON-LD structured data
function OrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://audittoolbox.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AuditToolbox',
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
    description: 'A professional platform for audit professionals to discover and share audit workflows.',
    founder: {
      '@type': 'Person',
      name: 'Rich Penfil',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'Rich@audittoolbox.com',
      contactType: 'customer service',
    },
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// WebSite JSON-LD for search features
function WebSiteJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://audittoolbox.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AuditToolbox',
    url: baseUrl,
    description: 'Professional workflow sharing platform for auditors',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/browse?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className={inter.className}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}