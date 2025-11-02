FROM node:24-slim AS production

# volume to mount data wed-dir-list will read
VOLUME /data
# RUN chown -R node:root /data not necessary

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit optional

# Copy the rest of the source files into the image.
COPY . .

#build common
WORKDIR /usr/app/common
RUN npm run build

#build client
WORKDIR /usr/app/client
RUN npm run build

#build server
WORKDIR /usr/app/server
RUN npm run build

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
CMD node dist/server/index.js
