import { z } from 'zod'
import { PricingEngine } from './pricingEngine'
import { QuoteInput } from '../types'

const inputSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  region: z.string().optional(),
  customer: z.string().optional(),
  targetCurrency: z.string().optional(),
  at: z.coerce.date().optional(),
})

const pricingEngine = new PricingEngine()

export class QuoteService {
  async getQuote(input: unknown) {
    const parsed = inputSchema.parse(input) as QuoteInput
    return pricingEngine.price(parsed)
  }
}


