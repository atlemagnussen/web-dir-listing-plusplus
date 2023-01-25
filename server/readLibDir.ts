import fs from "fs"
import path from "path"
import config from "./config"

const rootFolder = __dirname
const htmlFilePath = path.join(rootFolder, "index.html")

type FileEntryType = "file" | "folder"
interface FileOrDir {
    type: FileEntryType
    name: string
    ext: string
    webpath: string
}

const readDir = (dir: string) => {

    const fullDirPath = path.join(config.libPath, dir)
    console.log("fullDirPath", fullDirPath)
    const entries = fs.readdirSync(fullDirPath)

    const entriesTyped = entries.map(name => {
        const fullPath = path.join(fullDirPath, name)
        const stat = fs.statSync(fullPath)
        const type: FileEntryType = stat.isDirectory() ? "folder" : "file"
        let ext = ""
        let webpath = ""
        if (type == "file") {
            ext = path.extname(fullPath).replace(".", "")
            webpath = fullPath.replace(config.libPath, "/file")
        }
            
        return { name, type, ext, webpath }
    }) as FileOrDir[]

    return entriesTyped
}

const getHtmlFromDir = (dir: string): string => {
    const dirEntries = readDir(dir)

    if (dirEntries.length == 0)
        return "<p>Empty folder</p>"
    
    const tags = dirEntries.map(e => {
        if (e.type == "folder")
            return `<a href="${e.name}/">${e.name}</a>`
        
        
        return `<label>${e.name}</label>
        <audio controls src="${e.webpath}" type="${e.ext}"></audio>`
    })

    return tags.join()
}

export const generateHtmlFromDir = (dir: string) => {
    let html = fs.readFileSync(htmlFilePath, 'utf8')

    const htmlToInject = getHtmlFromDir(dir)

    html = html.replaceAll("<!--$TITLE$-->", dir == "/" ? "Audio lib" : dir)
    html = html.replace("<!--%BODY%-->", htmlToInject)

    return html
}
