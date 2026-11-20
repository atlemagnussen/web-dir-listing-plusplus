import type { AppInfo, Entry, Listing, Progress, ProgressUpdate } from "./types"

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

export const getAppInfo = () => request<AppInfo>("/api/me") as Promise<AppInfo>

export const getListing = (path: string) =>
    request<Listing>(`/api/list/${encodePath(path)}`) as Promise<Listing>

export const search = (q: string) =>
    request<Entry[]>(`/api/search?q=${encodeURIComponent(q)}`) as Promise<Entry[]>

export const getProgress = (path: string) =>
    request<Progress>(`/api/progress?path=${encodeURIComponent(path)}`)

export const getRecent = (limit = 10) =>
    request<Progress[]>(`/api/progress/recent?limit=${limit}`) as Promise<Progress[]>

/**
 * keepalive lets the request finish while the page is being hidden/closed.
 * (sendBeacon would also work now that auth is a cookie, but can't do PUT.)
 */
export const saveProgress = (update: ProgressUpdate, keepalive = false) =>
    request<Progress>("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
        keepalive,
    })

export const deleteProgress = (path: string) =>
    request<void>(`/api/progress?path=${encodeURIComponent(path)}`, { method: "DELETE" })
