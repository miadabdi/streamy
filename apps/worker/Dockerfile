###################
# ffmpeg build stage
# latest ffmpeg compiled with hardware acceleration: distro packages are
# older and the johnvansickle static builds ship with NO hw encoders at
# all, which would silently disable vaapi/qsv/nvenc transcoding
###################
FROM debian:trixie-slim AS ffmpeg-builder

ARG FFMPEG_VERSION=8.1.2

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential nasm pkg-config git ca-certificates curl xz-utils \
        libx264-dev libva-dev libvpl-dev libvdpau-dev \
    && rm -rf /var/lib/apt/lists/*

# nvenc/nvdec headers are MIT and header-only; the proprietary nvidia
# driver is dlopen'ed at runtime and simply fails the encoder probe when
# absent, so this is safe on non-nvidia hosts
RUN git clone --depth 1 https://git.videolan.org/git/ffmpeg/nv-codec-headers.git /tmp/nvch \
    && make -C /tmp/nvch install

RUN curl -fsSL https://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.xz | tar -xJ -C /tmp \
    && cd /tmp/ffmpeg-${FFMPEG_VERSION} \
    && ./configure \
        --prefix=/ffmpeg \
        --disable-doc --disable-debug \
        --disable-xlib --disable-libxcb --disable-sdl2 --disable-ffplay \
        --enable-gpl \
        --enable-libx264 \
        --enable-vaapi \
        --enable-libvpl \
    && make -j"$(nproc)" \
    && make install

###################
# Prepare Stage
###################

FROM node:24-trixie-slim AS prepare

# procps for `nice`, curl for healthchecks, libva + drivers so the
# hardware encoders compiled above actually have devices to talk to
RUN apt-get update && apt-get install -y --no-install-recommends \
        procps curl libva2 libva-drm2 libvpl2 libvdpau1 libx11-6 libx264-164 \
        intel-media-va-driver i965-va-driver \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-builder /ffmpeg /usr/local

ENV FFMPEG_PATH=/usr/local/bin/ffmpeg \
    FFPROBE_PATH=/usr/local/bin/ffprobe

# Set up working directory
RUN mkdir -p /home/node/app/node_modules
WORKDIR /home/node/app

# Copy dependency manifests (no chown yet)
COPY package*.json ./

###################
# Development Stage
###################

FROM prepare AS development

# Vendored @miadabdi/streamy-queues tarball needed by npm install
COPY vendor ./vendor

# Install all dependencies (including devDependencies)
# Run as root to avoid permission issues with mounted volumes
RUN npm install

ENV NODE_ENV=development

# Copy all source files
COPY . .

# Build the application
RUN npm run build

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

# Copy built application and package files from development stage
COPY --chown=node:node --from=development /home/node/app/dist ./dist
COPY --chown=node:node --from=development /home/node/app/package*.json ./
# vendored @miadabdi/streamy-queues tarball needed by npm ci
COPY --chown=node:node --from=development /home/node/app/vendor ./vendor

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Expose application port
EXPOSE 3001

# Default command (no entrypoint: the worker has no migrations to run)
CMD ["node", "dist/main"]
