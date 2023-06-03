import { ConfigFolder, FileOrDir } from "@common/types"
import { BehaviorSubject } from "rxjs"

const PlayingSubject = new BehaviorSubject<FileOrDir>({name: "", ext: "", size: 0, path: "", type: "file"})

export const playingFile = PlayingSubject.asObservable()

export const setPlayingFile = (file: FileOrDir) => {
    PlayingSubject.next(file)
}

const contentSubject = new BehaviorSubject<ConfigFolder>({title: "lib dir", entries: []})
export const content = contentSubject.asObservable()
export const setContent = (content: ConfigFolder) => {
    contentSubject.next(content)
}