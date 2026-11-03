# Multi-stage production Dockerfile for Pixora
# Base: Node 20 LTS Debian slim (includes required glibc for prebuilt Sharp binaries)
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build client
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV STORAGE_DIR=/tmp/pixora

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy built frontend assets and server source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/src/types ./src/types

# Create dedicated storage directory with secure permissions
RUN mkdir -p /tmp/pixora && chown -R node:node /app /tmp/pixora

# Run as non-root user for security (SR-022)
USER node

EXPOSE 3000

CMD ["tsx", "server.ts"]
