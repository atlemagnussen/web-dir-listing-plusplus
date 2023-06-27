
import { parseFile, orderTags } from "music-metadata"
import mime from "mime-types"
import { glob } from "glob"

const lib = "C:/Users/atlmag/Downloads/"
const search = "FAKT*.*"

const term = lib + search

async function perform2() {
    const files = await glob(term, {
        nocase: true
    })
    console.log(files)
}



const filepath = "/Users/atle/Downloads/Audio/Explorer.01.-.Communication.with.Non-Physical.Entities.mp3"

const perform = async () => {
    const info = await parseFile(filepath)
    console.log(info)
}

perform()