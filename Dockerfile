# ---- Base ----
FROM node:22-alpine AS base
# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev || npm ci
RUN npx prisma generate

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build
# Compile the WebSocket server to plain JS so no tsx needed at runtime
RUN npx tsc src/server/ws-server.ts --outDir dist --target es2020 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV WS_PORT=3001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY scripts/start.sh ./start.sh

RUN chmod +x ./start.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000 3001

CMD ["./start.sh"]
