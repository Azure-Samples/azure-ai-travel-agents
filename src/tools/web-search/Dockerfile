# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS production
WORKDIR /app

# Copy package.json and install production dependencies only
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Use a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 5000
CMD ["node", "./dist/index.js"]