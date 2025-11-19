'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from "@/components/layouts/Header"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import Link from "next/link"

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isBrowsePage = pathname === '/browse'
  const [showHeader, setShowHeader] = useState(true)

  // Listen for header visibility changes from browse page
  useEffect(() => {
    if (!isBrowsePage) {
      setShowHeader(true)
      return
    }

    const handleHeaderVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<{ visible: boolean }>
      setShowHeader(customEvent.detail.visible)
    }

    window.addEventListener('browseHeaderVisibility', handleHeaderVisibility)
    return () => window.removeEventListener('browseHeaderVisibility', handleHeaderVisibility)
  }, [isBrowsePage])

  return (
    <ErrorBoundary>
      <QueryProvider>
        <Toaster position="top-right" richColors closeButton />
        {isBrowsePage ? (
          <div className="h-screen flex flex-col overflow-hidden">
            <div
              className="shrink-0 transition-transform duration-300 ease-in-out"
              style={{
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)'
              }}
            >
              <Header />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              {children}
            </div>
          </div>
        ) : (
          <>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <footer className="bg-muted mt-auto">
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-semibold mb-2">Audit Toolbox</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    The premier platform for sharing audit tools
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>© 2025 Audit Toolbox. All rights reserved.</span>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )}
      </QueryProvider>
    </ErrorBoundary>
  )
}
