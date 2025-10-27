'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MessageSquare, Copy, Check } from 'lucide-react'
import Image from 'next/image'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: {
    name: string
    description: string
    slug: string
    platforms?: Array<{ platform: { name: string } }>
  }
}

export function ShareDialog({ open, onOpenChange, agent }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  // Build the agent URL
  const agentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/agents/${agent.slug}`
    : ''

  // Create default share message
  const defaultMessage = `Check out "${agent.name}" on Audit Agents!\n\n${agent.description}\n\n${agentUrl}`

  const [message, setMessage] = useState(defaultMessage)

  // Handle LinkedIn share
  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(agentUrl)}`
    window.open(linkedInUrl, '_blank', 'width=600,height=600')
  }

  // Handle Email share
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out ${agent.name}`)
    const body = encodeURIComponent(message)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  // Handle SMS share
  const handleSMSShare = () => {
    const smsBody = encodeURIComponent(message)
    // iOS and Android support different SMS URL schemes
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const separator = isMobile ? '&' : '?'
    window.location.href = `sms:${separator}body=${smsBody}`
  }

  // Handle Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/logo.png"
              alt="Audit Agents"
              width={40}
              height={40}
              className="rounded"
            />
            <DialogTitle>Share Agent</DialogTitle>
          </div>
          <DialogDescription>
            Choose how you&apos;d like to share &quot;{agent.name}&quot; with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share via</label>
            <div className="grid grid-cols-2 gap-2">
              {/* LinkedIn */}
              <Button
                variant="outline"
                onClick={handleLinkedInShare}
                className="h-auto py-3 flex flex-col gap-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="#0A66C2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm">LinkedIn</span>
              </Button>

              {/* Email */}
              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="h-auto py-3 flex flex-col gap-2"
              >
                <Mail className="h-5 w-5" />
                <span className="text-sm">Email</span>
              </Button>

              {/* SMS */}
              <Button
                variant="outline"
                onClick={handleSMSShare}
                className="h-auto py-3 flex flex-col gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm">Text/SMS</span>
              </Button>

              {/* Copy Link */}
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-auto py-3 flex flex-col gap-2"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
