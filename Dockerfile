# Use Node.js 20 LTS
FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files and Prisma schema (needed for prisma generate in postinstall)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build-time placeholders (runtime env vars in Cloud Run override these)
ARG GCS_BUCKET_NAME=placeholder
ARG GCP_PROJECT_ID=placeholder
ARG NEXTAUTH_URL=http://localhost:3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV GCS_BUCKET_NAME=${GCS_BUCKET_NAME}
ENV GCP_PROJECT_ID=${GCP_PROJECT_ID}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/lib/copilot/adk/skills ./src/lib/copilot/adk/skills

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Start the app (migrations run separately)
CMD ["node", "server.js"]
