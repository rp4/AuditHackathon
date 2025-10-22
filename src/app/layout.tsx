import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/layouts/Header"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Audit Agents - AI Agent Sharing Platform for Auditors",
  description: "Discover, share, and collaborate on AI agents for audit automation across multiple platforms",
  keywords: "AI agents, audit automation, OpenAI, Claude, Gemini, LangChain, Copilot",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}