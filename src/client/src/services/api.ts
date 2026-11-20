import { Store } from "./store"
import type { AppInfo, Entry, Listing, Progress, ProgressUpdate, Tracker } from "./types"

/** Encodes each segment of a virtual path for use in a URL, keeping the slashes. */
export function encodePath(virtualPath: string) {
    return virtualPath.split("/").filter(Boolean).map(encodeURIComponent).join("/")
}

export const fileUrl = (path: string) => `/api/file/${encodePath(path)}`
export const downloadUrl = (path: string) => `${fileUrl(path)}?download=true`
export const zipUrl = (path: string) => `/api/zip/${encodePath(path)}`

export function login() {
    const returnUrl = location.pathname + location.search
    location.href = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T | undefined> {
    const res = await fetch(url, { credentials: "same-origin", ...init })
    if (res.redirected && !new URL(res.url).pathname.startsWith("/api/")) {
        // A front door (BunkerWeb antibot) redirected the API call to its challenge page.
        // Reload so the browser passes the challenge as a normal page navigation.
        location.reload()
        throw new Error("Redirected by proxy")
    }
    if (res.status === 401) {
        // Session expired: full-page login, then back here.
        login()
        throw new Error("Not logged in")
    }
    if (res.status === 404)
        throw new NotFoundError(url)
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`)
    if (res.status === 204)
        return undefined
    return res.json() as Promise<T>
}

export class NotFoundError extends Error {}

/** Bumped whenever progress is written, so views showing progress can refresh. */
export const progressChanged = new Store(0)

export const getAppInfo = () => request<AppInfo>("/api/me") as Promise<AppInfo>

export const getListing = (path: string) =>
    request<Listing>(`/api/list/${encodePath(path)}`) as Promise<Listing>

export const search = (q: string) =>
    request<Entry[]>(`/api/search?q=${encodeURIComponent(q)}`) as Promise<Entry[]>

export const getProgress = (path: string) =>
    request<Progress>(`/api/progress?path=${encodeURIComponent(path)}`)

export const getTracker = () => request<Tracker>("/api/tracker") as Promise<Tracker>

/**
 * keepalive lets the request finish while the page is being hidden/closed.
 * Doesn't notify views by itself: the player saves every 15 s and calls notifyProgressChanged()
 * only when something visible changes (a track starts being tracked, or finishes).
 */
export const saveProgress = (update: ProgressUpdate, keepalive = false) =>
    request<Progress>("/api/progress", {
        method: "POST", // not PUT: the BunkerWeb front door only allows GET|POST|HEAD
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
        keepalive,
    })

/** Tell progress-showing views to refresh. */
export const notifyProgressChanged = () => progressChanged.set(progressChanged.value + 1)
const bump = notifyProgressChanged

const postJson = <T>(url: string, body: unknown) =>
    request<T>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

/** File, or all chapter files of a folder audiobook. */
export const setFinished = (path: string, finished: boolean) =>
    postJson<void>("/api/progress/finished", { path, finished }).then(bump)

/** File, or all files directly in a folder. */
export const resetProgress = (path: string) =>
    postJson<void>("/api/progress/reset", { path }).then(bump)
