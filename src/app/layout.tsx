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
    default: "AuditSwarm - Workflow Sharing Platform for Auditors",
    template: "%s | AuditSwarm"
  },
  icons: {
    icon: '/queen.png',
    apple: '/queen.png',
  },
  description: "AuditSwarm is a platform for internal auditors to discover, share, and collaborate on AI-powered audit workflows. Each workflow is a context map of well-designed prompts and context engineering patterns.",
  keywords: ["audit workflows", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "audit", "AI agents", "AuditSwarm", "internal audit", "context engineering", "prompt engineering", "audit software", "audit technology"],
  authors: [{ name: "Rich Penfil" }],
  creator: "AuditSwarm",
  publisher: "AuditSwarm",
  category: "Business & Professional Services",
  classification: "Business/Technology",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://AuditSwarm.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AuditSwarm - Workflow Sharing Platform for Internal Auditors',
    description: 'A platform for internal auditors to discover and share AI-powered audit workflows built with well-designed prompts and context engineering.',
    siteName: 'AuditSwarm',
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: 'AuditSwarm - Professional Audit Workflow Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditSwarm - Workflow Sharing Platform for Internal Auditors',
    description: 'A platform for internal auditors to discover and share AI-powered audit workflows built with context engineering.',
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
    'audience': 'Internal Auditors, Audit Professionals',
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

// Organization JSON-LD structured data
function OrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://AuditSwarm.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AuditSwarm',
    url: baseUrl,
    logo: `${baseUrl}/queen.png`,
    description: 'A platform for internal auditors to discover and share AI-powered audit workflows built with context engineering.',
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://AuditSwarm.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AuditSwarm',
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