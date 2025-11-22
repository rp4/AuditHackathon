'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  let errorMessage = 'An error occurred during authentication.'
  let errorDetails = ''

  switch (error) {
    case 'OAuthCallback':
      errorMessage = 'LinkedIn authentication failed'
      errorDetails = 'There was an issue with the LinkedIn OAuth callback. This usually happens when the redirect URL is misconfigured.'
      break
    case 'OAuthSignin':
      errorMessage = 'Unable to start LinkedIn sign-in'
      errorDetails = 'Could not initiate the sign-in process with LinkedIn.'
      break
    case 'OAuthAccountNotLinked':
      errorMessage = 'Account already exists'
      errorDetails = 'An account with this email already exists. Please sign in with the original method you used.'
      break
    case 'Configuration':
      errorMessage = 'Authentication configuration error'
      errorDetails = 'There is an issue with the authentication setup. Please contact support.'
      break
    case 'AccessDenied':
      errorMessage = 'Access denied'
      errorDetails = 'You do not have permission to sign in.'
      break
    case 'Verification':
      errorMessage = 'Verification error'
      errorDetails = 'The sign-in link is no longer valid. Please request a new one.'
      break
    default:
      if (error) {
        errorMessage = 'Authentication error'
        errorDetails = `Error code: ${error}`
      }
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Authentication Error</CardTitle>
          </div>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorDetails && (
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
              {errorDetails}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              If you continue to experience issues:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Make sure you're using the correct LinkedIn account</li>
              <li>Check that you've authorized the application in LinkedIn</li>
              <li>Clear your browser cookies and try again</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/auth/signin">
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}