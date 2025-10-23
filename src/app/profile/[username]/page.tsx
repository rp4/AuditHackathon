"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Star, Upload as UploadIcon } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Profile = {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  reputation_score: number
  created_at: string
}

type Agent = {
  id: string
  name: string
  slug: string
  description: string
  upvotes_count: number
  downloads_count: number
  avg_rating: number
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [createdAgents, setCreatedAgents] = useState<Agent[]>([])
  const [favoritedAgents, setFavoritedAgents] = useState<Agent[]>([])
  const [activeTab, setActiveTab] = useState<"created" | "favorited">("created")
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user ?? null)

      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single<Profile>()

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError)
        setLoading(false)
        return
      }

      setProfile(profileData)
      setIsOwnProfile(session?.user?.id === profileData.id)

      // Fetch created agents
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("id, name, slug, description, upvotes_count, downloads_count, avg_rating, created_at")
        .eq("user_id", profileData.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (!agentsError && agentsData) {
        setCreatedAgents(agentsData)
      }

      // Fetch favorited agents (upvoted by this user) - only for own profile
      if (session?.user?.id === profileData.id) {
        const { data: upvotesData, error: upvotesError } = await supabase
          .from("upvotes")
          .select(`
            agent_id,
            agents (
              id,
              name,
              slug,
              description,
              upvotes_count,
              downloads_count,
              avg_rating,
              created_at
            )
          `)
          .eq("user_id", profileData.id)

        if (!upvotesError && upvotesData) {
          const favorites = upvotesData
            .map((upvote: any) => upvote.agents)
            .filter((agent: any) => agent !== null)
          setFavoritedAgents(favorites)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [username, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const agents = activeTab === "created" ? createdAgents : favoritedAgents

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture ? (
                <Image
                  src={profile.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture}
                  alt={profile.full_name || profile.username}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-purple-200 object-cover"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-purple-200">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-gray-500">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-gray-700 mt-2">{profile.bio}</p>
                  )}
                </div>

                {/* Action Buttons - Only show for own profile */}
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{createdAgents.length}</p>
                  <p className="text-sm text-gray-600">Agents Created</p>
                </div>
                {isOwnProfile && (
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{favoritedAgents.length}</p>
                    <p className="text-sm text-gray-600">Favorites</p>
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold text-purple-600">{profile.reputation_score}</p>
                  <p className="text-sm text-gray-600">Reputation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Only show for own profile */}
        {isOwnProfile && (
          <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("created")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "created"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UploadIcon className="h-4 w-4" />
                  Created Agents ({createdAgents.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("favorited")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "favorited"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4" />
                  Favorited Agents ({favoritedAgents.length})
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-gray-500 text-lg">
                {activeTab === "created"
                  ? "No agents created yet"
                  : "No favorited agents yet"}
              </p>
            </div>
          ) : (
            agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all hover:scale-105"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{agent.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {agent.upvotes_count}
                    </span>
                    <span>{agent.avg_rating.toFixed(1)} ⭐</span>
                  </div>
                  <span className="text-xs">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
