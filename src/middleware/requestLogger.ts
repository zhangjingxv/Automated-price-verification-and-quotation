import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'
import { httpRequestDurationMs, httpRequestsTotal } from '../utils/metrics'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const traceId = (req as any).traceId
  const { method, originalUrl } = req
  res.on('finish', () => {
    const durationMs = Date.now() - start
    httpRequestDurationMs.labels(method, originalUrl, String(res.statusCode)).observe(durationMs)
    httpRequestsTotal.labels(method, originalUrl, String(res.statusCode)).inc()
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


