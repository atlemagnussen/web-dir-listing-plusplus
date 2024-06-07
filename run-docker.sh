#!/usr/bin/env sh

docker run --env-file .env.prod -d --rm -p 5000:5000 web-dir-listing