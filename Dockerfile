# Multi-stage Dockerfile for React application
FROM node:25-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY frontend/ .
RUN npm ci
RUN npm run build

# Production image, copy all the files and run next
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]