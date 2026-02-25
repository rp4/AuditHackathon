"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Plus, Trophy, Library } from "lucide-react"
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
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const site = useSiteConfig()

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

  return (
    <header
      className={`allstars-header sticky top-0 z-50 transition-transform duration-300 border-b-4 border-[#c8102e] shadow-[0_4px_0px_#c8102e,0_6px_20px_rgba(26,26,46,0.4)] ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      style={{ background: 'linear-gradient(180deg, #002868 0%, #001a4d 100%)' }}
    >
      <div className="w-full px-3 md:px-6 h-[72px] flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="relative rounded-lg w-9 h-9 sm:w-11 sm:h-11 overflow-hidden transition-all duration-150 ease-out active:scale-95 hover:opacity-80">
              <Image
                src={site.logo}
                alt={site.name}
                fill
                className="object-cover"
                sizes="44px"
                priority
              />
            </Link>
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
          </nav>
        </div>
      </div>
    </header>
  )
}
