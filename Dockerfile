# Build stage
FROM node:20-alpine AS builder


RUN apk add --no-cache python3 make g++ gcc postgresql-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stages
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV PORT=5000
EXPOSE 5000
RUN ls -la dist/ && ls -la dist/users/ || echo "NO USERS DIR"
CMD ["node", "dist/main.js"]