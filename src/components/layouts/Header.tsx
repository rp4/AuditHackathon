"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, User, Shield, Trophy, Library } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useIsAdmin } from "@/hooks/useSwarms"
import { useCopilotPanelStore } from "@/lib/copilot/stores/panelStore"
import { useSiteConfig } from "@/lib/site/SiteContext"

function AllStarsNavLink({ href, icon, label, pathname }: {
  href: string
  icon: React.ReactNode
  label: string
  pathname: string
}) {
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href))
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded font-bold text-xs sm:text-sm uppercase tracking-wider border-2 transition-all duration-200
        ${isActive
          ? 'bg-[#c8102e] text-white border-white shadow-[2px_2px_0px_rgba(0,0,0,0.3)]'
          : 'text-white/80 border-transparent hover:bg-[rgba(200,16,46,0.3)] hover:text-white hover:border-[#c8102e]'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, signIn } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { data: adminData } = useIsAdmin()
  const isAdmin = adminData?.isAdmin ?? false
  const { isOpen: copilotOpen, togglePanel: toggleCopilot } = useCopilotPanelStore()
  const site = useSiteConfig()
  const isAllStars = site.theme === 'allstars'

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleAddClick = () => {
    router.push('/create')
  }

  if (isAllStars) {
    return (
      <header
        className={`allstars-header sticky top-0 z-50 transition-transform duration-300 border-b-4 border-[#c8102e] shadow-[0_4px_0px_#c8102e,0_6px_20px_rgba(26,26,46,0.4)] ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ background: 'linear-gradient(180deg, #002868 0%, #001a4d 100%)' }}
      >
        <div className="w-full px-3 md:px-6 h-[72px] flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleCopilot}
                className={`relative rounded-lg w-9 h-9 sm:w-11 sm:h-11 overflow-hidden transition-all duration-150 ease-out active:scale-95 hover:opacity-80 ${copilotOpen ? 'ring-2 ring-[#c8102e]' : ''}`}
              >
                <Image
                  src={site.logo}
                  alt={`${site.name} Copilot`}
                  fill
                  className="object-cover"
                  sizes="44px"
                  priority
                />
              </button>
              <Link href="/browse" className="hover:opacity-80 transition-all duration-150">
                <span
                  className="text-white text-lg sm:text-xl md:text-2xl uppercase tracking-[3px] font-normal"
                  style={{
                    fontFamily: 'var(--font-righteous), cursive',
                    textShadow: '2px 2px 0px #c8102e',
                  }}
                >
                  {site.name}
                </span>
              </Link>
            </div>
            <nav className="flex items-center gap-1 md:gap-2">
              <AllStarsNavLink href="/browse" icon={<Library className="h-4 w-4" />} label="Workflows" pathname={pathname} />
              <AllStarsNavLink href="/create" icon={<Plus className="h-4 w-4" />} label="Create" pathname={pathname} />
              <AllStarsNavLink href="/leaderboard" icon={<Trophy className="h-4 w-4" />} label="Leaderboard" pathname={pathname} />
              {isAdmin && (
                <AllStarsNavLink href="/admin" icon={<Shield className="h-4 w-4" />} label="Admin" pathname={pathname} />
              )}
            </nav>
          </div>

          {/* Right: User */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.name && (
                  <span className="hidden lg:block text-white font-bold text-sm">{user.name}</span>
                )}
                <Link href={`/profile/${user?.username || user?.id}`} className="hover:opacity-80 transition-all duration-150 active:scale-90">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white">
                    {user?.image ? (
                      <Image src={user.image} alt={user?.name || 'Profile'} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[#c8102e] text-white font-semibold">
                        {user?.name?.[0] || user?.email?.[0] || <User className="h-5 w-5" />}
                      </div>
                    )}
                  </div>
                </Link>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="text-white border-2 border-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider hover:bg-[#c8102e] hover:border-[#c8102e] transition-all duration-200 shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="w-full px-3 md:px-5 h-20 md:h-24 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <button
            onClick={toggleCopilot}
            className={`relative rounded-xl w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 shadow-lg overflow-hidden transition-all duration-150 ease-out active:scale-95 hover:opacity-80 ${copilotOpen ? 'shadow-brand-500/80 ring-2 ring-brand-400' : 'shadow-brand-500/50'}`}
          >
            <Image
              src={site.logo}
              alt={`${site.name} Copilot`}
              fill
              className="object-cover"
              sizes="64px"
              priority
            />
          </button>
          <Link href="/browse" className="flex flex-col hover:opacity-80 transition-all duration-150 ease-out active:scale-95">
            <span className="font-black text-lg sm:text-xl md:text-3xl">{site.name}</span>
            <span className="text-xs sm:text-sm md:text-base text-gray-500 hidden sm:block">{site.tagline}</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <Button variant="default" size="lg" className="gap-2 text-base md:text-lg px-3 sm:px-4 md:px-6" onClick={handleAddClick}>
            <Plus className="h-5 w-5 md:h-6 md:w-6" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          <Link href="/browse">
            <Button variant="outline" size="lg" className="gap-2 text-base md:text-lg px-3 sm:px-4 md:px-6">
              <Library className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden sm:inline">Workflows</span>
            </Button>
          </Link>

          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="lg" className="gap-2 text-base md:text-lg px-3 sm:px-4 md:px-6">
                <Shield className="h-5 w-5 md:h-6 md:w-6" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <Link href={`/profile/${user?.username || user?.id}`} className="hover:opacity-80 transition-all duration-150 ease-out active:scale-90">
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user?.name || 'Profile'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0] || user?.email?.[0] || <User className="h-5 w-5" />}
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Button variant="default" size="lg" className="text-sm sm:text-base md:text-lg px-3 sm:px-4 md:px-6" onClick={() => signIn()}>
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
