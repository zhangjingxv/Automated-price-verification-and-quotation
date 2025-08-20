import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const traceId = (req as any).traceId
  const { method, originalUrl } = req
  res.on('finish', () => {
    const durationMs = Date.now() - start
    logger.info('http_request', {
      traceId,
      method,
      path: originalUrl,
      status: res.statusCode,
      durationMs,
    })
  })
  next()
}


