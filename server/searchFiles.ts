import config from "./config"
import fs from "fs"
import path from "path"
import { glob } from "glob"
import { FileEntryType, FileOrDir } from "@common/types"

interface SearchResLib{
    lib: string
    files: string[]
}

export async function searchFile(searchTerm: string) {
    const libNames = Object.keys(config.libPaths)

    const promises = libNames.map(lib => {
        return searchLib(lib, searchTerm)
    })

    const results = await Promise.all(promises)
    const files = results.map(res => {
        return resultsToTyped(res)
    }).flat(1)
    console.log("files", files)
    return files
}

function resultsToTyped(searchResLib: SearchResLib) {
    const { lib, files } = searchResLib
    const libDir = config.libPaths[lib]
    return files.map(fullPath => {
        let name = path.basename(fullPath)
        
        const stat = fs.statSync(fullPath)
        const type: FileEntryType = stat.isDirectory() ? "folder" : "file"

        let ext = ""
        let webpath = ""
        let folderPath = ""
        let size = 0
        if (type == "file") {
            ext = path.extname(fullPath).replace(".", "")
            folderPath = fullPath.replace(libDir, lib).replace(name, "")
            size = stat.size
            webpath = fullPath.replace(libDir, "/file/" + lib)
            name = name.replace("."+ext, "")
        }
            
        return { name, type, ext, size, path: webpath, folderPath }

    }) as FileOrDir[]
}

async function searchLib(lib: string, searchTerm: string): Promise<SearchResLib> {
    const libDir = config.libPaths[lib]
    const term = `${libDir}/**/*${searchTerm}*`
    console.log("term", term)
    const files = await glob(term, {
        nocase: true
    })
    return {
        lib,
        files
    }
}