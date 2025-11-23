#!/usr/bin/env npx tsx

/**
 * Script to set a user as admin by email
 * Usage: npx tsx scripts/set-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { is_admin: true },
      select: {
        id: true,
        name: true,
        email: true,
        is_admin: true
      }
    })

    console.log('✅ User set as admin successfully:')
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ User not found with email:', email)
    } else {
      console.error('❌ Error setting admin:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.log('Usage: npx tsx scripts/set-admin.ts <email>')
  process.exit(1)
}

setAdmin(email)