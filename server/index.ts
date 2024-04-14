import path from "path"
import express from "express"
import bodyParser from "body-parser"
import config from "./config"
import { serveStream } from "./serveAudio"
import { getFolderContent } from "./readLibDir"
import { zipAndReturnFolder } from "./zipFolder"
import { SearchRequest } from "@common/types"
import { searchFile } from "./searchFiles"

const app = express()
app.use(bodyParser.json()) 

const rootFolder = __dirname
console.log("rootFolder", rootFolder)
const web = path.resolve("..", "web/dist")
const webIndex = path.resolve(web, "index.html")

console.log("libdirs", config.libPaths)

//app.use('/static', express.static(web))

app.put("/searchfiles", async (req, res) => {
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

app.get("/downloadfolder/*", (req, res) => {
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

app.post("*", (req, res) => {
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

let port = config.port ? config.port : 5000
app.listen(port, '::', () => {
    console.log(`[server]: Server is running at http://localhost:${port}`)
})
