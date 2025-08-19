import { Prisma } from '@prisma/client'
import { prisma } from './dbClient'

export class ProductRepository {
  async findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku } })
  }
}

export class SupplierQuoteRepository {
  async findBestQuote(params: {
    productId: string
    region?: string
    quantity: number
    at: Date
  }) {
    const { productId, region, quantity, at } = params

    const quotes = await prisma.supplierQuote.findMany({
      where: {
        productId,
        region: region ?? undefined,
        minQty: { lte: quantity },
        OR: [{ maxQty: null }, { maxQty: { gte: quantity } }],
        effectiveFrom: { lte: at },
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] }],
      },
      orderBy: [{ unitPrice: 'asc' }],
      take: 1,
    })
    return quotes[0] ?? null
  }
}

export class ExchangeRateRepository {
  async findRate(base: string, quote: string, at: Date) {
    // pick the closest rate <= date
    const rate = await prisma.exchangeRate.findFirst({
      where: { base, quote, date: { lte: at } },
      orderBy: { date: 'desc' },
    })
    return rate
  }
}

export class CostOverrideRepository {
  async findApplicable(params: {
    productId: string
    customer?: string
    region?: string
    at: Date
  }) {
    const { productId, customer, region, at } = params
    const overrides = await prisma.costOverride.findMany({
      where: {
        productId,
        customer: customer ?? undefined,
        region: region ?? undefined,
        effectiveFrom: { lte: at },
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] }],
      },
      orderBy: [{ effectiveFrom: 'desc' }],
      take: 1,
    })
    return overrides[0] ?? null
  }
}


