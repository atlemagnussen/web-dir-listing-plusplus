FROM node:24-slim AS build

# volume to mount data wed-dir-list will read
VOLUME /data

ENV NODE_ENV build

WORKDIR /usr/build

COPY . .

RUN npm install

#build common
WORKDIR /usr/build/common
RUN npm run build

#build client
WORKDIR /usr/build/client
RUN npm run build

#build server
WORKDIR /usr/build/server
RUN npm run build

FROM node:24-slim AS final

ENV NODE_ENV production

# Expose the port that the application listens on.
EXPOSE 8000

WORKDIR /usr/app/

COPY --from=build /usr/build/server/package.json .
RUN npm install --omit=dev
COPY --from=build /usr/build/server/dist server
COPY --from=build /usr/build/client/dist client

WORKDIR /usr/app/server

# Run the application as a non-root user.
USER node
# Run the server application.
CMD node index.js
