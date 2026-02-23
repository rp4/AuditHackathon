import type { Metadata } from "next"
import { Inter, Righteous } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { RootLayoutClient } from "./layout.client"
import { getSiteConfig } from "@/lib/site/config"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Use font-display: swap for better performance
  variable: "--font-inter",
})

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-righteous",
})

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host.includes('allstar') ? 'https://auditallstars.com' : 'https://AuditSwarm.com')

  return {
    title: {
      default: `${site.name} - Workflow Sharing Platform for Auditors`,
      template: `%s | ${site.name}`
    },
    icons: {
      icon: site.favicon,
      apple: site.favicon,
    },
    description: site.description,
    keywords: ["audit workflows", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "audit", "AI agents", site.name, "internal audit", "context engineering", "prompt engineering", "audit software", "audit technology"],
    authors: [{ name: "Rich Penfil" }],
    creator: site.name,
    publisher: site.name,
    category: "Business & Professional Services",
    classification: "Business/Technology",
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: '/',
      title: `${site.name} - Workflow Sharing Platform for Internal Auditors`,
      description: site.description,
      siteName: site.name,
      images: [{
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: `${site.name} - Professional Audit Workflow Platform`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${site.name} - Workflow Sharing Platform for Internal Auditors`,
      description: site.description,
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
      'company': site.name,
      'industry': 'Professional Services, Accounting, Audit',
    },
    verification: {
      // Add when available
      // google: 'your-google-verification-code',
    },
  }
}

// Organization JSON-LD structured data
async function OrganizationJsonLd() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host.includes('allstar') ? 'https://auditallstars.com' : 'https://AuditSwarm.com')

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: baseUrl,
    logo: `${baseUrl}${site.logo}`,
    description: site.description,
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
async function WebSiteJsonLd() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host.includes('allstar') ? 'https://auditallstars.com' : 'https://AuditSwarm.com')

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
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
      <body className={`${inter.className} ${righteous.variable}`}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
