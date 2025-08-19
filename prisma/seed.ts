import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.upsert({
    where: { sku: 'SKU-001' },
    update: {},
    create: {
      sku: 'SKU-001',
      name: 'Sample Product',
      baseCurrency: 'USD',
    },
  })

  await prisma.supplierQuote.createMany({
    data: [
      {
        productId: product.id,
        supplier: 'DefaultSupplier',
        region: 'CN',
        currency: 'USD',
        minQty: 1,
        maxQty: 99,
        unitPrice: new Prisma.Decimal('10.00'),
        leadTimeDays: 7,
        effectiveFrom: new Date('2024-01-01'),
      } as any,
    ],
    skipDuplicates: true,
  })

  await prisma.exchangeRate.upsert({
    where: { base_quote_date: { base: 'USD', quote: 'CNY', date: new Date('2024-01-01') } },
    update: {},
    create: {
      base: 'USD',
      quote: 'CNY',
      rate: new Prisma.Decimal('7.0000'),
      date: new Date('2024-01-01'),
    },
  })

  console.log('Seed completed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})


