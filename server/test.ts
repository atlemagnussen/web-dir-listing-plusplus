import { glob } from "glob"

const lib = "C:/Users/atlmag/Downloads/"
const search = "FAKT*.*"

const term = lib + search

async function perform() {
    const files = await glob(term, {
        nocase: true
    })
    console.log(files)
}

perform()