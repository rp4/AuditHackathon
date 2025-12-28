import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'dev@openauditswarms.com' },
    select: { email: true, passwordHash: true }
  })

  if (!user || !user.passwordHash) {
    console.log('User not found or no password hash')
    return
  }

  const testPassword = 'devpassword123'
  const isValid = await bcrypt.compare(testPassword, user.passwordHash)

  console.log('User:', user.email)
  console.log('Test password:', testPassword)
  console.log('Password matches:', isValid ? 'YES ✓' : 'NO ✗')
}

main().finally(() => prisma.$disconnect())
