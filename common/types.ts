
export type FileEntryType = "file" | "folder" | "root"

export interface FileOrDir {
    type: FileEntryType
    name: string
    ext: string
    mimeType: string
    size: number
    path: string
}

export interface FileEntry {
    name: string
    size: number
    path: string
}

export interface ConfigFolder {
    entries: FileOrDir[]
    title: string
}

export interface SavedAudio {
    name: string
    ext: string
    folderPath: string
    filePath: string
    audioProcess: number
}

export type PlayingState = "playing" | "paused" | "ended"