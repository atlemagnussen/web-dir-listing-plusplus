import { setContent } from "@app/stores/fileSelectedStore"
import { getFolderContent } from "@app/stores/server"

let path = window.location.pathname
// const params = new URLSearchParams(window.location.search)

async function loadContentFromPath() {
    const content = await getFolderContent(path)
    console.log("content", content)
    setContent(content)
}

loadContentFromPath()


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