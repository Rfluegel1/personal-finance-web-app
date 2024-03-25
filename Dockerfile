FROM node:18.16.0-slim AS base

WORKDIR /app

ENV NODE_ENV=staging

COPY backend/build/ ./backend/build/
COPY backend/dist/ ./backend/dist/
COPY backend/node_modules/ ./backend/node_modules/
COPY backend/.env* ./backend/

WORKDIR /app/backend

EXPOSE 8090

CMD [ "node", "dist/server.js" ]
