import { setContent, setPlayingFile } from "@app/stores/filesStore"
import { getFolderContent } from "@app/stores/server"
import { ConfigFolder, FileOrDir } from "@common/types"
import { splitFileName } from "./helpers"

let path = window.location.pathname
let params = new URLSearchParams(window.location.search)
let content: ConfigFolder = {title:"", entries:[]}

async function loadContentFromPath() {
    content = await getFolderContent(path)
    setContent(content)
    getFileFromParams(params)
}

function getFileFromParams(parms: URLSearchParams) {
    if (parms.has("file")) {
        const { name, ext } = splitFileName(parms.get("file")!)
        const file = content.entries.find(e => e.name == name && e.ext == ext)
        if (file)
            setPlayingFile(file)
    }
}

export const goto = (e: Event) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLAnchorElement
    const href = getHrefWithoutOrigin(target.href)
    gotoPath(href)
}

export const gotoPath = (p: string) => {
    path = p
    loadContentFromPath()
    pushHrefToHistory(p)
}

export function gotoSelectFile(file: FileOrDir) {
    const filename = `${file.name}.${file.ext}`
    let p = new URLSearchParams()
    p.append("file", filename)
    
    let folderPath = path
    if (file.folderPath) {
        if (file.folderPath.startsWith("/"))
            folderPath = file.folderPath
        else
            folderPath = `/${file.folderPath}`
    }
        

    let url = new URL(`${window.location.origin}${folderPath}`)
    url.searchParams.append("file", filename)
    const fullhref = url.toString()
    const href = getHrefWithoutOrigin(fullhref)
    pushHrefToHistory(href)
    getFileFromParams(p)
}

window.addEventListener("popstate", (event: PopStateEvent) => {
    gotoPath(event.state.href)
})

const pushHrefToHistory = (href: string) => {
    if (!href)
        return
    if (window.location.href != href)
        window.history.pushState({ href }, "", window.location.origin + href)
}

const getHrefWithoutOrigin = (href: string) => {
    const origin = window.location.origin
    const hrefWithOutOrigin = href.replace(origin, "")
    return hrefWithOutOrigin
}

loadContentFromPath()
const href = getHrefWithoutOrigin(window.location.href)
pushHrefToHistory(href)