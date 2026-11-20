import { Store } from "./store"

/**
 * The browser path *is* the virtual library path: "/Audio/Some%20book" -> "/Audio/Some book".
 * "/" is the home view.
 */
export const currentPath = new Store<string>(readPath())

function readPath() {
    const segments = location.pathname.split("/").filter(Boolean).map(decodeURIComponent)
    return "/" + segments.join("/")
}

export function hrefFor(virtualPath: string) {
    return "/" + virtualPath.split("/").filter(Boolean).map(encodeURIComponent).join("/")
}

export function navigate(virtualPath: string) {
    const href = hrefFor(virtualPath)
    if (href !== location.pathname)
        history.pushState(null, "", href)
    currentPath.set(readPath())
    window.scrollTo(0, 0)
}

/** Click handler for <a href> / <wa-button href> links that should navigate inside the app. */
export function linkClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
    const href = (e.currentTarget as Element).getAttribute("href")
    if (!href) return
    e.preventDefault()
    history.pushState(null, "", new URL(href, location.origin).pathname)
    currentPath.set(readPath())
    window.scrollTo(0, 0)
}

window.addEventListener("popstate", () => currentPath.set(readPath()))
