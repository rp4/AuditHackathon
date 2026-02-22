'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.replace('/create')
      return
    }

    if (!session.user.isAdmin) {
      router.replace('/create')
      return
    }

    setChecked(true)
  }, [session, status, router])

  if (status === 'loading' || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
