'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Loader2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserTools, useUserProfile } from '@/hooks/useTools'
import { ToolCard } from '@/components/tools/ToolCard'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user: currentUser } = useAuth()
  const { data: profile, isLoading: loadingProfile } = useUserProfile(resolvedParams.id)
  const { data: tools = [], isLoading: loadingTools } = useUserTools(resolvedParams.id)

  const isOwnProfile = currentUser?.id === resolvedParams.id

  if (loadingProfile) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The user profile you're looking for doesn't exist.
          </p>
          <Link href="/browse">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/browse">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>
      </Link>

      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold shrink-0">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name || profile.email}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                (profile.name || profile.email).charAt(0).toUpperCase()
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">
                  {profile.name || profile.email}
                </h1>
                {isOwnProfile && (
                  <Link href="/add">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Tool
                    </Button>
                  </Link>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center gap-4">
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <span className="text-sm text-muted-foreground">
                  Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Section */}
      <Tabs defaultValue="tools" className="w-full">
        <TabsList>
          <TabsTrigger value="tools">
            Tools ({tools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          {loadingTools ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tools.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile
                      ? "You haven't created any tools yet."
                      : "This user hasn't created any tools yet."}
                  </p>
                  {isOwnProfile && (
                    <Link href="/add">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Tool
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} showAuthor={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
