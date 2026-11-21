# web dir listing++

A self-hosted web app for your media folders. Browse and download files, stream audio and read EPUBs in the browser, with your progress tracked per book on the server, so you can pick up on any device. Login is via OpenID Connect.

ASP.NET Core 10 backend + Lit/Web Awesome frontend, shipped as a single container.

## Run with podman/docker

```sh
./build-container.sh

podman run -d --name web-dir-listing -p 8000:8080 \
  -e Library__Title="My library" \
  -e Library__Paths__Audiobooks=/data/audiobooks \
  -e Library__Paths__Books=/data/epub \
  -v /mnt/media:/data:ro \
  -v wdl-state:/state \
  atlmag/web-dir-listing
```

- `/data`: your media, mounted read-only. Each `Library__Paths__<Name>` becomes a top-level folder in the app.
- `/state`: writable folder for the SQLite database with listening and reading progress.
- OIDC: `Oidc__Authority` (your provider's issuer URL) is required. The client defaults to `web`; override with `Oidc__ClientId` and `Oidc__ClientSecret`. Register `https://<your-host>/signin-oidc` as a redirect URI.

## Develop

```sh
cp src/WebDirListing/appsettings.Local.example.json src/WebDirListing/appsettings.Local.json   # edit paths
cd src/client && npm ci && npm run build
cd ../WebDirListing && dotnet run     # http://localhost:5268
```

See [AGENTS.md](AGENTS.md) for the architecture. The previous Node-based version is kept under [old/](old/) for reference.
