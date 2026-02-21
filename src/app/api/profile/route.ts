import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'
import { requireAuth, handleApiError } from '@/lib/api/helpers'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  linkedin_visible: z.boolean().optional(),
  company: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
})

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
        bio: validatedData.bio || null,
        website: validatedData.website || null,
        linkedin_url: validatedData.linkedin_url || null,
        linkedin_visible: validatedData.linkedin_visible ?? false,
        company: validatedData.company || null,
        role: validatedData.role || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        linkedin_url: true,
        linkedin_visible: true,
        company: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return handleApiError(error, 'update profile')
  }
}
