'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

interface PaywallBannerProps {
  agentId: string
  agentName: string
  price: number
  currency: string
  onPurchase?: () => void
}

export function PaywallBanner({
  agentId,
  agentName,
  price,
  currency = 'USD',
  onPurchase,
}: PaywallBannerProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handlePurchase = async () => {
    setIsPurchasing(true)

    try {
      // Call API to create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to checkout
      window.location.href = url
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to start checkout. Please try again.')
      setIsPurchasing(false)
    }
  }

  return (
    <div className="mt-8 p-8 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">Unlock Full Documentation</h3>
          <p className="text-muted-foreground mb-6">
            Get complete access to all instructions, configurations, sample code, and
            advanced implementation details for <span className="font-semibold">{agentName}</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">
                {currency === 'USD' && '$'}
                {price.toFixed(2)}
                {currency !== 'USD' && ` ${currency}`}
              </div>
              <p className="text-sm text-muted-foreground">One-time payment</p>
            </div>

            <div className="flex-1" />

            <Button
              size="lg"
              onClick={onPurchase || handlePurchase}
              disabled={isPurchasing}
              className="w-full sm:w-auto"
            >
              {isPurchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>Purchase Full Access</>
              )}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-primary/20">
            <p className="text-sm text-muted-foreground font-medium mb-2">
              What's included:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Complete agent documentation and instructions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Full configuration details and parameters
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Sample inputs, outputs, and examples
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Implementation tips and best practices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Lifetime access with all future updates
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
