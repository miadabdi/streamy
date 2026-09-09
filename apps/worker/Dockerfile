###################
# Prepare Stage
# build context is the repo root (for the workspace manifest + packages)
###################

FROM node:24-trixie-slim AS prepare

# procps for `nice`, curl for healthchecks. ffmpeg comes from the distro:
# trixie's build (7.x) carries every encoder the worker probes — libx264,
# h264_vaapi, h264_qsv and h264_nvenc (dlopen'd driver, safe on non-nvidia
# hosts) — which is strictly more than the source compile it replaces, and
# it drops a ~40-minute ffmpeg build from every image build. libva/libvpl
# + the intel drivers give the hw encoders devices to talk to.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg procps curl libva2 libva-drm2 libvpl2 libvdpau1 \
        intel-media-va-driver i965-va-driver \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
RUN mkdir -p /home/node/app/node_modules
WORKDIR /home/node/app

# Copy workspace manifests (all of them: npm validates the whole tree)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/queues ./packages/queues

###################
# Development Stage
###################

FROM prepare AS development

# Install the worker workspace (links @miadabdi/streamy-queues)
RUN npm ci --workspace apps/worker

ENV NODE_ENV=development

# Copy all worker source files
COPY apps/worker ./apps/worker

# Build the application
RUN npm run build -w apps/worker

# Expose application and debug ports
EXPOSE 3001
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

# Copy built application from development stage
COPY --chown=node:node --from=development /home/node/app/apps/worker/dist ./apps/worker/dist
COPY --chown=node:node --from=development /home/node/app/apps/worker/package.json ./apps/worker/

# Install only production dependencies
RUN npm ci --omit=dev --workspace apps/worker && npm cache clean --force

# Expose application port
EXPOSE 3001

# Default command (no entrypoint: the worker has no migrations to run)
CMD ["node", "apps/worker/dist/main"]
