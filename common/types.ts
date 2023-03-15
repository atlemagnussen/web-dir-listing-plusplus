
export type FileEntryType = "file" | "folder"

export interface FileOrDir {
    type: FileEntryType
    name: string
    ext: string
    webpath: string
}

export interface ConfigFolder {
    entries: FileOrDir[]
    title: string
}