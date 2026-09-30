# Production Dockerfile for Google Cloud Run
# Uses official Node.js 22 Alpine for lightweight, secure container image
FROM node:22-alpine AS base

# Install dumb-init or dependencies if required
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create a non-root user for security (Node Alpine includes 'node' user with uid 1000)
USER node

# Expose HTTP health port for Cloud Run
EXPOSE 8080

# Start bot process via npm start
CMD ["npm", "start"]
