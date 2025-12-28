import { NextResponse } from 'next/server'
import { getPlatformsWithCounts } from '@/lib/db/categories'

export async function GET() {
  try {
    const platforms = await getPlatformsWithCounts()
    return NextResponse.json(platforms)
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}
