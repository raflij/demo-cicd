# ---- build stage: install deps and produce the static site ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage: serve the built site with vite preview ----
FROM node:22-alpine
WORKDIR /app
# keep the bare minimum needed to serve dist/
COPY package.json package-lock.json ./
COPY --from=build /app/dist ./dist
RUN npm ci --omit=dev

ENV PORT=4173
EXPOSE 4173
# --host binds 0.0.0.0 so the port mapping is reachable from the host IP
CMD ["npx", "vite", "preview", "--host", "--port", "4173"]
