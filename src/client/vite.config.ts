import { defineConfig, type Plugin } from "vite"
import { fileURLToPath } from "node:url"

// Builds straight into the ASP.NET app's wwwroot.
const outDir = fileURLToPath(new URL("../WebDirListing/wwwroot", import.meta.url))
const backend = process.env.BACKEND_URL ?? "http://localhost:5268"

// foliate-js lazily imports ./pdf.js, which uses a URL pattern Vite can't bundle (and pulls in
// pdf.js). We only read EPUBs, so swap it for a stub.
const stubFoliatePdf: Plugin = {
    name: "stub-foliate-pdf",
    enforce: "pre",
    resolveId(source, importer) {
        if (source === "./pdf.js" && importer?.includes("foliate-js"))
            return fileURLToPath(new URL("./src/stubs/foliate-pdf.ts", import.meta.url))
    },
}

export default defineConfig({
    plugins: [stubFoliatePdf],
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
