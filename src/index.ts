import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestContext } from './middleware/requestContext'
import { errorHandler } from './middleware/errorHandler'
import { createQuote, createQuotesBatch } from './controllers/quoteController'
import { config } from './utils/config'
import rateLimit from 'express-rate-limit'
import { requestLogger } from './middleware/requestLogger'
import { deepHealth } from './controllers/healthController'
import { registry } from './utils/metrics'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'
import compression from 'compression'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }))
app.use(compression())
app.use(express.json({ limit: process.env.MAX_BODY_SIZE || '1mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 120, skip: (req) => req.path === '/metrics' }))
app.use(requestContext)
app.use(requestLogger)

app.post('/api/quotes', createQuote)
app.post('/api/quotes/batch', createQuotesBatch)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.get('/health/deep', deepHealth)
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType)
  res.send(await registry.metrics())
})

// Swagger (try dist first, then src fallback)
try {
  const distSpec = path.join(__dirname, 'openapi.json')
  const srcSpec = path.join(process.cwd(), 'src', 'openapi.json')
  const specPath = fs.existsSync(distSpec) ? distSpec : (fs.existsSync(srcSpec) ? srcSpec : null)
  if (specPath) {
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
  }
} catch {}

app.use(errorHandler)

const port = config.PORT
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})

const shutdown = () => {
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)


