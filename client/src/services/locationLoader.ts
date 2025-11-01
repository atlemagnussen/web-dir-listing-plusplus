import { setContent, setPlayingFile } from "@wdl/client/stores/fileStore.js"
import { getFolderContent } from "@wdl/client/stores/server.js"
import { ConfigFolder, FileOrDir } from "@wdl/common"
import { splitFileName } from "./helpers.js"
import { authUser } from "@wdl/client/stores/user.js"

const state = {
    path: window.location.pathname,
    params: new URLSearchParams(window.location.search)
}

authUser.subscribe(u => {
    if (u.accessToken)
        loadContentFromPath()
})

let content: ConfigFolder = {title:"", entries:[]}

async function loadContentFromPath() {
    content = await getFolderContent(state.path)
    setContent(content)
    getFileFromParams(state.params)
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
    gotoHref(href)
}

export const gotoHref = (href: string) => {
    const url = new URL(`${window.location.origin}${href}`)
    
    state.path = url.pathname
    if (url.search)
        state.params = url.searchParams
    
    loadContentFromPath()
    pushHrefToHistory(href)
}

export function gotoSelectFile(file: FileOrDir) {
    const filename = `${file.name}.${file.ext}`
    let p = new URLSearchParams()
    p.append("file", filename)
    
    let shouldReloadCont = false
    let folderPath = state.path
    if (file.folderPath && file.folderPath !== state.path) {
        shouldReloadCont = true
        if (file.folderPath.startsWith("/"))
            folderPath = file.folderPath
        else
            folderPath = `/${file.folderPath}`
    }
        
    let url = new URL(`${window.location.origin}${folderPath}`)
    url.searchParams.append("file", filename)
    if (shouldReloadCont) {
        state.path = url.pathname
        state.params = url.searchParams
        loadContentFromPath()
    }

    const fullhref = url.toString()
    const href = getHrefWithoutOrigin(fullhref)

    pushHrefToHistory(href)
    getFileFromParams(p)
}

window.addEventListener("popstate", (event: PopStateEvent) => {
    gotoHref(event.state.href)
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