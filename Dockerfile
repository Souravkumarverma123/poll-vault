FROM node:22-alpine AS builder

WORKDIR /app

# Copy root config
COPY package*.json ./

# Copy server and client package.json
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/client
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy server code and installed modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
# Copy built client to server
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 8000

# Start server
WORKDIR /app/server
CMD ["npm", "start"]
