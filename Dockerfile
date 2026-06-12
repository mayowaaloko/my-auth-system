# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ gcc postgresql-dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Copy the single bundled file
COPY --from=builder /app/dist/main.js ./dist/main.js
COPY package*.json ./

# Copy node_modules for runtime dependencies
COPY --from=builder /app/node_modules ./node_modules

ENV PORT=5000
EXPOSE 5000

CMD ["node", "--enable-source-maps", "dist/main.js"]