"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Menu, X, ChevronRight, Linkedin, LogOut, User as UserIcon } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Profile = {
  username: string
}

// Get singleton instance outside component to ensure consistency
const supabase = createClient()

export default function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get initial session and profile
    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }
    }

    fetchUserAndProfile()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error logging in with LinkedIn:', error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push("/")
  }

  const handleProfileClick = () => {
    if (profile?.username) {
      router.push(`/profile/${profile.username}`)
      setDropdownOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all overflow-hidden">
              <Image
                src="/logo.png"
                alt="Audit Agents Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl">Audit Agents</div>
              <div className="text-xs text-gray-500">For Auditors By Auditors</div>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href="/add" className="hidden md:block">
              <Button variant="outline" className="font-semibold border-2 hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <Image
                      src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                      alt={user.user_metadata?.name || user.user_metadata?.full_name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-gray-200 hover:border-purple-500 transition-all object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 border-gray-200 hover:border-purple-500 transition-all">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.user_metadata?.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleProfileClick}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                className="font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t bg-white absolute top-20 left-0 right-0 shadow-2xl">
            <div className="container mx-auto px-4">
              <div className="flex flex-col space-y-4">
                <Link href="/add" className="flex items-center justify-between py-3 px-4 text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                  Upload Agent
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}