
export type FileEntryType = "file" | "folder" | "root"

export interface FileOrDir {
    type: FileEntryType
    name: string
    ext: string
    size: number
    path: string
}

export interface ConfigFolder {
    entries: FileOrDir[]
    title: string
}