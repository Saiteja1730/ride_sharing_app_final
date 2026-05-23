FROM node:20-alpine AS base
WORKDIR /app

FROM base AS build
COPY backend/package.json ./
RUN npm install
COPY backend ./
COPY shared ../shared
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser
RUN mkdir -p /app/logs && chown -R nodeuser:nodejs /app/logs
COPY --from=build --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=build --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodeuser:nodejs /app/package.json ./package.json
USER nodeuser
EXPOSE 4000
CMD ["node", "dist/app/src/app.js"]
