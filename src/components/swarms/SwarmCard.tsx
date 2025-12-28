import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Heart, GitBranch, Check } from 'lucide-react'
import { getCategoryColor } from '@/lib/utils/categoryColors'

interface SwarmCardProps {
  swarm: {
    id: string
    name: string
    slug: string
    description: string
    is_featured: boolean
    rating_avg: number
    rating_count: number
    favorites_count: number
    isFavorited?: boolean
    workflowNodes?: string
    workflowEdges?: string
    category?: {
      id: string
      name: string
    }
    user: {
      id: string
      name?: string
      email: string
      image?: string
    }
  }
  showAuthor?: boolean
  selectionMode?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
}

function SwarmCardComponent({ swarm, showAuthor = true, selectionMode = false, isSelected = false, onSelect }: SwarmCardProps) {
  // Count nodes to show workflow complexity
  let nodeCount = 0
  try {
    if (swarm.workflowNodes) {
      const nodes = JSON.parse(swarm.workflowNodes)
      nodeCount = nodes.length
    }
  } catch {
    // Ignore parse errors
  }

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.preventDefault()
      onSelect(swarm.id)
    }
  }

  const cardContent = (
    <Card className={`h-full hover:shadow-xl transition-all duration-150 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] active:shadow-md cursor-pointer relative ${isSelected ? 'ring-2 ring-amber-500 bg-amber-50/50' : ''}`}>
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-white border-stone-300 hover:border-amber-400'}`}>
          {isSelected && <Check className="h-4 w-4 text-white" />}
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg line-clamp-2 pr-8">{swarm.name}</CardTitle>
          {swarm.is_featured && !selectionMode && (
            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              Featured
            </div>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {swarm.description}
        </CardDescription>
      </CardHeader>
        <CardContent className="space-y-4">
          {/* Category & Workflow Stats */}
          <div className="flex items-center justify-between">
            {swarm.category && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(swarm.category.name, true)}`}>
                {swarm.category.name}
              </span>
            )}
            {!swarm.category && <div />}
            {nodeCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span>{nodeCount} {nodeCount === 1 ? 'step' : 'steps'}</span>
              </div>
            )}
          </div>

          {/* Author & Stats */}
          {showAuthor && swarm.user && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {swarm.user.image ? (
                  <Image
                    src={swarm.user.image}
                    alt={swarm.user.name || swarm.user.email}
                    width={24}
                    height={24}
                    className="rounded-full"
                    loading="lazy"
                    sizes="24px"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                    {(swarm.user.name || swarm.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {swarm.user.name || swarm.user.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{swarm.rating_avg.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart
                    className={`h-4 w-4 ${
                      swarm.isFavorited
                        ? 'fill-pink-500 text-pink-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span className={swarm.isFavorited ? 'text-pink-500' : 'text-muted-foreground'}>
                    {swarm.favorites_count}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )

  if (selectionMode) {
    return <div onClick={handleClick}>{cardContent}</div>
  }

  return <Link href={`/swarms/${swarm.slug}`}>{cardContent}</Link>
}

export const SwarmCard = memo(SwarmCardComponent)
