// Mirrors WebDirListing/Models/Dtos.cs

export type EntryType = "root" | "folder" | "file"

export interface Progress {
    path: string
    position?: number
    duration?: number
    locator?: string
    fraction?: number
    finished: boolean
    updatedAt: string
}

export interface Entry {
    type: EntryType
    name: string
    /** Virtual path, e.g. "/Audio/Book/01.mp3" */
    path: string
    ext?: string
    mimeType?: string
    size: number
    modified?: string
    progress?: Progress
}

export interface Listing {
    title: string
    path: string
    entries: Entry[]
}

export interface AppInfo {
    title: string
    user: { sub: string; name?: string }
}

export interface ProgressUpdate {
    path: string
    position?: number
    duration?: number
    locator?: string
    fraction?: number
    finished?: boolean
}
