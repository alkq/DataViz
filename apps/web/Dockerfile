# Multi-stage build for the Next.js web app (used by docker-compose.deploy.yml).
FROM node:20-bullseye AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install workspace deps (npm workspaces)
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
RUN npm install

# Build workspace packages (shared must be compiled; web transpiles it too)
COPY packages ./packages
COPY apps ./apps
RUN npm run build --workspace=@platform/shared

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
