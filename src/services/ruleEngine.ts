import { Prisma } from '@prisma/client'
import { RuleAdjustment } from '../types'

export type RuleContext = {
  sku: string
  quantity: number
  region?: string
  customer?: string
  currency: string
  baseSubtotal: Prisma.Decimal
}

export class RuleEngine {
  apply(context: RuleContext): { subtotal: Prisma.Decimal; adjustments: RuleAdjustment[] } {
    let subtotal = context.baseSubtotal
    const adjustments: RuleAdjustment[] = []

    // Quantity tier discount example
    if (context.quantity >= 100) {
      const discount = subtotal.mul(0.05)
      subtotal = subtotal.sub(discount)
      adjustments.push({ name: 'qty>=100_discount', type: 'discount', amount: discount.toFixed(2) })
    } else if (context.quantity >= 50) {
      const discount = subtotal.mul(0.02)
      subtotal = subtotal.sub(discount)
      adjustments.push({ name: 'qty>=50_discount', type: 'discount', amount: discount.toFixed(2) })
    }

    // Region surcharge example
    if (context.region === 'EU') {
      const surcharge = subtotal.mul(0.01)
      subtotal = subtotal.add(surcharge)
      adjustments.push({ name: 'eu_region_surcharge', type: 'surcharge', amount: surcharge.toFixed(2) })
    }

    return { subtotal, adjustments }
  }
}


