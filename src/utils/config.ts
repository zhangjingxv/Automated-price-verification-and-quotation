import { z } from 'zod'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  DEFAULT_CURRENCY: z.string().default('USD'),
  LOG_LEVEL: z.string().default('info'),
  CACHE_TTL_MS: z.coerce.number().default(30000),
})

export type AppConfig = z.infer<typeof configSchema>

export const config: AppConfig = configSchema.parse(process.env)
