import config from "./config"
 
export const splitDir = (dir: string) => {
    console.log("splitDir", dir)
    let pathSplit = dir.split("/")

    if (pathSplit.length == 0)
        return null
    pathSplit = pathSplit.filter(p => p)
    if (pathSplit.length == 0)
        return null

    const root = pathSplit.shift()
    const rootDir = config.libPaths[root!]

    const restOfPath = pathSplit.join("/")

    return {
        root, rootDir, restOfPath
    }
}