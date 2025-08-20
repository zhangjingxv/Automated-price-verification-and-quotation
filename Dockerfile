FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --silent

# Generate Prisma client and build TS
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev --silent

# Prisma client in runtime image
COPY prisma ./prisma
RUN npx prisma generate

# App build output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Container healthcheck
RUN apk add --no-cache curl
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD curl -sf http://localhost:3000/health || exit 1

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]


