'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from "@/components/layouts/Header"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import Link from "next/link"
import { CopilotOptionsProvider } from "@/lib/copilot/CopilotOptionsContext"
import { CopilotPanel } from "@/components/copilot/CopilotPanel"
import { SiteProvider, useSiteConfig } from "@/lib/site/SiteContext"

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const site = useSiteConfig()
  const isLandingPage = pathname === '/'
  const isBrowsePage = pathname === '/browse'
  const isProfilePage = pathname?.startsWith('/profile/')
  const isCreatePage = pathname === '/create'
  const isSwarmPage = pathname?.startsWith('/swarms/') // includes detail and edit pages
  const isCopilotPage = pathname?.startsWith('/copilot')
  const isCanvasPage = isBrowsePage || isCreatePage || isSwarmPage
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
    <>
      <Toaster position="top-right" richColors closeButton />
      {/* Fixed Background - theme-aware */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `url(${site.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {isCopilotPage ? (
        // Copilot gets its own full-screen layout (no header, no footer, no background)
        <>{children}</>
      ) : (
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Header - always full width on top */}
          {isLandingPage ? null : isBrowsePage ? (
            <div
              className="shrink-0 transition-transform duration-300 ease-in-out"
              style={{
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)'
              }}
            >
              <Header />
            </div>
          ) : (
            <div className="shrink-0">
              <Header />
            </div>
          )}

          {/* Content area: copilot panel + page */}
          <div className="flex-1 flex overflow-hidden">
            <CopilotPanel />
            <div className="flex-1 flex flex-col overflow-hidden">
              {isCanvasPage ? (
                children
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <main className="min-h-full">
                    {children}
                  </main>
                  {!isProfilePage && !isLandingPage && (
                    <footer className="bg-muted mt-auto">
                      <div className="container mx-auto px-4 py-8">
                        <div className="flex flex-col items-center text-center">
                          <h3 className="font-semibold mb-2">{site.name}</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            The premier platform for sharing audit workflows
                          </p>
                          <p className="text-sm text-muted-foreground">
                            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
                          </p>
                          <div className="flex flex-wrap justify-center items-center gap-x-3 mt-4 text-xs text-muted-foreground/50">
                            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
                            <span>&middot;</span>
                            <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
                            <span>&middot;</span>
                            <Link href="/about" className="hover:text-muted-foreground transition-colors">About</Link>
                            <span>&middot;</span>
                            <Link href="/contact" className="hover:text-muted-foreground transition-colors">Contact</Link>
                          </div>
                        </div>
                      </div>
                    </footer>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <QueryProvider>
        <CopilotOptionsProvider>
        <SiteProvider>
          <LayoutInner>{children}</LayoutInner>
        </SiteProvider>
        </CopilotOptionsProvider>
        </QueryProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
