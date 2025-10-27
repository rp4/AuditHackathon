import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAgents, getPlatforms, getPlatformCounts } from '@/lib/supabase/queries'
import { AgentCard } from '@/components/agents/AgentCard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect logged-in users to browse page
  if (user) {
    redirect('/browse')
  }

  // Fetch featured/trending agents
  let featuredAgents: any[] = []
  try {
    featuredAgents = await getAgents({
      sortBy: 'popular',
      limit: 3,
      isPublic: true,
    })
  } catch (error) {
    console.error('Error fetching featured agents:', error)
  }

  // Fetch platforms and their counts
  let platforms: any[] = []
  let platformCounts: Record<string, number> = {}
  try {
    platforms = await getPlatforms()
    platformCounts = await getPlatformCounts()
  } catch (error) {
    console.error('Error fetching platforms:', error)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in">
            Trusted by Auditors Worldwide
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
            Audit Agents
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-in">
            Discover, share, and implement cutting-edge AI agents across OpenAI, Claude, Gemini, and more.
            Accelerate your audit workflows with community-tested solutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-in">
            <Link href="/browse">
              <Button size="lg" className="min-w-[240px] h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 bg-purple-600 hover:bg-purple-700 text-white">
                Explore Agents
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/add">
              <Button size="lg" variant="outline" className="min-w-[240px] h-14 text-lg font-semibold border-2 hover:bg-gray-50">
                Share Your Agent
              </Button>
            </Link>
          </div>

          {/* Trending Agents */}
          {featuredAgents.length > 0 && (
            <div className="animate-in">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <h2 className="text-2xl font-bold">Trending Agents</h2>
                </div>
                <Link href="/browse" className="hidden md:block">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {featuredAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              Explore by Platform
            </h2>
            <p className="text-xl text-gray-600">
              Find the perfect AI agent for your preferred platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platforms.map((platform) => (
              <Link key={platform.id} href={`/browse?platform=${platform.id}`}>
                <div className="group cursor-pointer border-2 hover:border-purple-300 transition-all duration-200 hover:shadow-xl h-full rounded-lg p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors">
                      {platform.name}
                    </h3>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {platformCounts[platform.id] || 0} agents
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 bg-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to 10x Your Audit Efficiency?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            Join other audit innovators leveraging AI to deliver better, faster, and more accurate audits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="min-w-[240px] h-14 text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100">
                Start Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
