# syntax=docker/dockerfile:1

# ---- Build stage: Vite bundles the SPA, VITE_* values are baked in at build time ----
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Defaults are the production domains. Override with --build-arg for other environments.
# (.env* files are excluded via .dockerignore so these args are the single source of truth.)
ARG VITE_SERVER=https://api.satgo.az
ARG VITE_FRONTEND=https://satgo.az
ARG VITE_SOCKET=https://api.satgo.az
ARG VITE_APP_URL=https://satgo.az
ARG VITE_GOOGLE_MAPS_KEY=
ENV VITE_SERVER=$VITE_SERVER \
    VITE_FRONTEND=$VITE_FRONTEND \
    VITE_SOCKET=$VITE_SOCKET \
    VITE_APP_URL=$VITE_APP_URL \
    VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY

RUN npm run build

# ---- Runtime stage: static files served by nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1/ || exit 1
