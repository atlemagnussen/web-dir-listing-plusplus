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
    /** Folders: aggregated audiobook progress. */
    tracked?: TrackedItem
}

export interface Listing {
    title: string
    path: string
    entries: Entry[]
    tracked?: TrackedItem
}

export type TrackedKind = "audiobook" | "book"

/** An EPUB, a single-file audiobook (m4b) or a folder of audio files. See TrackerService.cs. */
export interface TrackedItem {
    kind: TrackedKind
    /** Folder (multi-file audiobook) or file path. */
    path: string
    title: string
    folder: string
    fraction: number
    finished: boolean
    /** File to continue with. */
    currentPath?: string
    position?: number
    duration?: number
    locator?: string
    files: number
    finishedFiles: number
    updatedAt: string
}

export interface Tracker {
    inProgress: TrackedItem[]
    finished: TrackedItem[]
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
