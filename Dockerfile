# Multi-stage Docker build for full-stack deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY package*.json ./

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build backend
WORKDIR /app/backend
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=1337

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strapi

# Copy built backend
COPY --from=builder --chown=strapi:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=strapi:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=strapi:nodejs /app/backend/package.json ./backend/package.json
COPY --from=builder --chown=strapi:nodejs /app/backend/public ./backend/public

# Copy built frontend to backend's public folder for serving
COPY --from=builder --chown=strapi:nodejs /app/frontend/dist ./backend/public/app

# Create uploads directory
RUN mkdir -p ./backend/public/uploads && chown strapi:nodejs ./backend/public/uploads

USER strapi

EXPOSE 1337

# Start the server
CMD ["node", "backend/dist/index.js"]