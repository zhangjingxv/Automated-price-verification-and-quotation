import { Prisma } from '@prisma/client'
import { CostOverrideRepository, ExchangeRateRepository, ProductRepository, SupplierQuoteRepository } from './repositories'
import { CostBreakdown, QuoteInput, QuoteResult, RuleAdjustment } from '../types'

const productRepo = new ProductRepository()
const quoteRepo = new SupplierQuoteRepository()
const overrideRepo = new CostOverrideRepository()
const rateRepo = new ExchangeRateRepository()

export class PricingEngine {
  async price(input: QuoteInput): Promise<QuoteResult> {
    const at = input.at ?? new Date()
    const targetCurrency = input.targetCurrency || 'USD'
    const product = await productRepo.findBySku(input.sku)
    if (!product) throw Object.assign(new Error('SKU not found'), { statusCode: 404, code: 'SKU_NOT_FOUND' })

    const override = await overrideRepo.findApplicable({
      productId: product.id,
      customer: input.customer,
      region: input.region,
      at,
    })

    let breakdown: CostBreakdown
    if (override) {
      breakdown = {
        source: 'override',
        currency: override.currency,
        unitCost: new Prisma.Decimal(override.unitPrice).toFixed(4),
        quantity: input.quantity,
        subtotal: new Prisma.Decimal(override.unitPrice).mul(input.quantity).toFixed(4),
      }
    } else {
      const bestQuote = await quoteRepo.findBestQuote({
        productId: product.id,
        region: input.region,
        quantity: input.quantity,
        at,
      })
      if (!bestQuote) throw Object.assign(new Error('No cost found for conditions'), { statusCode: 400, code: 'NO_COST' })
      breakdown = {
        source: 'supplierQuote',
        currency: bestQuote.currency,
        unitCost: new Prisma.Decimal(bestQuote.unitPrice).toFixed(4),
        quantity: input.quantity,
        subtotal: new Prisma.Decimal(bestQuote.unitPrice).mul(input.quantity).toFixed(4),
      }
    }

    let subtotal = new Prisma.Decimal(breakdown.subtotal)
    let currency = breakdown.currency
    if (currency !== targetCurrency) {
      const rate = await rateRepo.findRate(currency, targetCurrency, at)
      if (!rate) throw Object.assign(new Error('Exchange rate not found'), { statusCode: 400, code: 'NO_RATE' })
      subtotal = subtotal.mul(rate.rate)
      breakdown.exchange = { base: currency, quote: targetCurrency, rate: new Prisma.Decimal(rate.rate).toFixed(4) }
      currency = targetCurrency
    }

    // TODO: integrate ruleEngine for discounts/surcharges
    const ruleAdjustments: RuleAdjustment[] = []

    const unitPrice = subtotal.div(input.quantity)
    const totalPrice = subtotal

    return {
      sku: input.sku,
      quantity: input.quantity,
      currency,
      unitPrice: unitPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      breakdown: { cost: breakdown, ruleAdjustments },
    }
  }
}


