###################
# Build Stage
# build context is the repo root (for the workspace manifest + packages)
###################

FROM node:24-trixie-slim AS build

# Set up working directory
RUN mkdir -p /home/node/app/node_modules
WORKDIR /home/node/app

# Copy workspace manifests (npm validates the whole tree: sibling apps are
# simply absent from the glob, packages/queues is a workspace member)
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/queues ./packages/queues

# Install the web workspace (dev deps included — vite/tsc build the SPA)
RUN npm ci --workspace apps/web

# Copy web source (dist/ and node_modules/ are dockerignored) and build
COPY apps/web ./apps/web
RUN npm run build -w apps/web

###################
# Production Stage
###################

FROM nginx:1.29-alpine

COPY apps/web/nginx.conf /etc/nginx/nginx.conf
COPY apps/web/env.js.template /etc/nginx/env.js.template
COPY apps/web/entrypoint.sh /entrypoint.sh
COPY --from=build /home/node/app/apps/web/dist /usr/share/nginx/html

# Ensure entrypoint is executable
RUN chmod +x /entrypoint.sh

# Expose application port
EXPOSE 80

# alpine/musl resolves localhost to ::1 first and busybox wget won't fall
# back to IPv4, where nginx listens — probe the address explicitly
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
	CMD wget -qO /dev/null http://127.0.0.1/ || exit 1

# Set entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["nginx", "-g", "daemon off;"]
