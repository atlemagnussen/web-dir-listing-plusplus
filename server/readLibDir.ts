import fs from "fs"
import path from "path"
import config from "./config"
import { splitDir } from "./common"
import { FileOrDir, FileEntryType, ConfigFolder } from "@common/types"

const rootFolder = __dirname
const htmlFilePath = path.join(rootFolder, "index.html")

const readDir = (dir: string) => {

    const split = splitDir(dir)
    if (!split)
        return []
    const { root, rootDir, restOfPath } = split

    const fullDirPath = path.join(rootDir, restOfPath)
    console.log("fullDirPath", fullDirPath)
    const entries = fs.readdirSync(fullDirPath)

    const entriesTyped = entries.map(entry => {
        console.log("entry", entry)
        const fullPath = path.join(fullDirPath, entry)
        let name = entry
        const stat = fs.statSync(fullPath)
        const type: FileEntryType = stat.isDirectory() ? "folder" : "file"
        let ext = ""
        let webpath = ""
        let size = 0
        if (type == "file") {
            ext = path.extname(fullPath).replace(".", "")
            size = stat.size
            webpath = fullPath.replace(rootDir, "/file/" + root)
            name = entry.replace("."+ext, "")
        }
            
        return { name, type, ext, size, path: webpath }
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
