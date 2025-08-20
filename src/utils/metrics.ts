import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

export const registry = new Registry()
collectDefaultMetrics({ register: registry })

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
})

export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
  registers: [registry],
})

export const quotesTotal = new Counter({
  name: 'quotes_total',
  help: 'Total number of quotes computed',
  labelNames: ['result'] as const,
  registers: [registry],
})


