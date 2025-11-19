"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const router = useRouter()
  const { user, isAuthenticated, signIn, signOut } = useAuth()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🧰</span>
          <span className="font-bold text-xl">Audit Toolbox</span>
        </Link>

        <nav className="flex items-center space-x-4">
          <Link href="/browse">
            <Button variant="ghost">Browse Tools</Button>
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/upload">
                <Button variant="default" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Tool
                </Button>
              </Link>

              <Link href="/profile">
                <Button variant="ghost">
                  {user?.name || user?.email || 'Profile'}
                </Button>
              </Link>

              <Button variant="ghost" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="default" onClick={() => signIn()}>
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
