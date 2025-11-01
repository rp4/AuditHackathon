"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Linkedin } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Profile = {
  username: string
}

// Get singleton instance outside component to ensure consistency
const supabase = createClient()

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

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

  const handleProfileClick = () => {
    if (profile?.username) {
      router.push(`/profile/${profile.username}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-xl group-hover:shadow-purple-500/60 transition-all overflow-hidden">
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
            {/* Upload button - icon only on mobile, full button on desktop */}
            <Link href="/add" className="md:hidden">
              <Button variant="ghost" size="icon">
                <Upload className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/add" className="hidden md:block">
              <Button variant="outline" className="font-semibold border-2 hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>

            {user ? (
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-2 focus:outline-none"
                aria-label="Go to profile"
              >
                {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                  <Image
                    src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                    alt={user.user_metadata?.name || user.user_metadata?.full_name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-gray-200 hover:border-purple-500 transition-all object-cover cursor-pointer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 border-gray-200 hover:border-purple-500 transition-all cursor-pointer">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
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

      </div>
    </header>
  )
}