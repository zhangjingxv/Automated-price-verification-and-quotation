export type CostSource = 'override' | 'supplierQuote'

export interface QuoteInput {
  sku: string
  quantity: number
  region?: string
  customer?: string
  targetCurrency?: string
  at?: Date
}

export interface CostBreakdown {
  source: CostSource
  currency: string
  unitCost: string
  quantity: number
  subtotal: string
  exchange?: {
    base: string
    quote: string
    rate: string
  }
}

export interface RuleAdjustment {
  name: string
  type: 'discount' | 'surcharge'
  amount: string
}

export interface QuoteResult {
  sku: string
  quantity: number
  currency: string
  unitPrice: string
  totalPrice: string
  breakdown: {
    cost: CostBreakdown
    ruleAdjustments: RuleAdjustment[]
  }
}


