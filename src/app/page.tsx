import { HeroCTA } from '@/components/landing/HeroCTA'
// import { getFeaturedSwarms } from '@/lib/db/swarms'
// import { SwarmCard } from '@/components/swarms/SwarmCard'

// Revalidate homepage every 60 seconds to show updated featured swarms
export const revalidate = 60

export default async function HomePage() {
  // Fetch featured/trending swarms - commented out due to loading issue
  // let featuredSwarms: any[] = []
  // try {
  //   featuredSwarms = await getFeaturedSwarms(3)
  // } catch (error) {
  //   console.error('Error fetching featured swarms:', error)
  // }

  return (
    <div className="flex flex-col relative min-h-screen items-center justify-center">
      {/* Hero Section */}
      <section className="relative px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in border border-amber-200">
            Community-Driven Workflow Templates
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
            AuditSwarm
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-in px-4">
            Move beyond prompt engineering.
            Discover, share, and save workflow templates for all your auditing needs.
          </p>

          {/* CTA Buttons */}
          <HeroCTA />

          {/* Video Section - commented out for cleaner landing page
          <div className="animate-in max-w-4xl mx-auto">
            <video
              className="w-full rounded-lg shadow-lg"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="https://storage.googleapis.com/toolbox-478717-storage/public/swarmvid.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          */}

          {/* Featured Swarms - Commented out due to loading issue
          {featuredSwarms.length > 0 && (
            <div className="animate-in">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Featured Templates</h2>
                </div>
                <Link href="/browse" className="hidden md:block">
                  <Button variant="outline" size="sm" className="bg-white">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {featuredSwarms.map((swarm) => (
                  <SwarmCard key={swarm.id} swarm={swarm} />
                ))}
              </div>
            </div>
          )}
          */}
        </div>
      </section>

    </div>
  )
}
