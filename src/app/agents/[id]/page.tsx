'use client'

import { use, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Download, Share2, Flag, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'
import { useAgent } from '@/hooks/useAgents'
import { useIncrementViews } from '@/hooks/useAgents'
import { trackDownload } from '@/lib/supabase/mutations'
import { FavoriteButton } from '@/components/agents/FavoriteButton'
import { RatingSection } from '@/components/agents/RatingSection'
import { CommentsSection } from '@/components/agents/CommentsSection'
import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: slug } = use(params)
  const supabase = createClient()

  // Get current user
  const [user, setUser] = useState<any>(null)
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
    if (!agent) return

    // Track download
    await trackDownload({
      agent_id: agent.id,
      user_id: user?.id || null,
    })

    // Generate markdown file
    const content = agent.markdown_content || `# ${agent.name}\n\n${agent.description}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agent.slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
            {agent.platforms?.map((ap) => (
              <span
                key={ap.platform_id}
                className="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary"
              >
                {ap.platform.name}
              </span>
            ))}
            <span className="text-xs text-muted-foreground">•</span>
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
            <FavoriteButton
              agentId={agent.id}
              userId={user?.id}
              initialFavorited={agent.user_favorited}
              favoritesCount={agent.favorites_count}
            />
            <Button variant="outline" size="default">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="default">
              <Flag className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Markdown Documentation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Download Button */}
              <div className="mb-6">
                <Button onClick={handleDownloadDocument} size="lg" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download Documentation
                </Button>
              </div>

              {/* Markdown Content */}
              <div className="max-h-[800px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-bold prose-headings:text-foreground
                prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8 prose-h1:border-b prose-h1:pb-2
                prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                prose-p:text-foreground prose-p:leading-7
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-muted prose-pre:border prose-pre:border-border
                prose-ul:my-4 prose-li:my-1
                prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
                prose-table:border prose-th:border prose-th:bg-muted prose-td:border prose-td:px-4 prose-td:py-2
                prose-strong:text-foreground prose-strong:font-semibold
                prose-img:rounded-lg prose-img:border"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {agent.markdown_content || `# ${agent.name}\n\n${agent.description}`}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Ratings */}
          <RatingSection
            agentId={agent.id}
            userId={user?.id}
            averageRating={agent.avg_rating}
            totalRatings={agent.total_ratings}
          />

          {/* Comments */}
          <CommentsSection agentId={agent.id} userId={user?.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Category</h3>
                <p className="text-sm text-muted-foreground">
                  {agent.category?.name || 'Uncategorized'}
                </p>
              </div>

              {agent.complexity_level && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Complexity</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {agent.complexity_level}
                  </p>
                </div>
              )}

              {agent.estimated_cost && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Estimated Cost</h3>
                  <p className="text-sm text-muted-foreground">
                    ${agent.estimated_cost.toFixed(2)} per use
                  </p>
                </div>
              )}

              {agent.prerequisites && agent.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Prerequisites</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {agent.prerequisites.map((prereq, idx) => (
                      <li key={idx}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2">Created</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(agent.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Links */}
          {agent.platforms && agent.platforms.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-3">Platform Documentation</h3>
                <div className="space-y-2">
                  {agent.platforms.map((ap) => (
                    <a
                      key={ap.platform_id}
                      href={ap.platform.documentation_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm text-primary hover:underline"
                    >
                      {ap.platform.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
