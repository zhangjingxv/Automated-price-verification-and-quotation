import { Request, Response, NextFunction } from 'express'
import { QuoteService } from '../services/quoteService'
import pLimit from 'p-limit'
import { quotesTotal } from '../utils/metrics'

const service = new QuoteService()

export async function createQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getQuote(req.body)
    quotesTotal.labels('success').inc()
    res.json({ traceId: (req as any).traceId, data: result })
  } catch (err) {
    quotesTotal.labels('error').inc()
    next(err)
  }
}

const limit = pLimit(Number(process.env.CONCURRENCY_LIMIT || 5))

export async function createQuotesBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const inputs = Array.isArray(req.body) ? req.body : []
    const tasks = inputs.map((input) => limit(() => service.getQuote(input)))
    const results = await Promise.allSettled(tasks)
    const data = results.map((r) => (r.status === 'fulfilled' ? r.value : { error: (r.reason as Error).message }))
    res.json({ traceId: (req as any).traceId, data })
  } catch (err) {
    next(err)
  }
}


