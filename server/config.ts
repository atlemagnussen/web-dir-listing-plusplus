import dotenv from "dotenv"

const environment = process.env.NODE_ENV ?? ""
console.log("env", environment)
const envFile = environment ? `.env.${environment}` : ".env"
console.log(`environment: ${environment}, envFile: ${envFile}`)

const config = dotenv.config({ path: envFile})
console.log(config)

const portStr = process.env.PORT as string
const port = portStr ? 8000 : parseInt(portStr)

const libPathsStr = process.env.LIBPATHS as string
let libPaths: Record<string, string> = {"Root": libPathsStr}
if (libPathsStr) {
    try {
        const libPathsJson = JSON.parse(libPathsStr) as Record<string, string>
        console.log("libpathJson", libPathsJson)
        libPaths = libPathsJson
    }
    catch(e) {
        console.log("could not parse as JSON")
    }
}

export default {
    port,
    libPaths
}

