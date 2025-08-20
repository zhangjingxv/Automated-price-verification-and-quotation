import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestContext } from './middleware/requestContext'
import { errorHandler } from './middleware/errorHandler'
import { createQuote } from './controllers/quoteController'
import { config } from './utils/config'
import rateLimit from 'express-rate-limit'
import { requestLogger } from './middleware/requestLogger'
import { deepHealth } from './controllers/healthController'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }))
app.use(express.json())
app.use(rateLimit({ windowMs: 60_000, max: 120 }))
app.use(requestContext)
app.use(requestLogger)

app.post('/api/quotes', createQuote)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.get('/health/deep', deepHealth)

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
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})


