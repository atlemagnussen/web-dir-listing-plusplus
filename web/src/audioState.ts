import { FileOrDir } from "@common/types"
import { BehaviorSubject } from "rxjs"

const PlayingSubject = new BehaviorSubject<FileOrDir>({name: "", ext: "", size: 0, path: "", type: "file"})

export const playingFile = PlayingSubject.asObservable()

export const setPlayingFile = (file: FileOrDir) => {
    PlayingSubject.next(file)
}