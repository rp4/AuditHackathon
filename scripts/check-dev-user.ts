import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'dev@openauditswarms.com' },
    select: { email: true, passwordHash: true }
  })

  console.log('User:', user?.email)
  console.log('Has password hash:', user?.passwordHash ? 'YES' : 'NO')
  if (user?.passwordHash) {
    console.log('Password hash prefix:', user.passwordHash.substring(0, 15))
  }
}

main().finally(() => prisma.$disconnect())
