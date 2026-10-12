# Bot Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY items.json ./
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Create keys directory
RUN mkdir -p keys

# Expose API port
EXPOSE 3001

# Start bot
CMD ["node", "dist/index.js"]