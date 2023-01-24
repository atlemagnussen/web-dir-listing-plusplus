import path from "path"
import express from "express"
import dotenv from "dotenv"
import { serveStream } from "./serveAudio"


dotenv.config()

const app = express()
const port = process.env.PORT

const rootFolder = __dirname
console.log("rootFolder", rootFolder)
const web = path.resolve("..", "web")


app.use('/static', express.static(web))
app.get('/', (req, res) => {
    res.send("<a href='static'>Client</a>")
})

app.get("/file/*", (req, res) => {
    let filePath = req.path
    console.log("requested file path", filePath)
    filePath = filePath.replace("/file/", "")
    try {
        return serveStream(req, res, filePath)
    } catch (err) {
        console.error(err)
        return res.sendStatus(404)
    }
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
})

