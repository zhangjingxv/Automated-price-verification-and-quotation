import { Request, Response, NextFunction } from 'express'
import { QuoteService } from '../services/quoteService'

const service = new QuoteService()

export async function createQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getQuote(req.body)
    res.json({ traceId: (req as any).traceId, data: result })
  } catch (err) {
    next(err)
  }
}


