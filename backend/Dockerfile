# syntax=docker/dockerfile:1
# Debian-slim (not alpine): bcrypt is a native module and this avoids musl build issues.
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

# uploads/ and logs/ are written at runtime - mount volumes over them (see docker-compose.yml)
RUN mkdir -p uploads logs && chown -R node:node /app
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/config/app').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run node directly - `npm start` is nodemon, which is a dev tool
CMD ["node", "index.js"]
