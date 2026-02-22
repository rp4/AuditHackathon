"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowRight, BookOpen } from "lucide-react"
import { HowToDialog } from "@/components/landing/HowToDialog"

export function HeroCTA() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in">
      <Link href="/browse">
        <Button
          size="lg"
          className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold bg-amber-500 hover:bg-amber-600 text-black border-0 shadow-md"
        >
          Browse Templates
          <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
        </Button>
      </Link>
      <Link href="/copilot">
        <Button
          size="lg"
          className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-md"
        >
          <Image src="/copilot.png" alt="Game" width={24} height={24} className="mr-2" />
          Play the Game
        </Button>
      </Link>
      <Button
        size="lg"
        variant="outline"
        onClick={() => setDialogOpen(true)}
        className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
      >
        How To
        <BookOpen className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
      </Button>
      <HowToDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
