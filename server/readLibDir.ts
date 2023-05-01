import fs from "fs"
import path from "path"
import config from "./config"
import { FileOrDir, FileEntryType, ConfigFolder } from "@common/types"

const rootFolder = __dirname
const htmlFilePath = path.join(rootFolder, "index.html")

const readDir = (dir: string) => {

    const pathSplit = dir.split("/")

    if (pathSplit.length == 0)
        return []

    const root = pathSplit.shift()
    const rootDir = config.libPaths[root!]

    const restOfPath = pathSplit.join("/")

    const fullDirPath = path.join(rootDir, restOfPath)
    console.log("fullDirPath", fullDirPath)
    const entries = fs.readdirSync(fullDirPath)

    const entriesTyped = entries.map(entry => {
        const fullPath = path.join(fullDirPath, entry)
        let name = entry
        const stat = fs.statSync(fullPath)
        const type: FileEntryType = stat.isDirectory() ? "folder" : "file"
        let ext = ""
        let webpath = ""
        if (type == "file") {
            ext = path.extname(fullPath).replace(".", "")
            webpath = fullPath.replace(config.libPath, "/file")
            name = entry.replace("."+ext, "")
        }
            
        return { name, type, ext, path: webpath }
    }) as FileOrDir[]

    return entriesTyped
}

const getConfigForDir = (dir:string) => {
    const entries = readDir(dir)
    const title = dir == "/" ?  : dir
    const config: ConfigFolder = {
        title,
        entries
    }
    return config
}

const getConfigRoot = (): ConfigFolder => {

    const entries: FileOrDir[] = Object.keys(config.libPaths).map(l => {
        const path = config.libPaths[l]
        return {
            type: "root",
            name: l,
            path,
            ext: ""
        }
    })

    return {
        title: "Audio lib",
        entries
    }
}

export const generateHtmlFromDir = (dir: string) => {
    let html = fs.readFileSync(htmlFilePath, 'utf8')

    let config: ConfigFolder
    if (!dir || dir == "/" || dir == "")
        config = getConfigRoot()
    else
        config = getConfigForDir(dir)

    const confStr = `const config = ${JSON.stringify(config)};`
    const jsToInject = `${confStr}\naudioApp.config = config;\n`
    //console.log(jsonToInject)
    
    html = html.replaceAll("<!--$TITLE$-->", config.title)
    html = html.replace("//%script%", jsToInject)

    return html
}
