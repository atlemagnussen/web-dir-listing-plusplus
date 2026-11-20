import { playingState, playingFile, content, autoPlayEnabled } from "@app/stores/filesStore"
import { ConfigFolder, FileOrDir, PlayingState } from "@common/types"
import { gotoSelectFile } from "./locationLoader"
import * as db from "../stores/database"

let autoPlay = false
autoPlayEnabled.subscribe(ap => autoPlay = ap)

let state: PlayingState = "paused"
playingState.subscribe(st => {
    state = st
    console.log("playing state", state)
    if (state == "ended" && autoPlay)
        playNextAudio()
})

let file: FileOrDir = {name: "", ext: "", path: "", type: "file", size: 0, mimeType: ""}
playingFile.subscribe(fil => file = fil)

let contFolder:ConfigFolder = {title: "", entries: []}
content.subscribe(c => contFolder = c) 


async function playNextAudio() {
    if (contFolder.entries.length < 1)
        return
    
    if (!file.name || !file.path || !file.ext)
        return
    
    let nextFile: FileOrDir | null = null

    let foundOrNull = false
    while (!foundOrNull) {
        nextFile = findNextFile(nextFile ?? file, contFolder.entries)
        if (!nextFile)
            foundOrNull = true
        else {
            const isAudio = nextFile.mimeType.startsWith("audio")
            if (isAudio)
                foundOrNull = true
        }
    }
    if (nextFile) {
        // reset progression on autoplay
        await db.saveAudioItem(nextFile.path, 0)
        gotoSelectFile(nextFile)
    }
}



function findNextFile(file: FileOrDir, entries: FileOrDir[]) {
    
    const index = entries.findIndex(f=> 
        f.type == "file"
        && f.name == file.name 
        && f.path == file.path 
        && f.ext == file.ext
        && f.size == file.size
        )
    if (index == -1)
        return null
    
    if (index === (entries.length -1))
        return null
    
    return entries[index+1]
}