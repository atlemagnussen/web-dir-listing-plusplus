import { ConfigFolder, FileOrDir, PlayingState } from "@common/types"
import { BehaviorSubject } from "rxjs"

const PlayingSubject = new BehaviorSubject<FileOrDir>({name: "1", ext: "mp3", size: 0, path: "1", type: "file"})
export const playingFile = PlayingSubject.asObservable()
export const setPlayingFile = (file: FileOrDir) => PlayingSubject.next(file)

const AutoplaySubject = new BehaviorSubject(false)
export const autoPlayEnabled = AutoplaySubject.asObservable()
export const setAutoPlay = (val: boolean) => AutoplaySubject.next(val)

const PlayingStateSubject = new BehaviorSubject<PlayingState>("paused")
export const playingState = PlayingStateSubject.asObservable()
export const setPlayingState = (state: PlayingState) => PlayingStateSubject.next(state)

const contentSubject = new BehaviorSubject<ConfigFolder>({title: "lib dir", entries: []})
export const content = contentSubject.asObservable()
export const setContent = (content: ConfigFolder) => contentSubject.next(content)