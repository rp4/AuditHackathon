import { headers } from 'next/headers'
import { HeroCTA } from '@/components/landing/HeroCTA'
import { getSiteConfig } from '@/lib/site/config'

export default async function HomePage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const site = getSiteConfig(host)

  return (
    <div className="flex flex-col relative min-h-screen items-center justify-center">
      {/* Hero Section */}
      <section className="relative px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in border border-brand-200">
            Community-Driven Workflow Templates
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in">
            {site.name}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-in px-4">
            Move beyond prompt engineering.
            Discover, share, and save workflow templates for all your auditing needs.
          </p>

          {/* CTA Buttons */}
          <HeroCTA />
        </div>
      </section>

    </div>
  )
}
