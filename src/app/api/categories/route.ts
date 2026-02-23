import { NextResponse } from 'next/server'
import { getCategoriesWithCounts } from '@/lib/db/categories'

export async function GET() {
  try {
    const categories = await getCategoriesWithCounts()
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
