# AGENTS.md

Notes for coding agents working in this repo. Keep this file current when the structure changes.

## What this is

This is a self-hosted, all-in-one web app for media files on a NAS. It lets you:

- browse the configured folders and download files, or a whole folder as a zip
- search across all libraries
- stream audio, with per-user listening progress saved on the server (built for audiobooks)
- read EPUBs in a browser reader, with the reading position stored the same way
- track books: a "My books" page with in-progress and finished audiobooks and EPUBs

Login uses OIDC against `https://id.logout.work`, with a server-side cookie session.

## Layout

```
src/
  WebDirListing/            ASP.NET Core 10 app (minimal APIs). Serves the API and the built client.
    Program.cs              wiring, forwarded headers, CSP, auth gate, static files, SPA fallback (order matters, see below)
    Auth/AuthSetup.cs       cookie + OIDC, fallback "authenticated" policy, /auth/* endpoints, DevBypass handler
    Endpoints/ApiEndpoints.cs   all /api routes
    Services/LibraryService.cs  virtual path -> disk path (path-traversal safe), listing, search, MIME types
    Services/ProgressStore.cs   SQLite (Microsoft.Data.Sqlite, raw SQL) per-user, per-file progress
    Services/TrackerService.cs  groups per-file progress into books (folder audiobook / m4b / epub)
    Services/NaturalStringComparer.cs  "Chapter 2" < "Chapter 10"
    Models/                 options + DTOs
    wwwroot/                Vite build output. Gitignored. Never edit it by hand.
  client/                   Lit 3 + Web Awesome 3 SPA (TypeScript, Vite 7)
    src/main.ts             Web Awesome component imports, theme
    src/services/           api.ts (fetch + 401 -> login, progressChanged), router.ts, player.ts (audio + progress sync + Media Session),
                            actions.ts (open entry / continue book), store.ts
    src/components/         app-shell, home-view, folder-view, search-view, tracker-view, tracked-card, entry-list,
                            audio-player, reader-view (foliate-js)
    src/types/foliate.d.ts  minimal typings for foliate-js
    src/stubs/              foliate-pdf.ts replaces foliate-js/pdf.js via a Vite plugin (PDF not supported)
old/                        Previous Node/Express app, its Lit client and the old server.net. Kept as a spec/reference only.
                            Do not build or modify it.
```

## Key design decisions

- **One app.** ASP.NET serves `/api/*`, `/auth/*` and the SPA. `index.html` is returned by `MapFallbackToFile("{*path}", ...)` for any other path, including file-like paths such as `/Books/x.epub` (the reader). The default fallback pattern skips paths with an extension, so it can't be used. Because the catch-all matches everything, `UseRouting()` must come **after** `UseStaticFiles()`: otherwise every request already has the fallback endpoint selected, and static files are never served.
- **Cookie auth, not bearer tokens.** Because the browser holds a cookie, `<audio src>`, download links and zip links are all authenticated. Nothing is public, not even the client's js/css. A middleware in `Program.cs` sends a login challenge to every unauthenticated request except `/auth/*` before static files are served, and the authorization fallback policy covers the endpoints as a second layer. `/api/*` gets a 401 instead of an OIDC redirect, and the client then navigates to `/auth/login?returnUrl=...`.
- **Virtual paths.** A virtual path is `/<LibraryName>/<sub/path>`. The browser URL path is the same as the virtual path (`/Audio/Some%20book`), and the API takes the same path after the route prefix. All filesystem access must go through `LibraryService.Resolve`, which rejects any segment starting with `.` (this covers `..` and hidden entries) and anything that resolves outside the root. Hidden entries are also left out of listings, search and zips. That lets the state folder live inside a library, e.g. `/mnt/media/.webdirlisting` mounted at `/state`.
- **Progress.** The table is `progress(sub, path, folder, position, duration, locator, fraction, finished, updated_at)`, keyed by `(sub, path)`.
  - `sub` is the OIDC subject claim.
  - Audio uses `position` and `duration` in seconds.
  - EPUB uses `locator` (a CFI) and `fraction`.
  - `folder` lets the folder listing attach progress to its entries in one query.
  - "Finished" is a flag; position and fraction are kept, so "mark as not finished" goes back to where you were. Treat finished as 100%.
- **Tracker** (`TrackerService`): books are derived from the per-file rows; nothing is stored per book.
  - An `.epub` is a book.
  - An `.m4b` is a single-file audiobook.
  - All other audio files in one folder form one audiobook, with chapters as files.
  - A folder's fraction is weighted by file size, which tracks duration at a constant bitrate. It's finished when all of its chapter files are.
  - "Continue" picks the most recent unfinished file, or the file after the most recent finished one.
  - Folder listings carry `tracked` for the folder itself and for subfolders that have progress.
- **EPUB reader** (`reader-view.ts`, foliate-js): the URL of an `.epub` file *is* the reader. It saves the CFI 2 seconds after each page turn, and immediately when the page is hidden.
  - foliate-js renders book HTML in `allow-same-origin allow-scripts` iframes. The **CSP header in `Program.cs` (`script-src 'self'`) is the security boundary**; blob iframes inherit it. Never loosen `script-src`.
  - foliate-js is installed from a pinned GitHub tarball (the npm package `foliate-js` is a third-party republish). Update it by changing the commit SHA in `package.json`.
  - Its optional PDF module is stubbed out in `vite.config.ts`.
- **Player** (`client/src/services/player.ts`): a single `Audio()` object outside the DOM, so playback survives navigation. The queue is the audio files of the folder the track was started from.
  - It saves progress every 15 seconds while playing, and on pause, seek and end.
  - When the page is hidden or closed, it saves with `fetch(..., {keepalive: true})`.
  - It resumes from the server position unless the track is marked finished.
  - Media Session handlers drive the lock screen and headset buttons.
  - It calls `notifyProgressChanged()` only when a track is first saved or finishes, not on every 15-second save. Views that show progress subscribe to `progressChanged` and reload.
- **Installable (PWA):** `client/public/manifest.webmanifest` (standalone display, shortcuts to My books and Search), with icons in `client/public/icons/`. The PNGs are rendered from `logo.svg` and `icons/maskable.svg` (full-bleed, glyph inside the safe zone) with headless Chromium; regenerate them if the logo changes. The manifest link uses `crossorigin="use-credentials"` because everything sits behind the cookie. There is no service worker: Chrome doesn't need one to install, and caching would complicate auth.
- **Reserved top-level paths:** `/api`, `/auth`, `/search`, `/tracker`, `/icons`, `/signin-oidc` and `/signout-callback-oidc`. Don't name a library any of these.

## API

| Route | Notes |
|---|---|
| `GET /api/me` | `{ title, user: { sub, name } }` |
| `GET /api/list/{**path}` | Empty path lists the libraries. Folders come first, then natural sort. Hidden dotfiles are skipped. File entries include `progress`; the listing and its subfolders include `tracked` (an aggregate) when they have progress. |
| `GET /api/file/{**path}[?download=true]` | Range requests are supported. |
| `GET /api/zip/{**path}` | Recursive zip, streamed, stored (no compression). |
| `GET /api/search?q=` | Filename match across all libraries, case-insensitive, max 200 results. |
| `GET /api/progress?path=`, `POST`/`PUT /api/progress` | Per-user, per-file progress. |
| `POST /api/progress/finished` `{path, finished}` | For a file, or for all chapter files of a folder. |
| `POST /api/progress/reset` `{path}` | For a file, or for all files directly in a folder. POST, not DELETE, because of BunkerWeb. |
| `GET /api/tracker` | `{ inProgress, finished }`, each a list of `TrackedItem`. |
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
- The response mode is `query`, not `form_post`. Production sits behind BunkerWeb, whose antibot cookie is SameSite=Lax and is not sent on cross-site POSTs, so a form_post callback would be challenged and lost.
- `GET /auth/debug` (anonymous) shows the scheme, host and redirect URI the app sees after forwarded headers are applied.
- BunkerWeb allows only `GET|POST|HEAD` by default, so the client must only use GET and POST. That's why progress is saved with POST.
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

Type-check the client with `npm run typecheck`. There are no automated tests in the repo yet. During development, the end-to-end check was a puppeteer-core script driving `/usr/bin/chromium-browser` against a DevBypass server with generated MP3s and EPUBs. Worth adding as a real test later.

## Conventions

- C#: nullable enabled, minimal APIs, records for DTOs, JSON in camelCase with enums as camelCase strings and nulls omitted.
- TypeScript: no semicolons, double quotes, `.ts` imports without extensions (bundler resolution). Lit uses legacy decorators (`experimentalDecorators`, `useDefineForClassFields: false`).
- Client DTO types in `client/src/services/types.ts` mirror `Models/Dtos.cs`. Keep them in sync.
- Shared state uses `Store<T>` plus `StoreController` (`client/src/services/store.ts`). No RxJS.
- Icons are Web Awesome `<wa-icon name>` (Font Awesome free, loaded from its CDN).

## Not done yet / ideas

- m4b chapter navigation (embedded chapters) and a sleep timer.
- Reader: themes (sepia, dark override), font choice, scrolled mode, highlights and bookmarks.
- Cover images for audiobooks and EPUBs in the tracker.
- Self-hosted icons instead of the CDN.
- Features from `old/` not carried over: the IndexedDB offline cache of positions.
