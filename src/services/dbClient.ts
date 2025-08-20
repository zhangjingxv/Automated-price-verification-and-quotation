import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
    ],
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientSingleton | undefined
}

export const prisma: PrismaClient = global.prisma ?? prismaClientSingleton()

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma


