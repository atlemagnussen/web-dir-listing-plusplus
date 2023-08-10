import dotenv from "dotenv"
import path from "path"

const environment = process.env.NODE_ENV ?? ""
console.log("env", environment)

const envFile = environment ? `.env.${environment}` : ".env"
const envFilePath = path.join(process.cwd(), "..", envFile)
console.log(`environment: ${environment}, envFilePath: ${envFilePath}`)

const config = dotenv.config({ path: envFilePath})
console.log(config)

const portStr = process.env.PORT as string
const port = portStr ? parseInt(portStr) : 8000

const title = process.env.TITLE ? process.env.TITLE : "Dir list++"

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
    title,
    port,
    libPaths
}

