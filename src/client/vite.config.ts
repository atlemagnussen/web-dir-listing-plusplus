import { defineConfig } from "vite"
import { fileURLToPath } from "node:url"

// Builds straight into the ASP.NET app's wwwroot.
const outDir = fileURLToPath(new URL("../WebDirListing/wwwroot", import.meta.url))
const backend = process.env.BACKEND_URL ?? "http://localhost:5268"

export default defineConfig({
    build: {
        outDir,
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        port: 5173,
        // Dev with HMR: API calls go to the ASP.NET app. Works best with Oidc:DevBypass,
        // since the OIDC redirect would otherwise point at the backend's own host.
        proxy: {
            "/api": backend,
            "/auth": backend,
            "/signin-oidc": backend,
            "/signout-callback-oidc": backend,
        },
    },
})
