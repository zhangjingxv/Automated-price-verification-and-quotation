import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || 500
  const traceId = (req as any).traceId
  const payload = {
    traceId,
    error: {
      message: status < 500 ? err.message : 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      details: status < 500 ? err.details : undefined,
    },
  }
  logger.error('request_error', { traceId, status, err: { message: err.message, stack: err.stack } })
  res.status(status).json(payload)
}


