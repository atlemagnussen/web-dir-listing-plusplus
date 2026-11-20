# AGENTS.md

Notes for coding agents working in this repo. Keep this file current when the structure changes.

## What this is

This is a self-hosted, all-in-one web app for media files on a NAS. It lets you:

- browse the configured folders and download files, or a whole folder as a zip
- search across all libraries
- stream audio, with per-user listening progress saved on the server (built for audiobooks)
- read EPUBs in a browser reader (planned next), with reading progress stored the same way

Login uses OIDC against `https://id.logout.work`, with a server-side cookie session.

## Layout

```
src/
  WebDirListing/            ASP.NET Core 10 app (minimal APIs). Serves the API and the built client.
    Program.cs              wiring, forwarded headers, static files, SPA fallback
    Auth/AuthSetup.cs       cookie + OIDC, fallback "authenticated" policy, /auth/* endpoints, DevBypass handler
    Endpoints/ApiEndpoints.cs   all /api routes
    Services/LibraryService.cs  virtual path -> disk path (path-traversal safe), listing, search, MIME types
    Services/ProgressStore.cs   SQLite (Microsoft.Data.Sqlite, raw SQL) per-user progress
    Services/NaturalStringComparer.cs  "Chapter 2" < "Chapter 10"
    Models/                 options + DTOs
    wwwroot/                Vite build output. Gitignored. Never edit it by hand.
  client/                   Lit 3 + Web Awesome 3 SPA (TypeScript, Vite 7)
    src/main.ts             Web Awesome component imports, theme
    src/services/           api.ts (fetch + 401 -> login), router.ts, player.ts (audio + progress sync + Media Session), store.ts
    src/components/         app-shell, home-view, folder-view, search-view, entry-list, audio-player
old/                        Previous Node/Express app, its Lit client and the old server.net. Kept as a spec/reference only.
                            Do not build or modify it.
```

## Key design decisions

- **One app.** ASP.NET serves `/api/*`, `/auth/*` and the SPA. `index.html` is returned by `MapFallbackToFile` for any other path.
- **Cookie auth, not bearer tokens.** Because the browser holds a cookie, `<audio src>`, download links and zip links are all authenticated. Nothing is public, not even the client's js/css. A middleware in `Program.cs` sends a login challenge to every unauthenticated request except `/auth/*` before static files are served, and the authorization fallback policy covers the endpoints as a second layer. `/api/*` gets a 401 instead of an OIDC redirect, and the client then navigates to `/auth/login?returnUrl=...`.
- **Virtual paths.** A virtual path is `/<LibraryName>/<sub/path>`. The browser URL path is the same as the virtual path (`/Audio/Some%20book`), and the API takes the same path after the route prefix. All filesystem access must go through `LibraryService.Resolve`, which rejects `..` and anything that resolves outside the root.
- **Progress.** The table is `progress(sub, path, folder, position, duration, locator, fraction, finished, updated_at)`, keyed by `(sub, path)`.
  - `sub` is the OIDC subject claim.
  - Audio uses `position` and `duration` in seconds.
  - EPUB will use `locator` (a CFI) and `fraction`.
  - `folder` lets the folder listing attach progress to its entries in one query.
  - `recent` returns the latest unfinished item per folder.
- **Player** (`client/src/services/player.ts`): a single `Audio()` object outside the DOM, so playback survives navigation. The queue is the audio files of the folder the track was started from.
  - It saves progress every 15 seconds while playing, and on pause, seek and end.
  - When the page is hidden or closed, it saves with `fetch(..., {keepalive: true})`.
  - It resumes from the server position unless the track is marked finished.
  - Media Session handlers drive the lock screen and headset buttons.
- **Reserved top-level paths:** `/api`, `/auth`, `/search`, `/signin-oidc` and `/signout-callback-oidc`. Don't name a library any of these.

## API

| Route | Notes |
|---|---|
| `GET /api/me` | `{ title, user: { sub, name } }` |
| `GET /api/list/{**path}` | Empty path lists the libraries. Folders come first, then natural sort. Hidden dotfiles are skipped. File entries include `progress`. |
| `GET /api/file/{**path}[?download=true]` | Range requests are supported. |
| `GET /api/zip/{**path}` | Recursive zip, streamed, stored (no compression). |
| `GET /api/search?q=` | Filename match across all libraries, case-insensitive, max 200 results. |
| `GET /api/progress?path=`, `PUT /api/progress`, `DELETE /api/progress?path=`, `GET /api/progress/recent?limit=` | Per-user progress. |
| `GET /auth/login?returnUrl=`, `GET /auth/logout` | |

## Configuration

Standard ASP.NET configuration: `appsettings.json`, then `appsettings.{Env}.json`, then `appsettings.Local.json` (gitignored), then environment variables.

```jsonc
"Library": {
  "Title": "Web dir listing",
  "StateDir": "state",               // SQLite db + DataProtection keys (cookie encryption), relative to content root; /state in the container
  "Paths": { "Audio": "/abs/path" }  // env: Library__Paths__Audio=/data/audio
},
"Oidc": {
  "Authority": "https://id.logout.work",
  "ClientId": "web",
  "ClientSecret": null,
  "Scopes": ["openid", "profile", "file"],
  "DevBypass": false                 // only honoured when ASPNETCORE_ENVIRONMENT=Development
}
```

`DevBypass` signs every request in as `sub=dev-user`. Use it for local testing; see `appsettings.Local.example.json`.

OIDC notes:
- PAR is disabled because id.logout.work advertises it but returns 400 for the public `web` client.
- The redirect URI is `<origin>/signin-oidc` and must be registered at the IdP for each host.
- Behind a reverse proxy the app trusts `X-Forwarded-For/Proto/Host`, so the redirect URI uses the public https host.

## Build & run

```sh
# client -> src/WebDirListing/wwwroot
cd src/client && npm ci && npm run build      # or: npm run watch

# server
cd src/WebDirListing && dotnet run             # http://localhost:5268 (Development)

# client dev server with HMR (proxies /api and /auth to :5268); best with DevBypass
cd src/client && npm run dev                   # http://localhost:5173

# container (multi-stage: node builds client, dotnet publishes)
./build-container.sh
podman run -d -p 8000:8080 --env-file .env.prod \
  -v /mnt/media:/data:ro -v wdl-state:/state atlmag/web-dir-listing
```

Type-check the client with `npm run typecheck`. There are no automated tests yet.

## Conventions

- C#: nullable enabled, minimal APIs, records for DTOs, JSON in camelCase with enums as camelCase strings and nulls omitted.
- TypeScript: no semicolons, double quotes, `.ts` imports without extensions (bundler resolution). Lit uses legacy decorators (`experimentalDecorators`, `useDefineForClassFields: false`).
- Client DTO types in `client/src/services/types.ts` mirror `Models/Dtos.cs`. Keep them in sync.
- Shared state uses `Store<T>` plus `StoreController` (`client/src/services/store.ts`). No RxJS.
- Icons are Web Awesome `<wa-icon name>` (Font Awesome free, loaded from its CDN).

## Not done yet / ideas

- EPUB reader (foliate-js), storing a CFI in `progress.locator`.
- m4b chapter navigation, sleep timer, marking items finished or unfinished, and clearing progress from the UI.
- Self-hosted icons instead of the CDN.
- Features from `old/` not carried over: the IndexedDB offline cache of positions.
