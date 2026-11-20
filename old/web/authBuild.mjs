import * as esbuild from "esbuild"

let buildOptions = {
    entryPoints: ["./src/authentication/callbackLogin.ts"],
    bundle: true,
    minify: true,
    logLevel: "info",
    sourcemap: "linked",
    outfile: "public/callbackLogin.js",
    format: "esm"
}

async function doBuild() {
    try {
        await esbuild.build(buildOptions)
        console.log("done building callback")

        buildOptions.entryPoints = ["./src/authentication/popupLogin.ts"]
        buildOptions.outfile = "public/popupLogin.js",
        await esbuild.build(buildOptions)
        console.log("done building popupLogin")

        buildOptions.entryPoints = ["./src/authentication/silentRenew.ts"]
        buildOptions.outfile = "public/silentRenew.js",
        await esbuild.build(buildOptions)
        console.log("done building silentRenew")
    }
    catch (ex) {
        console.error("error during build, now exit", ex)
        process.exit()
    }
}
doBuild().catch(er => {
    console.error(er)
})