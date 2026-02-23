import { headers } from 'next/headers'
import { HeroCTA } from '@/components/landing/HeroCTA'
import { getSiteConfig } from '@/lib/site/config'

export default async function HomePage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)
  const isAllStars = site.theme === 'allstars'

  return (
    <div className="flex flex-col relative min-h-screen items-center justify-center">
      {/* Hero Section */}
      <section className="relative px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in border ${
            isAllStars
              ? 'bg-white text-[#002868] border-[#002868]/30'
              : 'bg-brand-100 text-brand-800 border-brand-200'
          }`}>
            Community-Driven Workflow Templates
          </div>

          {/* Main heading */}
          {isAllStars ? (
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-normal mb-6 tracking-[4px] leading-[1.1] animate-in text-[#002868] uppercase"
              style={{
                fontFamily: 'var(--font-righteous), cursive',
                textShadow: '3px 3px 0px #c8102e',
              }}
            >
              {site.name}
            </h1>
          ) : (
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
              {site.name}
            </h1>
          )}

          <p className={`text-lg sm:text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed animate-in px-4 ${
            isAllStars ? 'text-[#002868]/80' : 'text-gray-600'
          }`}>
            {isAllStars
              ? (<>Learn. Compete. Level up.<br />Master modern audit techniques.</>)
              : 'Move beyond prompt engineering. Discover, share, and save workflow templates for all your auditing needs.'}
          </p>

          {/* CTA Buttons */}
          <HeroCTA />
        </div>
      </section>

    </div>
  )
}
