#!/usr/bin/env npx tsx

/**
 * Script to list all users and their admin status
 * Usage: npx tsx scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        is_admin: true,
        createdAt: true,
        _count: {
          select: {
            swarms: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (users.length === 0) {
      console.log('No users found in the database')
      return
    }

    console.log('\n📋 User List\n' + '='.repeat(80))

    users.forEach(user => {
      console.log(`
ID: ${user.id}
Name: ${user.name || 'Not set'}
Username: ${user.username || 'Not set'}
Email: ${user.email}
Admin: ${user.is_admin ? '✅ Yes' : '❌ No'}
Swarms Created: ${user._count.swarms}
Joined: ${user.createdAt.toLocaleDateString()}
${'-'.repeat(40)}`)
    })

    console.log(`\nTotal Users: ${users.length}`)
    console.log(`Admins: ${users.filter(u => u.is_admin).length}`)
    console.log(`Regular Users: ${users.filter(u => !u.is_admin).length}\n`)

  } catch (error) {
    console.error('❌ Error listing users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
