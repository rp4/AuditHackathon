'use client'

import { usePathname } from 'next/navigation'
import Header from "@/components/layouts/Header"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "sonner"
import Link from "next/link"
import { SiteProvider, useSiteConfig } from "@/lib/site/SiteContext"

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const site = useSiteConfig()
  const isLandingPage = pathname === '/'
  const isBrowsePage = pathname === '/browse'
  const isCreatePage = pathname === '/create'
  const isCanvasPage = isBrowsePage || isCreatePage

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      {/* Fixed Background */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `url(${site.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        {isLandingPage ? null : (
          <div className="shrink-0">
            <Header />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {isCanvasPage ? (
              children
            ) : (
              <div className="flex-1 overflow-y-auto">
                <main className="min-h-full">
                  {children}
                </main>
                {!isLandingPage && (
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
                          <Link href="/" className="hover:text-muted-foreground transition-colors">Home</Link>
                          <span>&middot;</span>
                          <Link href="/browse" className="hover:text-muted-foreground transition-colors">Browse</Link>
                          <span>&middot;</span>
                          <Link href="/create" className="hover:text-muted-foreground transition-colors">Create</Link>
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
      <QueryProvider>
        <SiteProvider>
          <LayoutInner>{children}</LayoutInner>
        </SiteProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
