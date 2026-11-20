#!/usr/bin/env bash

IMAGE_NAME="atlmag/web-dir-listing"
COMMIT_HASH=$(git rev-parse --short HEAD)

echo "Podman Build $IMAGE_NAME:$COMMIT_HASH"

podman build -f Containerfile --tag "$IMAGE_NAME:$COMMIT_HASH" --tag "$IMAGE_NAME:latest"
