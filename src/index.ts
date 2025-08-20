import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestContext } from './middleware/requestContext'
import { errorHandler } from './middleware/errorHandler'
import { createQuote } from './controllers/quoteController'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(requestContext)

app.post('/api/quotes', createQuote)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})


