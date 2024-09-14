import dotenv from "dotenv"
import path from "path"

const environment = process.env.NODE_ENV ?? ""
console.log("env", environment)

if (environment != "production") {
    const envFile = environment ? `.env.${environment}` : ".env"
    const envFilePath = path.join(process.cwd(), "..", envFile)
    console.log(`environment: ${environment}, envFilePath: ${envFilePath}`)
    
    const config = dotenv.config({ path: envFilePath})
    console.log(config)
}

const portStr = process.env.PORT as string
const port = portStr ? parseInt(portStr) : 8000

const title = process.env.TITLE ? process.env.TITLE : "Dir list++"

const libPathsStr = process.env.LIBPATHS as string
let libPathsTemp: Record<string, string> | undefined
if (libPathsStr) {

    // try json structure first
    try {
        const libPathsJson = JSON.parse(libPathsStr) as Record<string, string>
        console.log("libpathJson", libPathsJson)
        libPathsTemp = libPathsJson
    }
    catch(e) {
        console.log("could not parse as JSON")
    }

    if (!libPathsTemp) {
        // try array for container config
        const libArr = libPathsStr.split(",")
        if (libArr.length > 0) {
            libPathsTemp = {}
            for (let i = 0; i < libArr.length; i++) {
                const name = libArr[i]
                libPathsTemp[name] = `/data/${name}`
            }
        }
        else
            libPathsTemp = { "root": "/data" }
    }
    
}

const libPaths: Record<string, string> = libPathsTemp as Record<string, string> 

export default {
    title,
    port,
    libPaths
}

