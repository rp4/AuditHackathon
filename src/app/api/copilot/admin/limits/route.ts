import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { isAdminUser, setUserLimit, getAllUserLimits } from '@/lib/copilot/services/usage-tracking'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(session.user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const limits = await getAllUserLimits()
    return NextResponse.json(limits)
  } catch (error) {
    console.error('Admin limits GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch limits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(session.user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, userEmail, monthlyLimit } = body

    if (!userId || !userEmail || monthlyLimit === undefined) {
      return NextResponse.json(
        { error: 'userId, userEmail, and monthlyLimit are required' },
        { status: 400 }
      )
    }

    if (typeof monthlyLimit !== 'number' || monthlyLimit < 0) {
      return NextResponse.json(
        { error: 'monthlyLimit must be a non-negative number' },
        { status: 400 }
      )
    }

    await setUserLimit(userId, userEmail, monthlyLimit, session.user.email!)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin limits POST error:', error)
    return NextResponse.json(
      { error: 'Failed to set limit' },
      { status: 500 }
    )
  }
}
