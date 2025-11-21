'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Loader2, Upload, LogOut, Edit, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserTools, useUserProfile, useFavorites } from '@/hooks/useTools'
import { ToolCard } from '@/components/tools/ToolCard'
import { signOut } from 'next-auth/react'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user: currentUser } = useAuth()
  const { data: profile, isLoading: loadingProfile } = useUserProfile(resolvedParams.id)
  const { data: tools = [], isLoading: loadingTools } = useUserTools(resolvedParams.id)
  const { data: favoritesData, isLoading: loadingFavorites } = useFavorites()

  const isOwnProfile = currentUser?.id === resolvedParams.id
  const favorites = favoritesData?.favorites || []

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The user profile you're looking for doesn't exist.
          </p>
          <Link href="/browse">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatUsername = (name?: string, email?: string) => {
    if (name) {
      return `@${name.toLowerCase().replace(/\s+/g, '')}`
    }
    return `@${email.split('@')[0]}`
  }

  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div>
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name || profile.email}
                      className="h-32 w-32 rounded-full object-cover ring-4 ring-purple-200"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-5xl font-bold text-white ring-4 ring-purple-200">
                      {(profile.name || profile.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name, Username, Bio, and Links */}
                <div className="flex flex-col justify-center">
                  <h1 className="text-4xl font-bold mb-1">
                    {profile.name || profile.email.split('@')[0]}
                  </h1>
                  <p className="text-muted-foreground text-lg mb-3">
                    {formatUsername(profile.name, profile.email)}
                  </p>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-muted-foreground mb-4 max-w-xl">{profile.bio}</p>
                  )}

                  {/* Links */}
                  {(profile.website || profile.linkedin_url) && (
                    <div className="flex items-center gap-4 text-sm">
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div className="flex gap-3">
                  <Link href={`/profile/${profile.username || resolvedParams.id}/edit`}>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent border-b rounded-none h-auto p-0">
            <TabsTrigger
              value="created"
              className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4"
            >
              <Upload className="h-4 w-4" />
              Created Agents ({tools.length})
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="favorites"
                className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Favorites ({favorites.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Created Agents Tab */}
          <TabsContent value="created">
            {loadingTools ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tools.length === 0 ? (
              <Card className="shadow-sm bg-white">
                <CardContent className="py-20">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-8 text-lg">
                      No agents created yet
                    </p>
                    {isOwnProfile && (
                      <Link href="/add">
                        <Button variant="outline" size="lg">
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Your First Agent
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} showAuthor={false} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          {isOwnProfile && (
            <TabsContent value="favorites">
              {loadingFavorites ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : favorites.length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <p className="text-muted-foreground text-lg">
                        No favorites yet
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {favorites.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Member Since */}
        <div className="text-center mt-16 mb-8 text-base text-muted-foreground">
          Member since {formatJoinDate(profile.createdAt)}
        </div>
      </div>
    </div>
  )
}
