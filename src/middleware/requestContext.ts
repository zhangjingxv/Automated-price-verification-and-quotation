import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

export function requestContext(req: Request, _res: Response, next: NextFunction) {
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID()
  ;(req as any).traceId = traceId
  next()
}


