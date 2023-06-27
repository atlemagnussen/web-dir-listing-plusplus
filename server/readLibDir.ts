import fs from "fs"
import path from "path"
import config from "./config"
import { splitDir } from "./common"
import { FileOrDir, FileEntryType, ConfigFolder } from "@common/types"
import mime from "mime-types"

const rootFolder = __dirname
const htmlFilePath = path.join(rootFolder, "index.html")

const readDir = (dir: string) => {

    console.log("readDir:Start", dir)
    const split = splitDir(dir)
    if (!split)
        return []
    const { root, rootDir, restOfPath } = split

    const fullDirPath = path.join(rootDir, restOfPath)
    const entries = fs.readdirSync(fullDirPath)

    const entriesTyped = entries.map(entry => {
        console.log("entry", entry)
        const fullPath = path.join(fullDirPath, entry)
        let name = entry
        const stat = fs.statSync(fullPath)
        const type: FileEntryType = stat.isDirectory() ? "folder" : "file"
        let ext = ""
        let webpath = fullPath.replace(rootDir, "/downloadfolder/" + root)
        let size = 0
        let mimeType = ""
        if (type == "file") {
            ext = path.extname(fullPath).replace(".", "")
            size = stat.size
            webpath = fullPath.replace(rootDir, "/file/" + root)
            name = entry.replace("."+ext, "")
            let mt = mime.lookup(fullPath)
            if (mt)
                mimeType = mt
        }
        
        return { name, type, ext, size, mimeType, path: webpath, folderPath: dir }
    }) as FileOrDir[]
    console.log("entriesTyped", entriesTyped)
    return entriesTyped
}

const getConfigForDir = (dir:string) => {
    const entries = readDir(dir)
    const title = dir
    const config: ConfigFolder = {
        title,
        entries
    }
    return config
}

const getConfigRoot = (): ConfigFolder => {

    const entries: FileOrDir[] = Object.keys(config.libPaths).map(l => {
        //const path = config.libPaths[l]
        return {
            type: "root",
            name: l,
            path: l,
            size: 0,
            ext: "",
            mimeType: ""
        }
    })

    return {
        title: config.title,
        entries
    }
}

export const getFolderContent = (dir: string) => {
    let config: ConfigFolder
    if (!dir || dir == "/" || dir == "")
        config = getConfigRoot()
    else
        config = getConfigForDir(dir)
    return config
}

export const generateHtmlFromDir = (dir: string) => {
    let html = fs.readFileSync(htmlFilePath, 'utf8')

    const config = getFolderContent(dir)
    const confStr = `const config = ${JSON.stringify(config)};`
    const jsToInject = `${confStr}\ndirListApp.config = config;\n`
    //console.log(jsonToInject)
    
    html = html.replaceAll("<!--$TITLE$-->", config.title)
    html = html.replace("//%script%", jsToInject)

    return html
}
