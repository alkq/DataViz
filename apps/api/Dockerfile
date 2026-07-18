# Multi-stage build for the NestJS API.
# Uses bullseye (not slim) so the native `bcrypt` module can compile.
FROM node:20-bullseye AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/

# Install ALL workspace deps (incl. dev) for building
RUN npm install --no-audit --no-fund

# Copy full source
COPY . .

# Build workspace packages then the API
RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=packages/db \
 && npm run build --workspace=apps/api

# Prune dev dependencies for the runtime image
RUN npm prune --omit=dev

# ---- Runtime ----
FROM node:20-bullseye-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

# Runtime deps only (bcrypt native binary already compiled in builder)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./

# The compiled entry is emitted to apps/api/dist/apps/api/src/main.js
EXPOSE 3001

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
