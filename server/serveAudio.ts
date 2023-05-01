import fs from "fs"
import path from "path"
import mime from "mime-types"
import type { Request, Response } from "express"
import { splitDir } from "./common"


const getRangeStream = (res: Response, filePath: string, mimeType: string, size: number, range: string) => {

    const parts = range.replace(/bytes=/, "").split("-")

    const partial_start = parts[0]
    const partial_end = parts[1]

    ///@ts-ignore
    if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
        return res.sendStatus(500)
    }
    
    const start = parseInt(partial_start, 10)
    const end = partial_end ? parseInt(partial_end, 10) : size - 1

    var content_length = (end - start) + 1

    res.status(206).header({
        'Content-Type': mimeType,
        'Content-Length': content_length,
        'Content-Range': "bytes " + start + "-" + end + "/" + size
    })
 
    let readStream = fs.createReadStream(filePath, {start: start, end: end})
    readStream.pipe(res)
}

const getStream = (res: Response, filePath: string, mimeType: string, size: number) => {
    res.header({
        'Content-Type': mimeType,
        'Content-Length': size
    })
    let readStream = fs.createReadStream(filePath)
    readStream.pipe(res)
}
 
export const serveStream = (req: Request, res: Response, filePath: string) => {
    
    filePath = filePath.replace("/file/", "")

    const split = splitDir(filePath)
    if (!split)
        return []
    const { root, rootDir, restOfPath } = split

    const fullPath = path.join(rootDir, restOfPath)
    console.log("file fullpath", fullPath)

    const stat = fs.statSync(fullPath)
    console.log("filestat.size", stat.size)

    let mimeType = mime.lookup(fullPath)
    if (!mimeType) {
        console.warn("Could not find mimeType, set to mpeg")
        mimeType = "audio/mpeg"
    }
    console.log("mimeType", mimeType)

    const range = req.headers.range
    console.log("any range", range)

    if (range)
        return getRangeStream(res, fullPath, mimeType, stat.size, range)
    return getStream(res, fullPath, mimeType, stat.size)
}
