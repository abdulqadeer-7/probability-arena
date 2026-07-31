FROM node:20-alpine AS build

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json backend/nest-cli.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 4000

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/main"]
