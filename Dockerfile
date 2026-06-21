# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner ----
# Uses the full node_modules (not the standalone trace) so the Prisma CLI
# and its dependencies are available to run `prisma migrate deploy` on boot.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Some Docker hosts advertise IPv6 routes that are actually unreachable;
# prefer IPv4 so outbound calls (e.g. to the Anthropic API) don't stall
# on a slow IPv6-then-IPv4 fallback.
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone/server.js ./server.js
COPY --from=builder /app/.next/standalone/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
