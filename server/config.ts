import dotenv from "dotenv"
dotenv.config()

export default {
    port: process.env.PORT,
    libPath: process.env.LIBPATH as string
}