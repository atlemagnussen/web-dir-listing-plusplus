import { parseFile, orderTags } from "music-metadata"
import mime from "mime-types"

const filepath = "/Users/atle/Downloads/Audio/Explorer.01.-.Communication.with.Non-Physical.Entities.mp3"

const perform = async () => {
    const info = await parseFile(filepath)
    console.log(info)
}

perform()