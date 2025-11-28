import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
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
      {/* Fixed Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in">
            #1 Open Source Audit Platform
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
            Audit Toolbox
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-in px-4">
            Discover, share, and implement cutting-edge AI tools across Microsoft Copilot, OpenAI, Claude, Gemini, and more.
            Accelerate your audit workflows with community-tested solutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-in">
            <Link href="/browse">
              <Button size="lg" className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white">
                Explore Tools
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline" className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 bg-white hover:bg-gray-50">
                Share Your Tool
              </Button>
            </Link>
          </div>

          {/* Featured Tools */}
          {featuredTools.length > 0 && (
            <div className="animate-in">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
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

      {/* CTA Section */}
      {/* <section className="relative py-20 sm:py-32 px-4 bg-purple-600 text-white">
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6">
            Ready to 10x Your Audit Efficiency?
          </h2>
          <p className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto opacity-90">
            Join other audit innovators leveraging AI to deliver better, faster, and more accurate audits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100">
                Start Now
              </Button>
            </Link>
          </div>
        </div>
      </section> */}
    </div>
  )
}
