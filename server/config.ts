import dotenv from "dotenv"

const environment = process.env.NODE_ENV ?? ""
const envFile = environment ? `${environment}.env` : ".env"
console.log(`environment: ${environment}, envFile: ${envFile}`)
const config = dotenv.config({ path: envFile})

export default {
    port: parseInt(process.env.PORT as string),
    libPath: process.env.LIBPATH as string
}
