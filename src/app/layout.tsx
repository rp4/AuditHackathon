import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/layouts/Header"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Use font-display: swap for better performance
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Audit Agents - AI Agent Sharing Platform for Auditors",
    template: "%s | Audit Agents"
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>',
  },
  description: "Discover, share, and collaborate on platform-agnostic AI agents for audit automation. Supporting OpenAI, Claude, Gemini, LangChain, and Copilot.",
  keywords: ["AI agents", "audit automation", "OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "audit", "financial audit", "AI tools"],
  authors: [{ name: "OpenAuditSwarms" }],
  creator: "OpenAuditSwarms",
  publisher: "OpenAuditSwarms",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://openauditswarms.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'OpenAuditSwarms - AI Agent Sharing Platform',
    description: 'Discover and share platform-agnostic AI agents for audit automation',
    siteName: 'OpenAuditSwarms',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'OpenAuditSwarms Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAuditSwarms - AI Agent Sharing Platform',
    description: 'Discover and share platform-agnostic AI agents for audit automation',
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
        <ErrorBoundary>
          <QueryProvider>
            <Toaster position="top-right" richColors closeButton />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <footer className="bg-muted mt-auto">
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-semibold mb-2">Audit Agents</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    The premier platform for sharing AI audit agents
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>© 2025 Audit Agents. All rights reserved.</span>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                  </div>
                </div>
              </div>
            </footer>
          </QueryProvider>
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  )
}