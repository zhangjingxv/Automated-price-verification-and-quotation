import { Prisma } from '@prisma/client'
import { prisma } from './dbClient'
import { TtlCache } from '../utils/cache'

export class ProductRepository {
  private cache = new TtlCache<any>(Number(process.env.CACHE_TTL_MS || 30000))
  async findBySku(sku: string) {
    const key = `product:${sku}`
    const cached = this.cache.get(key)
    if (cached) return cached
    const data = await prisma.product.findUnique({ where: { sku } })
    if (data) this.cache.set(key, data)
    return data
  }
}

export class SupplierQuoteRepository {
  private cache = new TtlCache<any>(Number(process.env.CACHE_TTL_MS || 30000))
  async findBestQuote(params: {
    productId: string
    region?: string
    quantity: number
    at: Date
  }) {
    const { productId, region, quantity, at } = params

    const cacheKey = `supplierQuote:${productId}:${region || 'ALL'}:${quantity}:${at.toISOString()}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
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
    const best = quotes[0] ?? null
    if (best) this.cache.set(cacheKey, best)
    return best
  }
}

export class ExchangeRateRepository {
  private cache = new TtlCache<any>(Number(process.env.CACHE_TTL_MS || 30000))
  async findRate(base: string, quote: string, at: Date) {
    const cacheKey = `rate:${base}:${quote}:${at.toISOString().slice(0,10)}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
    const rate = await prisma.exchangeRate.findFirst({
      where: { base, quote, date: { lte: at } },
      orderBy: { date: 'desc' },
    })
    if (rate) this.cache.set(cacheKey, rate)
    return rate
  }
}

export class CostOverrideRepository {
  private cache = new TtlCache<any>(Number(process.env.CACHE_TTL_MS || 30000))
  async findApplicable(params: {
    productId: string
    customer?: string
    region?: string
    at: Date
  }) {
    const { productId, customer, region, at } = params
    const cacheKey = `override:${productId}:${customer || 'ALL'}:${region || 'ALL'}:${at.toISOString()}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached
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
    const best = overrides[0] ?? null
    if (best) this.cache.set(cacheKey, best)
    return best
  }
}


