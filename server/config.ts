import dotenv from "dotenv"

const environment = process.env.NODE_ENV ?? ""
console.log("env", environment)
const envFile = environment ? `.env.${environment}` : ".env"
console.log(`environment: ${environment}, envFile: ${envFile}`)

dotenv

const config = dotenv.config({ path: envFile})
console.log(config)

export default {
    port: parseInt(process.env.PORT as string),
    libPath: process.env.LIBPATH as string
}
