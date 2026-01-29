"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { WORKFLOW_GENERATION_PROMPT } from "@/lib/constants/prompts"

export function HeroCTA() {
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(WORKFLOW_GENERATION_PROMPT)
      setCopied(true)
      toast.success("AI prompt copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy prompt:", err)
      toast.error("Failed to copy prompt")
    }
  }

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
      <Button
        size="lg"
        variant="outline"
        onClick={handleCopyPrompt}
        className="min-w-[200px] sm:min-w-[240px] h-12 sm:h-14 text-base sm:text-lg font-semibold border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
      >
        {copied ? (
          <>
            Copied!
            <Check className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
          </>
        ) : (
          <>
            Copy AI Prompt
            <Copy className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
          </>
        )}
      </Button>
    </div>
  )
}
