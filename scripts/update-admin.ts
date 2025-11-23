import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'dev@openauditswarms.com'

  const user = await prisma.user.update({
    where: { email },
    data: { is_admin: true }
  })

  console.log(`Updated user ${user.email} - is_admin: ${user.is_admin}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })