import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Heart } from 'lucide-react'

interface ToolCardProps {
  tool: {
    id: string
    name: string
    slug: string
    description: string
    is_featured: boolean
    rating_avg: number
    rating_count: number
    favorites_count: number
    isFavorited?: boolean
    category?: {
      id: string
      name: string
    }
    tool_platforms?: Array<{
      id: string
      platform: {
        id: string
        name: string
      }
    }>
    user: {
      id: string
      name?: string
      email: string
      image?: string
    }
  }
  showAuthor?: boolean
}

function ToolCardComponent({ tool, showAuthor = true }: ToolCardProps) {
  return (
    <Link href={`/tools/${tool.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-150 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] active:shadow-md cursor-pointer bg-white">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg line-clamp-2">{tool.name}</CardTitle>
            {tool.is_featured && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                Featured
              </div>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {tool.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platforms */}
          {tool.tool_platforms && tool.tool_platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tool.tool_platforms.map((tp) => (
                <span
                  key={tp.id}
                  className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium"
                >
                  {tp.platform.name}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{tool.rating_avg.toFixed(1)}</span>
              {tool.rating_count > 0 && (
                <span className="text-muted-foreground">
                  ({tool.rating_count})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Heart
                className={`h-4 w-4 ${
                  tool.isFavorited
                    ? 'fill-pink-500 text-pink-500'
                    : 'text-muted-foreground'
                }`}
              />
              <span className={tool.isFavorited ? 'text-pink-500' : 'text-muted-foreground'}>
                {tool.favorites_count}
              </span>
            </div>
          </div>

          {/* Category */}
          {tool.category && (
            <div className="text-xs text-muted-foreground">
              {tool.category.name}
            </div>
          )}

          {/* Author */}
          {showAuthor && tool.user && (
            <div className="flex items-center gap-2 pt-4 border-t">
              {tool.user.image ? (
                <Image
                  src={tool.user.image}
                  alt={tool.user.name || tool.user.email}
                  width={24}
                  height={24}
                  className="rounded-full"
                  loading="lazy"
                  sizes="24px"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                  {(tool.user.name || tool.user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {tool.user.name || tool.user.email}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Memoized export to prevent unnecessary re-renders
export const ToolCard = memo(ToolCardComponent)
