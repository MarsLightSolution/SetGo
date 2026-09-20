# syntax=docker/dockerfile:1
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src

# keys/ (private.pem, public.pem) is intentionally NOT copied into the image -
# it is a secret. docker-compose mounts it read-only at /app/keys.
RUN mkdir -p logs && chown -R node:node /app
USER node

EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/app.js"]
