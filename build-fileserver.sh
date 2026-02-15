#!/usr/bin/env bash

IMAGE_NAME="atlmag/web-dir-listing.net"
COMMIT_HASH=$(git rev-parse --short HEAD)


podman build -f Containerfile-server --tag "$IMAGE_NAME:$COMMIT_HASH" --tag "$IMAGE_NAME:latest"