import { HeroCTA } from '@/components/landing/HeroCTA'

export default function HomePage() {
  return (
    <div className="flex flex-col relative min-h-screen items-center justify-center">
      {/* Hero Section */}
      <section className="relative px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-in border bg-white text-[#002868] border-[#002868]/30">
            Community-Driven Workflow Templates
          </div>

          {/* Main heading */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-normal mb-6 tracking-[4px] leading-[1.1] animate-in text-[#002868] uppercase"
            style={{
              fontFamily: 'var(--font-righteous), cursive',
              textShadow: '3px 3px 0px #c8102e',
            }}
          >
            Audit AllStars
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed animate-in px-4 text-[#002868]/80">
            Learn. Compete. Level up.<br />Master modern audit techniques.
          </p>

          {/* CTA Buttons */}
          <HeroCTA />
        </div>
      </section>
    </div>
  )
}
