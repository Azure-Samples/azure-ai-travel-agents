FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ \
   && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Use cache mount for npm and install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm i --prefer-offline --no-audit

# Now copy source code (changes more frequently)
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Runtime stage with security improvements
FROM node:22-alpine AS release

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Set production environment
ENV NODE_ENV=production

# Install production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --omit=dev --ignore-scripts --no-audit

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (adjust if needed)
EXPOSE 4001

# Run the application
CMD ["node", "dist/server.js"]