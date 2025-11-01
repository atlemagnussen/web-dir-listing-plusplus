import path from "path"
import express from "express"
import bodyParser from "body-parser"
import config from "./config.js"
import { serveStream } from "./serveAudio.js"
import { getFolderContent } from "./readLibDir.js"
import { zipAndReturnFolder } from "./zipFolder.js"
import { SearchRequest } from "@wdl/common"
import { searchFile } from "./searchFiles.js"
import { auth } from "express-oauth2-jwt-bearer"

const app = express()
app.use(bodyParser.json()) 

const rootFolder = process.cwd()
console.log("rootFolder", rootFolder)
const web = path.resolve("..", "client/dist")
const webIndex = path.resolve(web, "index.html")

console.log("libdirs", config.libPaths)

const authorize = auth({
    audience: "webdir",
    issuerBaseURL: "https://id.atle.guru/",
})
//app.use('/static', express.static(web))

app.get("/public", async (req, res) => {
    res.json({ message: "Public endpoint" })
})

app.get("/private", authorize, async (req, res) => {
    res.json({ message: "Private endpoint" })
})

app.put("/searchfiles", authorize, async (req, res) => {
    console.log("search", req.path)
    console.log("body", req.body)
    const searchReq = req.body as SearchRequest
    const files = await searchFile(searchReq.searchTerm)
    res.send(files)
})

app.get("/file/*", (req, res) => {
    let filePath = decodeURI(req.path)
    console.log("requested file path", filePath)
    try {
        return serveStream(req, res, filePath)
    } catch (err) {
        console.error(err)
        return res.sendStatus(404)
    }
})

app.get("/downloadfolder/*", authorize, (req, res) => {
    let filePath = decodeURI(req.path)
    console.log("requested file path", filePath)
    try {
        const zipBuffer = zipAndReturnFolder(filePath)
        res.header({
            "Content-Type": "application/zip",
            "Content-Length": zipBuffer?.length
        })
        res.end(zipBuffer)
    } catch (err) {
        console.error(err)
        return res.sendStatus(404)
    }
})

app.post("*", authorize, (req, res) => {
    let folderPath = decodeURI(req.path)
    console.log("requested folderPath", folderPath)
    const content = getFolderContent(folderPath)
    res.send(content)
})
app.use(express.static(web))

app.get('*', function (req, res) {
    res.sendFile(webIndex)
})

// app.get('*', (req, res) => {
//     let path = decodeURI(req.path)
//     console.log("path*", path)
//     const html = generateHtmlFromDir(path)
//     res.send(html)
// })
if (!config.libPaths)
    throw new Error("missing libpath!!")

let port = config.port ? config.port : 8000
let host = "::"
const server = app.listen(port, host, () => {
    console.log(`[server]: Server is running at http://${host}:${port}`)
})

process.on("SIGTERM", () => {
    console.info("SIGTERM signal received.")
    console.log("Closing http server.")
    server.close(() => {
        console.log("Http server closed.")
        process.exit(0)
    })
})