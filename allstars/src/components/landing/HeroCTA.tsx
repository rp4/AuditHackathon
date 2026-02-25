"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus } from "lucide-react"
import { useSiteConfig } from "@/lib/site/SiteContext"

export function HeroCTA() {
  const site = useSiteConfig()
  const isAllStars = site.theme === 'allstars'

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in">
      <Link href="/browse">
        <Button
          size="lg"
          className={`min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-0 shadow-md ${
            isAllStars
              ? 'bg-[#002868] hover:bg-[#001a4d] text-white'
              : 'bg-brand-500 hover:bg-brand-600 text-black'
          }`}
        >
          Browse Templates
          <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
        </Button>
      </Link>
      <Link href="/create">
        <Button
          size="lg"
          variant="outline"
          className={`min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 ${
            isAllStars
              ? 'border-[#002868] text-[#002868] bg-transparent hover:bg-[#002868] hover:text-white'
              : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
          }`}
        >
          Create Template
          <Plus className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
        </Button>
      </Link>
    </div>
  )
}
