import { Request, Response } from 'express'
import { prisma } from '../services/dbClient'

export async function deepHealth(_req: Request, res: Response) {
  try {
    const dbOk = await prisma.$queryRaw`SELECT 1 as ok`
    res.json({ status: 'ok', db: !!dbOk, timestamp: new Date().toISOString() })
  } catch {
    res.status(500).json({ status: 'degraded', db: false, timestamp: new Date().toISOString() })
  }
}


