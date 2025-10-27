'use client'

import { use, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Download, Share2, Flag, ExternalLink } from 'lucide-react'
import dynamic from 'next/dynamic'

// CRITICAL: Load Univer client-side only to prevent SSR duplicate initialization
const UniverDocumentViewer = dynamic(
  () => import('@/components/univer/UniverDocumentViewer').then(mod => ({ default: mod.UniverDocumentViewer })),
  { ssr: false }
)

// Lazy load heavy components for better performance
const RatingSection = dynamic(
  () => import('@/components/agents/RatingSection').then(mod => ({ default: mod.RatingSection })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-32 bg-muted rounded"></div>
  }
)

const ShareDialog = dynamic(
  () => import('@/components/agents/ShareDialog').then(mod => ({ default: mod.ShareDialog })),
  { ssr: false }
)

import { useAgent } from '@/hooks/useAgents'
import { useIncrementViews } from '@/hooks/useAgents'
import { trackDownload, createReport } from '@/lib/supabase/mutations'
import { FavoriteButton } from '@/components/agents/FavoriteButton'
import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: slug } = use(params)
  const supabase = createClient()

  // Get current user
  const [user, setUser] = useState<any>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isReporting, setIsReporting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase])

  // Fetch agent data
  const { data: agent, isLoading, error } = useAgent(slug, user?.id)
  const { mutate: incrementViews } = useIncrementViews()

  // Track view on mount
  useEffect(() => {
    if (agent?.id) {
      incrementViews(agent.id)
    }
  }, [agent?.id, incrementViews])

  // Handle download
  const handleDownloadDocument = async () => {
    if (!agent || !agent.markdown_file_url) return

    // Track download
    await trackDownload({
      agent_id: agent.id,
      user_id: user?.id || null,
    })

    // Trigger download of the Univer document
    try {
      const { triggerDocumentDownload } = await import('@/lib/supabase/storage')
      await triggerDocumentDownload(agent.markdown_file_url, `${agent.slug}-documentation.univer`)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  // Handle share dialog
  const handleShare = () => {
    setShareDialogOpen(true)
  }

  // Handle report
  const handleReport = async () => {
    if (!user) {
      toast.error('Please sign in to report this agent.')
      return
    }

    if (!agent) return

    setIsReporting(true)
    try {
      await createReport(agent.id, user.id)
      toast.success('Report submitted. Thank you for reporting. We will review this agent.')
    } catch (error: any) {
      // Check if already reported
      if (error?.code === '23505') {
        toast.error('You have already reported this agent.')
      } else {
        toast.error('Failed to submit report. Please try again.')
      }
    } finally {
      setIsReporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/browse">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Platforms */}
            {agent.agent_platforms && agent.agent_platforms.length > 0 && (
              <>
                {agent.agent_platforms.map((ap: any) => (
                  <span
                    key={ap.platform_id}
                    className="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary"
                  >
                    {ap.platform?.name || 'Unknown Platform'}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">•</span>
              </>
            )}
            <span className="text-xs text-muted-foreground">v{agent.version}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(agent.updated_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-3">{agent.name}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {agent.description}
          </p>
        </div>

        {/* Tags */}
        {agent.tags && agent.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-3 py-1.5 rounded-full hover:bg-muted/80 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex flex-wrap items-center gap-4 pb-6 border-b">
          {/* Author */}
          <Link
            href={`/profile/${agent.profile.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {agent.profile.avatar_url ? (
              <Image
                src={agent.profile.avatar_url}
                alt={agent.profile.full_name || agent.profile.username}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs">
                {agent.profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium hover:underline">
              {agent.profile.full_name || agent.profile.username}
            </span>
          </Link>

          <span className="text-muted-foreground">•</span>

          {/* Stats */}
          <div className="text-sm text-muted-foreground">
            {agent.downloads_count} downloads
          </div>
          <div className="text-sm text-muted-foreground">
            {agent.views_count} views
          </div>

          {/* Action Buttons */}
          <div className="ml-auto flex flex-wrap gap-3">
            <Button
              variant="ghost"
              size="default"
              onClick={handleReport}
              disabled={isReporting}
            >
              <Flag className="h-4 w-4 mr-2" />
              {isReporting ? 'Reporting...' : 'Report'}
            </Button>
            <Button variant="outline" size="default" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <FavoriteButton
              agentId={agent.id}
              userId={user?.id}
              initialFavorited={agent.user_favorited}
              favoritesCount={agent.favorites_count}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Download Button */}
              <div className="mb-6">
                <Button onClick={handleDownloadDocument} size="lg" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download Documentation
                </Button>
              </div>

              {/* Univer Document Viewer */}
              {agent.markdown_file_url ? (
                <UniverDocumentViewer
                  documentPath={agent.markdown_file_url}
                  agentSlug={agent.slug}
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No documentation available for this agent.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ratings & Reviews */}
          <Card>
            <CardContent className="pt-6">
              <RatingSection
                agentId={agent.id}
                userId={user?.id}
                averageRating={agent.avg_rating}
                totalRatings={agent.total_ratings}
              />
            </CardContent>
          </Card>
      </div>

      {/* Share Dialog */}
      {agent && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          agent={agent}
        />
      )}
    </div>
  )
}
