###################
# Prepare Stage
# build context is the repo root (for the workspace manifest + packages)
###################

FROM node:24-trixie-slim AS prepare

# Install procps (for ps command) and curl
RUN apt-get update && apt-get install -y procps curl && rm -rf /var/lib/apt/lists/*

# Set up working directory
RUN mkdir -p /home/node/app/node_modules
WORKDIR /home/node/app

# Copy workspace manifests (all of them: npm validates the whole tree)
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/queues ./packages/queues

###################
# Development Stage
###################

FROM prepare AS development

# Install the api workspace (links @miadabdi/streamy-queues)
RUN npm ci --workspace apps/api

ENV NODE_ENV=development

# Copy all api source files
COPY apps/api ./apps/api

# Ensure entrypoint is executable
RUN chmod +x apps/api/entrypoint.sh

# Build the application
RUN npm run build -w apps/api

# Expose application and debug ports
EXPOSE 3000
EXPOSE 9229

# Don't switch to node user - stay as root for development

###################
# Production Stage
###################

FROM prepare AS production

ENV NODE_ENV=production

# Now we set proper ownership for production
RUN chown -R node:node /home/node/app

# Switch to node user for production
USER node

# Copy built application, package files, entrypoint, and drizzle migrations from development stage
COPY --chown=node:node --from=development /home/node/app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=development /home/node/app/apps/api/package.json ./apps/api/
COPY --chown=node:node --from=development /home/node/app/apps/api/entrypoint.sh ./apps/api/entrypoint.sh
COPY --chown=node:node --from=development /home/node/app/apps/api/drizzle ./apps/api/drizzle

# Install only production dependencies
RUN npm ci --omit=dev --workspace apps/api && npm cache clean --force

# Expose application port
EXPOSE 3000

# Set entrypoint script
ENTRYPOINT [ "./apps/api/entrypoint.sh" ]

# Default command
CMD ["node", "apps/api/dist/src/main"]
