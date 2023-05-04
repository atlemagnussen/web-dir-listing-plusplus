import AdmZip from "adm-zip"
import { splitDir } from "./common"
import path from "path"
import fs from "fs"
import { FileEntry, FileEntryType } from "@common/types"

export const zipAndReturnFolder = (reqpath: string) => {

    const dir = reqpath.replace("/downloadfolder/", "")

    const split = splitDir(dir)
    if (!split)
        return []
    const { root, rootDir, restOfPath } = split

    const fullDirPath = path.join(rootDir, restOfPath)
    const entries = fs.readdirSync(fullDirPath)

    if (!entries || entries.length == 0)
        return null
    
    const files = entries.map(entry => {
        const fullPath = path.join(fullDirPath, entry)
        const stat = fs.statSync(fullPath)
        const type: FileEntryType = stat.isDirectory() ? "folder" : "file"

        if (type == "file") {
            return {
                name: entry,
                path: fullPath,
                size: stat.size
            }
        }
    }).filter(f => f) as FileEntry[]


    if (files.length == 0)
        return null

    console.log("files", files)
    const zip = new AdmZip()
    files.map(f => {
        zip.addLocalFile(f.path)
    })

    return zip.toBuffer()
    
}