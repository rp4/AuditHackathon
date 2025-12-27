"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, User, Shield } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const router = useRouter()
  const { user, isAuthenticated, signIn } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check admin status
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch('/api/user/admin-status')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin))
        .catch(console.error)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        // Scrolling up or at top
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleAddClick = () => {
    if (isAuthenticated) {
      router.push('/upload')
    } else {
      signIn('/upload')
    }
  }

  return (
    <header className={`border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="container mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
        <Link href="/browse" className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 hover:opacity-80 transition-all duration-150 ease-out active:scale-95">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 shadow-lg shadow-amber-500/50 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl md:text-5xl">🐝</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg sm:text-xl md:text-3xl">AuditSwarm</span>
            <span className="text-xs sm:text-sm md:text-base text-gray-500 hidden sm:block">For Auditors, By Auditors</span>
          </div>
        </Link>

        <nav className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <Button variant="default" size="lg" className="gap-2 text-base md:text-lg px-3 sm:px-4 md:px-6" onClick={handleAddClick}>
            <Upload className="h-5 w-5 md:h-6 md:w-6" />
            <span className="hidden sm:inline">Add</span>
          </Button>

          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="lg" className="gap-2 text-base md:text-lg px-3 sm:px-4 md:px-6">
                <Shield className="h-5 w-5 md:h-6 md:w-6" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}

          {console.log('[Header] Rendering, isAuthenticated:', isAuthenticated)}
          {isAuthenticated ? (
            <>
              {/* Desktop - show image only */}
              <Link href={`/profile/${user?.username || user?.id}`} className="hidden md:block hover:opacity-80 transition-all duration-150 ease-out active:scale-90">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user?.name || 'Profile'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white font-semibold">
                      {user?.name?.[0] || user?.email?.[0] || <User className="h-5 w-5" />}
                    </div>
                  )}
                </div>
              </Link>

              {/* Mobile - show image only */}
              <Link href={`/profile/${user?.username || user?.id}`} className="md:hidden transition-all duration-150 ease-out active:scale-90">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user?.name || 'Profile'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white font-semibold">
                      {user?.name?.[0] || user?.email?.[0] || <User className="h-5 w-5" />}
                    </div>
                  )}
                </div>
              </Link>
            </>
          ) : (
            <Button variant="default" size="lg" className="text-sm sm:text-base md:text-lg px-3 sm:px-4 md:px-6" onClick={() => {
              console.log('[Header] Sign In button clicked')
              signIn()
            }}>
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
