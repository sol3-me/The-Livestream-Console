# syntax=docker/dockerfile:1

# ── 1. Install dependencies ───────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── 2. Build ──────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next build reads NEXTAUTH_URL at build time only to validate; runtime value
# comes from the container environment variable.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. Test (CI only, never part of the production image) ─────────────────────
# Run with `docker build --target test .` (or `npm run test:docker`).
# Must stay above the runner stage: the last stage is the default build target,
# and BuildKit skips stages the target doesn't need, so this adds nothing to a
# normal `docker build .`.
FROM deps AS test
WORKDIR /app

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run lint \
 && npx tsc --noEmit \
 && npm test \
 && npm run test:verify

# ── 4. Production image ───────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone server and static assets produced by `output: 'standalone'`
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
