import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { getFeaturedTools } from '@/lib/db/tools'
import { ToolCard } from '@/components/tools/ToolCard'

// Revalidate homepage every 60 seconds to show updated featured tools
export const revalidate = 60

export default async function HomePage() {
  // Fetch featured/trending tools
  let featuredTools: any[] = []
  try {
    featuredTools = await getFeaturedTools(3)
  } catch (error) {
    console.error('Error fetching featured tools:', error)
  }

  return (
    <div className="flex flex-col relative">
      {/* Hero Section */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in border border-amber-200">
            🐝 #1 Open Source Audit Platform
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
            AuditSwarm
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-in px-4">
            Discover and share tools across Microsoft Copilot, OpenAI, Claude, Gemini, and more.
            Accelerate your audit workflows with community-tested solutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-in">
            <Link href="/browse">
              <Button size="lg" className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold bg-amber-500 hover:bg-amber-600 text-black border-0 shadow-md">
                Explore the Hive
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline" className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
                Share Your Tool
              </Button>
            </Link>
          </div>

          {/* Featured Tools */}
          {featuredTools.length > 0 && (
            <div className="animate-in">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Featured Tools</h2>
                </div>
                <Link href="/browse" className="hidden md:block">
                  <Button variant="outline" size="sm" className="bg-white">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {featuredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
