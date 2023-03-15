import fs from "fs"
import path from "path"
import config from "./config"
import { FileOrDir, FileEntryType, ConfigFolder } from "@common/types"

const rootFolder = __dirname
const htmlFilePath = path.join(rootFolder, "index.html")

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

const getConfigForDir = (dir:string) => {
    const entries = readDir(dir)
    const title = dir == "/" ? "Audio lib" : dir
    const config: ConfigFolder = {
        title,
        entries
    }
    const strConf = JSON.stringify(config)
    
    return `const config = ${strConf};\n`
}

export const generateHtmlFromDir = (dir: string) => {
    let html = fs.readFileSync(htmlFilePath, 'utf8')

    // const htmlToInject = getHtmlFromDir(dir)
    const jsonStr = getConfigForDir(dir)
    const jsToInject = `${jsonStr} audioApp.config = config;\n`
    //console.log(jsonToInject)
    
    html = html.replace("//%script%", jsToInject)

    return html
}
