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
  description: "Discover, share, and collaborate on platform-agnostic AI tools for audit automation. Supporting OpenAI, Claude, Gemini, LangChain, and Copilot. For Auditors, By Auditors.",
  keywords: ["AI tools", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "audit", "financial audit", "AI agents", "AuditSwarm"],
  authors: [{ name: "AuditSwarm" }],
  creator: "AuditSwarm",
  publisher: "AuditSwarm",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://auditswarm.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AuditSwarm - AI Tool Sharing Platform',
    description: 'Discover and share platform-agnostic AI tools for audit automation. For Auditors, By Auditors.',
    siteName: 'AuditSwarm',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'AuditSwarm Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditSwarm - AI Tool Sharing Platform',
    description: 'Discover and share platform-agnostic AI tools for audit automation. For Auditors, By Auditors.',
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